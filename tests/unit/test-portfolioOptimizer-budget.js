const assert = require('assert');
const {
    budgetScenarios,
    randomControlPortfolio,
    comparePortfolios,
    buildNumericPortfolio,
    annotatePortfolioScores,
} = require('../../src/services/portfolioOptimizer');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const db = require('../../src/services/database');

db.initDatabase();

const scenarios = budgetScenarios(6000);
assert.strictEqual(scenarios.basico.apuestas, 5);
assert.strictEqual(scenarios.basico.costoTotal, 30000);
assert.strictEqual(scenarios.moderado.apuestas, 12);
assert.strictEqual(scenarios.amplio.apuestas, 20);
assert.strictEqual(scenarios.amplio.costoTotal, 120000);

const control = randomControlPortfolio(20, 5, 43, 99);
assert.strictEqual(control.length, 20);
assert.ok(control.every(combo => combo.length === 5));

const portfolio = buildNumericPortfolio('Miloto', LOTTERY_RULES.Miloto, 42);
annotatePortfolioScores(portfolio, false, 39);
const comparison = comparePortfolios(portfolio.map(c => c.numbers), control, 39);
assert.ok(comparison.optimized.coverage >= 0);
assert.ok(comparison.control.coverage >= 0);
assert.strictEqual(typeof comparison.optimized.averageRedundancy, 'number');

console.log('test-portfolioOptimizer-budget: OK');
