const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crear directorio data si no existe
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Crear/abrir base de datos
const dbPath = path.join(dataDir, 'historical.db');
const db = new Database(dbPath);

// Habilitar foreign keys y modo WAL para mejor concurrencia
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ========================================
// CREAR TABLAS
// ========================================

function initDatabase() {
    // Tabla principal de resultados históricos
    db.exec(`
        CREATE TABLE IF NOT EXISTS historical_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game TEXT NOT NULL CHECK(game IN ('Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto')),
            sorteo INTEGER,
            fecha TEXT NOT NULL,
            numeros TEXT NOT NULL,
            superBalota TEXT,
            colorNumberPairs TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            UNIQUE(game, sorteo, fecha)
        )
    `);

    // Índices para búsquedas rápidas
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_game ON historical_results(game);
        CREATE INDEX IF NOT EXISTS idx_sorteo ON historical_results(sorteo);
        CREATE INDEX IF NOT EXISTS idx_fecha ON historical_results(fecha);
        CREATE INDEX IF NOT EXISTS idx_game_fecha ON historical_results(game, fecha);
        CREATE INDEX IF NOT EXISTS idx_game_sorteo ON historical_results(game, sorteo);
    `);

    // Trazabilidad de cada corrida de scraping: qué fuente se consultó, cuándo,
    // con qué resultado. No guarda tokens, cookies ni credenciales — solo
    // metadatos de la corrida (hallazgo BAJO #7 de la auditoría de scraping).
    db.exec(`
        CREATE TABLE IF NOT EXISTS scraping_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game TEXT NOT NULL,
            sourceUrl TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('ok', 'no_data', 'error')),
            sorteosEncontrados INTEGER DEFAULT 0,
            sorteosInsertados INTEGER DEFAULT 0,
            durationMs INTEGER,
            errorMessage TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
        )
    `);
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_scraping_log_game ON scraping_log(game);
        CREATE INDEX IF NOT EXISTS idx_scraping_log_createdAt ON scraping_log(createdAt);
    `);

    migrateUniqueConstraintToGameSorteo();

    console.log('✅ Base de datos inicializada correctamente');
}

// ========================================
// MIGRACIÓN: UNIQUE(game, sorteo, fecha) -> UNIQUE(game, sorteo)
// El texto de "fecha" varía de formato entre corridas de scraping
// (con/sin día de la semana), lo que permitía insertar el mismo
// sorteo dos veces. El número de sorteo ya es único por juego.
// ========================================
function migrateUniqueConstraintToGameSorteo() {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='historical_results'").get();
    if (!tableSql || !tableSql.sql.includes('UNIQUE(game, sorteo, fecha)')) return;

    const migrate = db.transaction(() => {
        db.exec(`
            CREATE TABLE historical_results_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game TEXT NOT NULL CHECK(game IN ('Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto')),
                sorteo INTEGER,
                fecha TEXT NOT NULL,
                numeros TEXT NOT NULL,
                superBalota TEXT,
                colorNumberPairs TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(game, sorteo)
            )
        `);

        // Al deduplicar por (game, sorteo), preferir la fila cuya superBalota
        // ya está bien formada (sin punto decimal) y, en empate, la más reciente.
        const rows = db
            .prepare(
                `SELECT * FROM historical_results
                 ORDER BY game, sorteo,
                          (superBalota IS NOT NULL AND superBalota LIKE '%.%') ASC,
                          id DESC`
            )
            .all();

        const insert = db.prepare(`
            INSERT OR IGNORE INTO historical_results_new
                (id, game, sorteo, fecha, numeros, superBalota, colorNumberPairs, createdAt)
            VALUES (@id, @game, @sorteo, @fecha, @numeros, @superBalota, @colorNumberPairs, @createdAt)
        `);
        const seen = new Set();
        rows.forEach(row => {
            const key = `${row.game}::${row.sorteo}`;
            if (seen.has(key)) return;
            seen.add(key);
            insert.run({ ...row, superBalota: normalizeSuperBalota(row.superBalota) });
        });

        db.exec('DROP TABLE historical_results');
        db.exec('ALTER TABLE historical_results_new RENAME TO historical_results');
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_game ON historical_results(game);
            CREATE INDEX IF NOT EXISTS idx_sorteo ON historical_results(sorteo);
            CREATE INDEX IF NOT EXISTS idx_fecha ON historical_results(fecha);
            CREATE INDEX IF NOT EXISTS idx_game_fecha ON historical_results(game, fecha);
            CREATE INDEX IF NOT EXISTS idx_game_sorteo ON historical_results(game, sorteo);
        `);
    });

    const before = db.prepare('SELECT COUNT(*) as c FROM historical_results').get().c;
    migrate();
    const after = db.prepare('SELECT COUNT(*) as c FROM historical_results').get().c;
    console.log(`🔧 Migración UNIQUE(game,sorteo) aplicada: ${before} -> ${after} registros (${before - after} duplicados eliminados)`);
}

// ========================================
// NORMALIZACIÓN
// ========================================

// La superBalota llegó históricamente en formatos inconsistentes ("16.0", "7",
// "07") según la versión del scraper que la insertó. Se normaliza a entero de
// 2 dígitos con cero a la izquierda para que comparaciones y validaciones de
// longitud sean consistentes.
function normalizeSuperBalota(superBalota) {
    if (superBalota === null || superBalota === undefined || superBalota === '') return null;
    const n = parseInt(superBalota, 10);
    if (isNaN(n)) return null;
    return String(n).padStart(2, '0');
}

// ========================================
// INSERTAR RESULTADOS
// ========================================

function insertResult(game, sorteo, fecha, numeros, superBalota = null, colorNumberPairs = null) {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO historical_results (game, sorteo, fecha, numeros, superBalota, colorNumberPairs)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
        const result = stmt.run(
            game,
            sorteo,
            fecha,
            Array.isArray(numeros) ? numeros.join(',') : numeros,
            normalizeSuperBalota(superBalota),
            colorNumberPairs ? JSON.stringify(colorNumberPairs) : null
        );
        return result.changes > 0;
    } catch (error) {
        console.error('Error insertando resultado:', error.message);
        return false;
    }
}

// ========================================
// CONSULTAR RESULTADOS
// ========================================

function getAllResults(game = null, limit = 100) {
    let query = 'SELECT * FROM historical_results';
    const params = [];

    if (game) {
        query += ' WHERE game = ?';
        params.push(game);
    }

    query += ' ORDER BY sorteo DESC, id DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    return stmt.all(...params);
}

function getResultsByDateRange(game, startDate, endDate) {
    const stmt = db.prepare(`
        SELECT * FROM historical_results
        WHERE game = ? AND fecha >= ? AND fecha <= ?
        ORDER BY fecha DESC
    `);
    return stmt.all(game, startDate, endDate);
}

function getLatestResult(game) {
    const stmt = db.prepare(`
        SELECT * FROM historical_results
        WHERE game = ?
        ORDER BY fecha DESC
        LIMIT 1
    `);
    return stmt.get(game);
}

function getResultByGameAndSorteo(game, sorteoId) {
    const stmt = db.prepare(`
        SELECT * FROM historical_results
        WHERE game = ? AND sorteo = ?
        LIMIT 1
    `);
    return stmt.get(game, parseInt(sorteoId));
}

function getTotalResults(game = null) {
    let query = 'SELECT COUNT(*) as total FROM historical_results';
    const params = [];

    if (game) {
        query += ' WHERE game = ?';
        params.push(game);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params).total;
}

// ========================================
// ESTADÍSTICAS DE FRECUENCIA
// ========================================

function getNumberFrequency(game, limit = null) {
    const results = getAllResults(game, limit || 10000);
    const frequency = {};

    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (!isNaN(num)) {
                frequency[num] = (frequency[num] || 0) + 1;
            }
        });
    });

    // Convertir a array y ordenar por frecuencia
    return Object.entries(frequency)
        .map(([number, count]) => ({ number: parseInt(number), count }))
        .sort((a, b) => b.count - a.count);
}

function getSuperBalotaFrequency(game, limit = null) {
    const results = getAllResults(game, limit || 10000);
    const frequency = {};

    results.forEach(result => {
        if (result.superBalota) {
            const sb = parseInt(result.superBalota);
            if (!isNaN(sb)) {
                frequency[sb] = (frequency[sb] || 0) + 1;
            }
        }
    });

    return Object.entries(frequency)
        .map(([number, count]) => ({ number: parseInt(number), count }))
        .sort((a, b) => b.count - a.count);
}

function getHotColdNumbers(game, limit = null) {
    const frequency = getNumberFrequency(game, limit);
    const total = frequency.reduce((sum, item) => sum + item.count, 0);
    const average = total / frequency.length;

    const hot = frequency.filter(item => item.count > average).slice(0, 10);
    const cold = frequency.filter(item => item.count < average).slice(-10);

    return { hot, cold, average: average.toFixed(2) };
}

// ========================================
// ANÁLISIS DE PARES
// ========================================

function getNumberPairs(game, limit = null) {
    const results = getAllResults(game, limit || 1000);
    const pairs = {};

    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));

        // Generar todos los pares posibles
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                const pair = [numbers[i], numbers[j]].sort((a, b) => a - b).join('-');
                pairs[pair] = (pairs[pair] || 0) + 1;
            }
        }
    });

    return Object.entries(pairs)
        .map(([pair, count]) => ({ pair, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
}

// ========================================
// TRAZABILIDAD DE SCRAPING
// ========================================

function logScrapingRun({ game, sourceUrl, status, sorteosEncontrados = 0, sorteosInsertados = 0, durationMs = null, errorMessage = null }) {
    const stmt = db.prepare(`
        INSERT INTO scraping_log (game, sourceUrl, status, sorteosEncontrados, sorteosInsertados, durationMs, errorMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(game, sourceUrl, status, sorteosEncontrados, sorteosInsertados, durationMs, errorMessage);
}

function getRecentScrapingLogs(limit = 50) {
    const stmt = db.prepare('SELECT * FROM scraping_log ORDER BY id DESC LIMIT ?');
    return stmt.all(limit);
}

// ========================================
// UTILIDADES
// ========================================

function deleteAllResults() {
    const stmt = db.prepare('DELETE FROM historical_results');
    return stmt.run();
}

function closeDatabase() {
    db.close();
    console.log('🔒 Base de datos cerrada');
}

// ========================================
// EXPORTAR MÓDULO
// ========================================

module.exports = {
    initDatabase,
    insertResult,
    getAllResults,
    getResultsByDateRange,
    getLatestResult,
    getResultByGameAndSorteo,
    getTotalResults,
    getNumberFrequency,
    getSuperBalotaFrequency,
    getHotColdNumbers,
    getNumberPairs,
    closeDatabase,
    normalizeSuperBalota,
    logScrapingRun,
    getRecentScrapingLogs,
};
