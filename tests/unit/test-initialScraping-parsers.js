// tests/unit/test-initialScraping-parsers.js
// Pruebas de regresión de los parsers puros de src/services/initialScraping.js
// contra fixtures HTML sintéticas (tests/fixtures/*.html), sin red ni BD.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const {
    parseBalotoPanels,
    parseBalotoRevanchaPanels,
    parseMilotoPanels,
    parseColorlotoPanels,
} = require('../../src/services/initialScraping');

function loadFixture(name) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');
    return cheerio.load(html);
}

// --- Baloto ---
{
    const $ = loadFixture('baloto-panels.html');
    const results = parseBalotoPanels($);
    assert.strictEqual(results.length, 2, 'debe encontrar los 2 paneles de la fixture');
    assert.deepStrictEqual(results[0], {
        sorteo: 2686,
        fecha: 'Miércoles 22 de Julio de 2026',
        numeros: ['03', '06', '19', '30', '33'],
        superBalota: '09',
    });
    assert.strictEqual(results[1].sorteo, 2685);
}

// --- Baloto Revancha ---
// Regresión directa del bug crítico: antes solo se leía el panel más
// reciente (.eq(0)); debe extraer los DOS paneles de la fixture.
{
    const $ = loadFixture('baloto-panels.html');
    const results = parseBalotoRevanchaPanels($);
    assert.strictEqual(results.length, 2, 'debe recorrer todos los paneles, no solo el primero');
    assert.deepStrictEqual(results[0], {
        sorteo: 2686,
        fecha: 'Miércoles 22 de Julio de 2026',
        numeros: ['03', '06', '18', '32', '33'],
        superBalota: '07',
    });
    assert.deepStrictEqual(results[1], {
        sorteo: 2685,
        fecha: 'Lunes 20 de Julio de 2026',
        numeros: ['03', '10', '11', '23', '33'],
        superBalota: '15',
    });
}

// --- Miloto ---
{
    const $ = loadFixture('miloto-panels.html');
    const results = parseMilotoPanels($);
    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(results[0], {
        sorteo: 575,
        fecha: 'Martes 21 de Julio de 2026',
        numeros: ['06', '16', '21', '30', '32'],
    });
}

// --- Colorloto ---
// Valores verificados contra baloto.com/colorloto/resultados #202 durante la
// auditoría: color, número y orden coinciden con la fuente oficial.
{
    const $ = loadFixture('colorloto-panels.html');
    const results = parseColorlotoPanels($);
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

    // El sorteo #201 confirma que colores repetidos/faltantes (sin rojo ni
    // negro aquí) no rompen el parser — así es como salen los sorteos reales.
    assert.strictEqual(results[1].pairs.length, 6);
    assert.ok(results[1].pairs.some(p => p.color === 'rojo'));
    assert.ok(!results[1].pairs.some(p => p.color === 'amarillo'));
}

// --- Página vacía / bloqueada (CAPTCHA, mantenimiento, HTML inesperado) ---
// Los parsers no distinguen "0 sorteos porque no hay novedades" de "0 sorteos
// porque la página no trajo el contenido esperado" (hallazgo MEDIO #6 de la
// auditoría) — este test documenta el comportamiento actual: no debe lanzar,
// debe devolver un array vacío.
{
    const $ = cheerio.load('<html><body><div id="listaResultados"></div></body></html>');
    assert.deepStrictEqual(parseBalotoPanels($), []);
    assert.deepStrictEqual(parseBalotoRevanchaPanels($), []);
    assert.deepStrictEqual(parseMilotoPanels($), []);
    assert.deepStrictEqual(parseColorlotoPanels($), []);
}

console.log('test-initialScraping-parsers: OK');
