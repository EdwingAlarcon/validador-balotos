// tests/unit/test-intelligentGenerator-colorloto.js
// Colorloto permite repetir color (con distinto número) o repetir número
// (con distinto color) — confirmado en baloto.com/colorloto: "Puedes jugar
// con colores repetidos, pero no con el mismo número. O puedes jugar con
// números repetidos, pero no con el mismo color." generateIntelligentColorloto
// ya no debe forzar los 6 colores distintos como si fuera obligatorio.
const assert = require('assert');
const db = require('../../src/services/database');
const { generateIntelligentColorloto } = require('../../src/services/intelligentGenerator');

db.initDatabase();

const validColors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

for (let i = 0; i < 20; i++) {
    const { pairs, method } = generateIntelligentColorloto();

    assert.strictEqual(pairs.length, 6);
    assert.ok(['statistical', 'random'].includes(method));
    pairs.forEach(p => {
        assert.ok(validColors.includes(p.color), `color inválido: ${p.color}`);
        assert.ok(p.number >= 1 && p.number <= 7, `número fuera de rango: ${p.number}`);
    });

    const keys = pairs.map(p => `${p.color}-${p.number}`);
    assert.strictEqual(new Set(keys).size, 6, 'no debe repetir la misma pareja color+número dos veces');
}

console.log('test-intelligentGenerator-colorloto: OK');
