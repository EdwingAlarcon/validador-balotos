const assert = require('assert');
const {
    createSeededRandom,
    randomCombo,
    comboKey,
    sharedCount,
    hammingDistance,
    jaccardIndex,
    marginalCoverage,
    coverageOf,
    averageRedundancy,
} = require('../../src/services/portfolioOptimizer');

// Determinismo: misma semilla -> misma secuencia
const rngA = createSeededRandom(42);
const rngB = createSeededRandom(42);
assert.strictEqual(rngA(), rngB());

const combo = randomCombo(5, 43, createSeededRandom(1));
assert.strictEqual(combo.length, 5);
assert.strictEqual(new Set(combo).size, 5); // sin repetidos
assert.deepStrictEqual(combo, [...combo].sort((a, b) => a - b)); // ordenado

assert.strictEqual(comboKey([1, 2, 3]), '1-2-3');
assert.strictEqual(sharedCount([1, 2, 3], [2, 3, 4]), 2);
assert.strictEqual(hammingDistance([1, 2, 3], [2, 3, 4]), 2); // 3+3-2*2
assert.strictEqual(jaccardIndex([1, 2, 3], [2, 3, 4]), 0.5); // 2 compartidos / 4 en unión

assert.strictEqual(marginalCoverage([[1, 2, 3]], [3, 4, 5]), 2); // 4 y 5 son nuevos

assert.deepStrictEqual(coverageOf([[1, 2], [2, 3]]), [1, 2, 3]);

const redundancy = averageRedundancy([[1, 2, 3], [1, 2, 4], [5, 6, 7]]);
assert.ok(redundancy >= 0);

console.log('test-portfolioOptimizer-primitives: OK');
