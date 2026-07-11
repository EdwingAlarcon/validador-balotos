const assert = require('assert');
const { buildColorlotoPortfolio, randomColorloto, createSeededRandom, colorlotoComboKey } = require('../../src/services/portfolioOptimizer');

const pairs = randomColorloto(createSeededRandom(3));
assert.strictEqual(pairs.length, 6);
assert.ok(pairs.every(p => p.number >= 1 && p.number <= 7));
const colors = pairs.map(p => p.color);
assert.strictEqual(new Set(colors).size, 6); // los 6 colores presentes una vez cada uno

const portfolio = buildColorlotoPortfolio(42);
assert.strictEqual(portfolio.length, 20);
portfolio.forEach(combo => {
    assert.strictEqual(combo.pairs.length, 6);
    assert.ok(['A', 'B', 'C', 'D'].includes(combo.strategy));
});
const keys = new Set(portfolio.map(c => colorlotoComboKey(c.pairs)));
assert.strictEqual(keys.size, 20);

console.log('test-portfolioOptimizer-colorloto: OK');
