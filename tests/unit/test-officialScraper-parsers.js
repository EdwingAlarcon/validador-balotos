// tests/unit/test-officialScraper-parsers.js
// Pruebas de regresión de los parsers de baloto.com oficial (src/services/officialScraper.js)
// contra fixtures sintéticas, sin red ni Firecrawl.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
    parseBalotoListingMarkdown,
    parseMilotoListingMarkdown,
    parseColorlotoListingHtml,
} = require('../../src/services/officialScraper');

function loadFixture(name) {
    return fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');
}

// --- Baloto + Revancha (misma tabla, filas intercaladas) ---
{
    const markdown = loadFixture('baloto-oficial-listado.md');
    const { baloto, revancha } = parseBalotoListingMarkdown(markdown);

    assert.strictEqual(baloto.length, 2);
    assert.deepStrictEqual(baloto[0], {
        sorteo: 2686,
        fecha: '22 de Julio de 2026',
        numeros: ['03', '06', '19', '30', '33'],
        superBalota: '09',
    });

    assert.strictEqual(revancha.length, 2);
    assert.deepStrictEqual(revancha[0], {
        sorteo: 2686,
        fecha: '22 de Julio de 2026',
        numeros: ['03', '06', '18', '32', '33'],
        superBalota: '07',
    });
    // Revancha nunca debe colarse en el array de Baloto ni viceversa
    assert.ok(!baloto.some(r => r.numeros.join(',') === revancha[0].numeros.join(',')) || baloto[0].superBalota !== revancha[0].superBalota);
}

// --- Miloto ---
{
    const markdown = loadFixture('miloto-oficial-listado.md');
    const results = parseMilotoListingMarkdown(markdown);
    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(results[0], {
        sorteo: 575,
        fecha: '21 de Julio de 2026',
        numeros: ['06', '16', '21', '30', '32'],
    });
}

// --- Colorloto ---
{
    const html = loadFixture('colorloto-oficial-listado.html');
    const results = parseColorlotoListingHtml(html);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].sorteo, 202);
    assert.deepStrictEqual(results[0].pairs, [
        { color: 'amarillo', number: 1 },
        { color: 'azul', number: 7 },
        { color: 'verde', number: 1 },
        { color: 'verde', number: 4 },
        { color: 'blanco', number: 6 },
        { color: 'blanco', number: 7 },
    ]);
    // Colores repetidos/faltantes (sin rojo aquí) no deben romper el parser
    assert.strictEqual(results[1].pairs.length, 6);
    assert.ok(results[1].pairs.some(p => p.color === 'rojo'));
}

// --- Página vacía / sin tabla ---
{
    assert.deepStrictEqual(parseBalotoListingMarkdown('sin resultados'), { baloto: [], revancha: [] });
    assert.deepStrictEqual(parseMilotoListingMarkdown('sin resultados'), []);
    assert.deepStrictEqual(parseColorlotoListingHtml('<html><body>vacío</body></html>'), []);
}

console.log('test-officialScraper-parsers: OK');
