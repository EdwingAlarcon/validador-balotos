const assert = require('assert');
const {
    countConsecutivePairs,
    averageConsecutivePairs,
    computeEndingDigitFrequency,
    isPrime,
    countPrimesInResults,
} = require('../../src/services/statisticsEngine');

assert.strictEqual(countConsecutivePairs([1, 2, 3, 10, 20]), 2); // (1,2) y (2,3)
assert.strictEqual(countConsecutivePairs([1, 5, 10, 15, 20]), 0);

const results = [{ numeros: '1,2,3,10,20' }, { numeros: '5,10,15,20,25' }];
assert.strictEqual(averageConsecutivePairs(results), 1); // (2 + 0) / 2

const endings = computeEndingDigitFrequency(results);
// array1 [1,2,3,10,20] -> terminaciones 1,2,3,0,0 ; array2 [5,10,15,20,25] -> terminaciones 5,0,5,0,5
assert.strictEqual(endings[0], 4); // 10,20 (array1) + 10,20 (array2) = 4
assert.strictEqual(endings[5], 3); // 5,15,25 (array2)

assert.strictEqual(isPrime(2), true);
assert.strictEqual(isPrime(1), false);
assert.strictEqual(isPrime(43), true);
assert.strictEqual(countPrimesInResults(results), 3); // 2,3,5 -> primos entre 1,2,3,10,20,5,10,15,20,25

console.log('test-statisticsEngine-patterns: OK');
