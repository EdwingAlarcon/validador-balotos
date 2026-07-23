const assert = require('assert');
const { buildColorlotoPortfolio, randomColorloto, createSeededRandom, colorlotoComboKey } = require('../../src/services/portfolioOptimizer');

// Colorloto permite repetir color (con distinto número) o repetir número
// (con distinto color) — solo no se puede repetir la pareja color+número
// exacta (confirmado en baloto.com/colorloto). randomColorloto ya no debe
// forzar los 6 colores distintos.
const pairs = randomColorloto(createSeededRandom(3));
assert.strictEqual(pairs.length, 6);
assert.ok(pairs.every(p => p.number >= 1 && p.number <= 7));
const validColors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
assert.ok(pairs.every(p => validColors.includes(p.color)));
const pairKeys = pairs.map(p => `${p.color}:${p.number}`);
assert.strictEqual(new Set(pairKeys).size, 6, 'no debe repetir la misma pareja color+número dos veces');

const portfolio = buildColorlotoPortfolio(42);
assert.strictEqual(portfolio.length, 20);
portfolio.forEach(combo => {
    assert.strictEqual(combo.pairs.length, 6);
    assert.ok(['A', 'B', 'C', 'D'].includes(combo.strategy));
});
const keys = new Set(portfolio.map(c => colorlotoComboKey(c.pairs)));
assert.strictEqual(keys.size, 20);

console.log('test-portfolioOptimizer-colorloto: OK');
