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
    `);

    console.log('✅ Base de datos inicializada correctamente');
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
            superBalota,
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

    query += ' ORDER BY fecha DESC LIMIT ?';
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
    getTotalResults,
    getNumberFrequency,
    getSuperBalotaFrequency,
    getHotColdNumbers,
    getNumberPairs,
    deleteAllResults,
    closeDatabase,
    db, // Exportar instancia para consultas personalizadas
};
