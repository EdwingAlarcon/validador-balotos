// tests/unit/test-database-normalizeSuperBalota.js
const assert = require('assert');
const { normalizeSuperBalota } = require('../../src/services/database');

// La superBalota llegó históricamente en formatos inconsistentes según la
// versión del scraper que la insertó ("16.0" vs "16"). Debe normalizarse
// siempre a entero de 2 dígitos con cero a la izquierda.
assert.strictEqual(normalizeSuperBalota('16.0'), '16');
assert.strictEqual(normalizeSuperBalota('7.0'), '07');
assert.strictEqual(normalizeSuperBalota('07'), '07');
assert.strictEqual(normalizeSuperBalota(4), '04');
assert.strictEqual(normalizeSuperBalota(null), null);
assert.strictEqual(normalizeSuperBalota(undefined), null);
assert.strictEqual(normalizeSuperBalota(''), null);
assert.strictEqual(normalizeSuperBalota('no-numero'), null);

console.log('test-database-normalizeSuperBalota: OK');
