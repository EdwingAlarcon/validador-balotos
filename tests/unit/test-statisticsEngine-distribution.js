const assert = require('assert');
const { computeParityDistribution, computeRangeDistribution, computeSumStats } = require('../../src/services/statisticsEngine');

const results = [
    { numeros: '1,2,3,4,5' },   // suma 15
    { numeros: '10,20,30,40,43' }, // suma 143
];

const parity = computeParityDistribution(results);
assert.strictEqual(parity.even + parity.odd, 10);
assert.strictEqual(parity.even, 6); // pares: 2,4,10,20,30,40 = 6; impares: 1,3,5,43 = 4
assert.strictEqual(parity.odd, 4);

const range = computeRangeDistribution(results, 43);
assert.strictEqual(range.low + range.mid + range.high, 10);

const sumStats = computeSumStats(results);
assert.strictEqual(sumStats.mean, 79);
assert.strictEqual(sumStats.min, 15);
assert.strictEqual(sumStats.max, 143);
assert.strictEqual(sumStats.sampleSize, 2);

console.log('test-statisticsEngine-distribution: OK');
