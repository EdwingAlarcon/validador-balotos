const assert = require('assert');
const db = require('../../src/services/database');
const { getDescriptiveStats } = require('../../src/services/statisticsEngine');

db.initDatabase();

const stats = getDescriptiveStats('Baloto');
assert.strictEqual(stats.totalSorteos, db.getTotalResults('Baloto'));
assert.ok(stats.frequency);
assert.ok(Array.isArray(stats.hot));
assert.ok(Array.isArray(stats.cold));
assert.ok(stats.parity);
assert.ok(stats.rangeDistribution);
assert.ok(stats.sumStats);
assert.strictEqual(typeof stats.averageConsecutivePairs, 'number');
assert.ok(stats.endingDigitFrequency);
assert.strictEqual(typeof stats.primesCount, 'number');
assert.ok(stats.chiSquare);
assert.ok(stats.runsTest);

assert.throws(() => getDescriptiveStats('Colorloto'), /no soporta/);

console.log('test-statisticsEngine-descriptive: OK');
