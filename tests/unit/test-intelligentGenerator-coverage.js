// tests/unit/test-intelligentGenerator-coverage.js
const assert = require('assert');
const db = require('../../src/services/database');
const { getColorlotoCoverageStats } = require('../../src/services/intelligentGenerator');

db.initDatabase();

const stats = getColorlotoCoverageStats();

assert.ok(stats.sorteosAnalizados > 0, 'debe haber sorteos analizados en la BD de desarrollo');
assert.ok(stats.pctSeisColoresDistintos >= 0 && stats.pctSeisColoresDistintos <= 100);
assert.strictEqual(stats.porColor.length, 6, 'debe reportar los 6 colores');

const totalDistribucion = Object.values(stats.distribucionColoresDistintos).reduce((a, b) => a + b, 0);
assert.strictEqual(totalDistribucion, stats.sorteosAnalizados, 'la distribución de colores distintos debe sumar el total de sorteos');

stats.porColor.forEach(c => {
    assert.ok(['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'].includes(c.color));
    assert.ok(c.vecesAusente >= 0 && c.vecesAusente <= stats.sorteosAnalizados);
    assert.strictEqual(c.pctAusente, Math.round((c.vecesAusente / stats.sorteosAnalizados) * 1000) / 10);
});

console.log('test-intelligentGenerator-coverage: OK');
