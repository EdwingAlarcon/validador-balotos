const assert = require('assert');
const { scorePopularity } = require('../../src/services/popularityScorer');

// Patrón clásico y muy reconocible: debe dar score alto
const classic = scorePopularity([1, 2, 3, 4, 5], 43);
assert.ok(classic >= 70, `esperado >=70, obtuvo ${classic}`);

// Combinación dispersa, sin patrones: debe dar score bajo
const dispersed = scorePopularity([3, 17, 24, 31, 42], 43);
assert.ok(dispersed <= 20, `esperado <=20, obtuvo ${dispersed}`);

// El score nunca debe superar 100
const allChecks = scorePopularity([5, 10, 15, 20, 25], 43); // múltiplos de 5, todos <=31
assert.ok(allChecks <= 100);

console.log('test-popularityScorer: OK');
