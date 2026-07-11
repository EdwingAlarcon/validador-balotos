const assert = require('assert');
const { chiSquareUniformity, normalCdf } = require('../../src/services/statisticsEngine');

// Distribución perfectamente uniforme -> chiSquare = 0 -> pValue cercano a 1
const uniformFreq = { 1: 10, 2: 10, 3: 10, 4: 10 };
const uniformResult = chiSquareUniformity(uniformFreq, 40, 1);
assert.strictEqual(uniformResult.chiSquare, 0);
assert.ok(uniformResult.pValueApprox > 0.9);
assert.strictEqual(uniformResult.likelyUniform, true);

// Distribución muy sesgada -> chiSquare grande -> pValue cercano a 0
const skewedFreq = { 1: 100, 2: 1, 3: 1, 4: 1 };
const skewedResult = chiSquareUniformity(skewedFreq, 103, 1);
assert.ok(skewedResult.chiSquare > 50);
assert.ok(skewedResult.pValueApprox < 0.05);
assert.strictEqual(skewedResult.likelyUniform, false);

assert.ok(normalCdf(0) > 0.49 && normalCdf(0) < 0.51);
assert.ok(normalCdf(3) > 0.99);

console.log('test-statisticsEngine-chisquare: OK');
