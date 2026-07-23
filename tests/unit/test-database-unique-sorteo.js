// tests/unit/test-database-unique-sorteo.js
// Regresión: el mismo sorteo insertado dos veces con formato de fecha
// distinto ("30 de Mayo de 2026" vs "Sábado 30 de Mayo de 2026") ya no debe
// producir dos filas. La restricción UNIQUE es (game, sorteo), no
// (game, sorteo, fecha).
const assert = require('assert');
const db = require('../../src/services/database');

db.initDatabase();

const GAME = 'Miloto';
const SORTEO_TEST = 999999; // fuera del rango real, no debe chocar con datos reales

// Limpieza defensiva por si una corrida previa falló a mitad de camino
const Database = require('better-sqlite3');
const path = require('path');
const raw = new Database(path.join(__dirname, '..', '..', 'data', 'historical.db'));
raw.prepare('DELETE FROM historical_results WHERE game = ? AND sorteo = ?').run(GAME, SORTEO_TEST);

try {
    const first = db.insertResult(GAME, SORTEO_TEST, '30 de Mayo de 2026', [1, 2, 3, 4, 5]);
    const second = db.insertResult(GAME, SORTEO_TEST, 'Sábado 30 de Mayo de 2026', [1, 2, 3, 4, 5]);

    assert.strictEqual(first, true, 'la primera inserción debe aplicarse');
    assert.strictEqual(second, false, 'la segunda inserción (mismo sorteo, fecha con formato distinto) debe ignorarse');

    const rows = raw.prepare('SELECT * FROM historical_results WHERE game = ? AND sorteo = ?').all(GAME, SORTEO_TEST);
    assert.strictEqual(rows.length, 1, 'no debe quedar más de una fila para el mismo (game, sorteo)');
} finally {
    raw.prepare('DELETE FROM historical_results WHERE game = ? AND sorteo = ?').run(GAME, SORTEO_TEST);
    raw.close();
}

console.log('test-database-unique-sorteo: OK');
