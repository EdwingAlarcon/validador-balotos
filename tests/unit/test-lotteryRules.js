const assert = require('assert');
const { LOTTERY_RULES, VERIFIED_AT, SOURCES } = require('../../src/services/lotteryRules');

assert.strictEqual(LOTTERY_RULES.Baloto.mainNumbers.max, 43);
assert.strictEqual(LOTTERY_RULES.Baloto.superBalota.max, 16);
assert.strictEqual(LOTTERY_RULES['Baloto Revancha'].sharesNumbersWith, 'Baloto');
assert.strictEqual(LOTTERY_RULES.Miloto.superBalota, null);
assert.strictEqual(LOTTERY_RULES.Colorloto.colors.length, 6);
assert.strictEqual(VERIFIED_AT, '2026-07-11');
assert.ok(SOURCES.length >= 1);

console.log('test-lotteryRules: OK');
