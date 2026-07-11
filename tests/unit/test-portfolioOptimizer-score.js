// tests/unit/test-portfolioOptimizer-score.js
const assert = require('assert');
const { strategicScore, buildNumericPortfolio, annotatePortfolioScores } = require('../../src/services/portfolioOptimizer');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const db = require('../../src/services/database');

db.initDatabase();

// Combinación de baja popularidad y buena cobertura debe puntuar más alto que una mala en todo
const goodScore = strategicScore({
    popularityScore: 0,
    marginalCoverage: 5,
    maxMarginalCoverage: 5,
    sharedWithOthersAvg: 0,
    comboLength: 5,
    parityBalanceOk: true,
    rangeBalanceOk: true,
});
const badScore = strategicScore({
    popularityScore: 100,
    marginalCoverage: 0,
    maxMarginalCoverage: 5,
    sharedWithOthersAvg: 5,
    comboLength: 5,
    parityBalanceOk: false,
    rangeBalanceOk: false,
});
assert.ok(goodScore > badScore);
assert.strictEqual(goodScore, 100);
assert.ok(goodScore <= 100 && badScore >= 0);

const portfolio = buildNumericPortfolio('Baloto', LOTTERY_RULES.Baloto, 42);
annotatePortfolioScores(portfolio, false);
portfolio.forEach(combo => {
    assert.ok(combo.strategicScore >= 0 && combo.strategicScore <= 100);
    assert.ok(combo.maxSharedWithAnother >= 0 && combo.maxSharedWithAnother <= 5);
});

console.log('test-portfolioOptimizer-score: OK');
