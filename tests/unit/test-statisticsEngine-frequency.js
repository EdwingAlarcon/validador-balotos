const assert = require('assert');
const { computeFrequency, computeHotCold, computeGapsSinceLastAppearance } = require('../../src/services/statisticsEngine');

const results = [
    { numeros: '1,2,3,4,5' },  // más reciente (índice 0)
    { numeros: '1,10,20,30,40' },
    { numeros: '6,7,8,9,10' },
];

const freq = computeFrequency(results, 43);
assert.strictEqual(freq[1], 2);
assert.strictEqual(freq[10], 2);
assert.strictEqual(freq[43], 0);

const { hot, cold } = computeHotCold(freq);
assert.strictEqual(hot[0].count, 2);
assert.ok(cold[cold.length - 1].count <= hot[0].count);

const gaps = computeGapsSinceLastAppearance(results, 43);
assert.strictEqual(gaps[1], 0); // salió en el sorteo más reciente (índice 0)
assert.strictEqual(gaps[6], 2); // solo aparece en el 3er sorteo (índice 2)
assert.strictEqual(gaps[43], null); // nunca apareció

console.log('test-statisticsEngine-frequency: OK');
