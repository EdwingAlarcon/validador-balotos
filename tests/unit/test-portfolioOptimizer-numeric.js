// tests/unit/test-portfolioOptimizer-numeric.js
const assert = require('assert');
const db = require('../../src/services/database');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const {
    isParityBalanced,
    isRangeBalanced,
    generateCombo,
    buildNumericPortfolio,
    createSeededRandom,
} = require('../../src/services/portfolioOptimizer');

db.initDatabase();

assert.strictEqual(isParityBalanced([2, 4, 6, 8, 10]), false); // 100% pares, fuera de 30-70%
assert.strictEqual(isParityBalanced([1, 2, 3, 4, 6]), true); // 2 impares, 3 pares -> 60% pares

assert.strictEqual(isRangeBalanced([1, 2, 3, 4, 5], 43), false); // todo en el tercio bajo
assert.strictEqual(isRangeBalanced([3, 17, 24, 31, 42], 43), true); // repartido

const rng = createSeededRandom(7);
const comboB = generateCombo('B', 5, 43, rng, []);
assert.strictEqual(comboB.length, 5);

const portfolio = buildNumericPortfolio('Baloto', LOTTERY_RULES.Baloto, 42);
assert.strictEqual(portfolio.length, 20);
portfolio.forEach(combo => {
    assert.strictEqual(combo.numbers.length, 5);
    assert.ok(combo.numbers.every(n => n >= 1 && n <= 43));
    assert.ok(combo.superBalota >= 1 && combo.superBalota <= 16);
    assert.ok(['A', 'B', 'C', 'D'].includes(combo.strategy));
});
// Sin combinaciones duplicadas dentro del portafolio
const keys = new Set(portfolio.map(c => c.numbers.join('-')));
assert.strictEqual(keys.size, 20);

console.log('test-portfolioOptimizer-numeric: OK');
