const assert = require('assert');
const { scoreColorlotoPopularity } = require('../../src/services/popularityScorer');

// Secuencia ascendente consecutiva en el orden del tiquete: patrón muy
// reconocible (independiente de qué color se asignó en cada posición)
const ascending = [
    { color: 'amarillo', number: 1 },
    { color: 'azul', number: 2 },
    { color: 'rojo', number: 3 },
    { color: 'verde', number: 4 },
    { color: 'blanco', number: 5 },
    { color: 'negro', number: 6 },
];
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

// Colorloto permite repetir color (con distinto número): no debe lanzar ni
// dar puntaje erróneo cuando faltan colores o se repiten — así es como
// salen los sorteos reales (confirmado en la auditoría: ~99% de los sorteos
// no cubre los 6 colores distintos).
const repeatedColor = [
    { color: 'verde', number: 1 },
    { color: 'verde', number: 3 },
    { color: 'negro', number: 5 },
    { color: 'negro', number: 6 },
    { color: 'blanco', number: 2 },
    { color: 'blanco', number: 4 },
];
assert.doesNotThrow(() => scoreColorlotoPopularity(repeatedColor));

console.log('test-popularityScorer-colorloto: OK');
