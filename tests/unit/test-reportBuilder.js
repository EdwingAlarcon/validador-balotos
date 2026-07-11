// tests/unit/test-reportBuilder.js
const assert = require('assert');
const db = require('../../src/services/database');
const { buildFullReport } = require('../../src/services/reportBuilder');

db.initDatabase();

const report = buildFullReport();

assert.ok(typeof report.resumenEjecutivo === 'string' && report.resumenEjecutivo.length > 0);
assert.ok(report.reglasVerificadas.verifiedAt);
assert.ok(Array.isArray(report.fuentesConsultadas) && report.fuentesConsultadas.length > 0);
assert.ok(Array.isArray(report.limitaciones) && report.limitaciones.length > 0);
assert.ok(typeof report.advertenciaJuegoResponsable === 'string');

['Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto'].forEach(game => {
    assert.ok(report.juegos[game], `falta el juego ${game}`);
});

assert.strictEqual(report.juegos.Baloto.combinaciones.length, 20);
assert.strictEqual(report.juegos.Miloto.combinaciones.length, 20);
assert.strictEqual(report.juegos.Colorloto.combinaciones.length, 20);
assert.strictEqual(report.juegos['Baloto Revancha'].combinacionesReutilizadasDeBaloto.length, 20);
assert.ok(report.juegos['Baloto Revancha'].nota.includes('mismos'));

assert.strictEqual(report.juegos.Baloto.top5.length, 5);
assert.strictEqual(report.juegos.Colorloto.top5.length, 5);

console.log('test-reportBuilder: OK');
