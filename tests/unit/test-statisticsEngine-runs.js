const assert = require('assert');
const { runsTest } = require('../../src/services/statisticsEngine');

// Secuencia perfectamente alternada: máximo número de rachas posible
const alternating = [0, 1, 0, 1, 0, 1, 0, 1];
const altResult = runsTest(alternating);
assert.strictEqual(altResult.runs, 8);

// Secuencia sin alternancia (todo igual) -> prueba no aplicable
const constant = [0, 0, 0, 0];
const constResult = runsTest(constant);
assert.strictEqual(constResult.likelyRandom, false);
assert.ok(constResult.note);

// Secuencia con dos bloques -> 2 rachas
const twoBlocks = [0, 0, 0, 1, 1, 1];
const blocksResult = runsTest(twoBlocks);
assert.strictEqual(blocksResult.runs, 2);

console.log('test-statisticsEngine-runs: OK');
