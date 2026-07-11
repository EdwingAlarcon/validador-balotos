const assert = require('assert');
const { scoreColorlotoPopularity, COLOR_ORDER } = require('../../src/services/popularityScorer');

// Secuencia ascendente en el orden del volante: patrón muy reconocible
const ascending = COLOR_ORDER.map((color, i) => ({ color, number: i + 1 }));
const ascendingScore = scoreColorlotoPopularity(ascending);
assert.ok(ascendingScore >= 25, `esperado >=25, obtuvo ${ascendingScore}`);

// Números dispersos sin patrón
const dispersed = [
    { color: 'amarillo', number: 3 },
    { color: 'azul', number: 7 },
    { color: 'rojo', number: 1 },
    { color: 'verde', number: 5 },
    { color: 'blanco', number: 2 },
    { color: 'negro', number: 6 },
];
const dispersedScore = scoreColorlotoPopularity(dispersed);
assert.ok(dispersedScore <= 20, `esperado <=20, obtuvo ${dispersedScore}`);

console.log('test-popularityScorer-colorloto: OK');
