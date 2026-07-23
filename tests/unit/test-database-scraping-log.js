// tests/unit/test-database-scraping-log.js
const assert = require('assert');
const db = require('../../src/services/database');

db.initDatabase();

db.logScrapingRun({
    game: 'Baloto',
    sourceUrl: 'https://www.resultadobaloto.com/',
    status: 'ok',
    sorteosEncontrados: 8,
    sorteosInsertados: 2,
    durationMs: 123,
});

db.logScrapingRun({
    game: 'Baloto',
    sourceUrl: 'https://www.resultadobaloto.com/',
    status: 'error',
    durationMs: 45,
    errorMessage: 'timeout de prueba',
});

const logs = db.getRecentScrapingLogs(2);
assert.strictEqual(logs.length, 2, 'debe devolver las 2 corridas registradas');
assert.strictEqual(logs[0].status, 'error', 'la más reciente (error) debe ir primero');
assert.strictEqual(logs[0].errorMessage, 'timeout de prueba');
assert.strictEqual(logs[1].status, 'ok');
assert.strictEqual(logs[1].sorteosEncontrados, 8);
assert.strictEqual(logs[1].sorteosInsertados, 2);

console.log('test-database-scraping-log: OK');
