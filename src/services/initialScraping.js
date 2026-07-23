const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../services/database');

// ========================================
// PARSERS PUROS (sin I/O) — testeables con fixtures HTML
// Cada uno recibe un objeto cheerio ya cargado y devuelve los sorteos
// encontrados en la página, sin tocar la base de datos ni la red.
// ========================================

function parseBalotoPanels($) {
    const results = [];
    $('#listaResultados .panel').each((i, panel) => {
        const heading = $(panel).find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        if (!sorteoMatch) return;

        const sorteo = parseInt(sorteoMatch[1]);
        const fecha = $(panel).find('time').text().trim().replace(/^(ayer|hoy|antes de ayer)\s+/i, '');

        const numeros = [];
        $(panel)
            .find('.label-baloto')
            .each((j, elem) => {
                if (numeros.length < 5) {
                    const num = $(elem).text().trim();
                    if (num) numeros.push(num);
                }
            });

        const superBalota = $(panel).find('.label-comple').first().text().trim();

        if (numeros.length === 5 && superBalota) {
            results.push({ sorteo, fecha, numeros, superBalota });
        }
    });
    return results;
}

function parseBalotoRevanchaPanels($) {
    const results = [];
    // Recorre TODOS los paneles disponibles (no solo el más reciente) para
    // poder auto-rellenar sorteos que se hayan perdido entre corridas de scraping.
    $('#listaResultados .panel').each((i, panel) => {
        const heading = $(panel).find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto.*?(\d+)/i);
        if (!sorteoMatch) return;
        const sorteo = parseInt(sorteoMatch[1]);

        // Los segundos 5 números (índices 5-9) son Baloto Revancha
        const allNumbers = [];
        $(panel)
            .find('.label-baloto')
            .each((j, elem) => {
                allNumbers.push($(elem).text().trim());
            });

        const allSuperBalotas = [];
        $(panel)
            .find('.label-comple')
            .each((j, elem) => {
                allSuperBalotas.push($(elem).text().trim());
            });

        if (allNumbers.length >= 10 && allSuperBalotas.length >= 2) {
            const numeros = allNumbers.slice(5, 10);
            const superBalota = allSuperBalotas[1];
            const fecha = $(panel).find('time').text().trim().replace(/^(ayer|hoy|antes de ayer)\s+/i, '');
            results.push({ sorteo, fecha, numeros, superBalota });
        }
    });
    return results;
}

function parseMilotoPanels($) {
    const results = [];
    $('#listaResultados .panel').each((i, panel) => {
        const heading = $(panel).find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Miloto\s*(\d+)/i);
        if (!sorteoMatch) return;

        const sorteo = parseInt(sorteoMatch[1]);
        const fecha = $(panel).find('time').text().trim().replace(/^(ayer|hoy|antes de ayer)\s+/i, '');

        const numeros = [];
        $(panel)
            .find('.label-baloto')
            .each((j, elem) => {
                if (numeros.length < 5) {
                    const num = $(elem).text().trim();
                    if (num) numeros.push(num);
                }
            });

        if (numeros.length === 5) {
            results.push({ sorteo, fecha, numeros });
        }
    });
    return results;
}

function parseColorlotoPanels($) {
    const results = [];
    $('#listaResultados .panel').each((i, panel) => {
        const heading = $(panel).find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Colorloto\s*(\d+)/i);
        if (!sorteoMatch) return;

        const sorteo = parseInt(sorteoMatch[1]);
        const fecha = $(panel).find('time').text().trim().replace(/^(ayer|hoy|antes de ayer)\s+/i, '');

        const colorNumberPairs = [];
        $(panel)
            .find('.circulo')
            .each((j, elem) => {
                const classes = $(elem).attr('class') || '';
                const number = $(elem).text().trim();

                let color = 'desconocido';
                if (classes.includes('bolaamarilla')) color = 'amarillo';
                else if (classes.includes('bolaroja')) color = 'rojo';
                else if (classes.includes('bolaverde')) color = 'verde';
                else if (classes.includes('bolaazul')) color = 'azul';
                else if (classes.includes('bolablanca')) color = 'blanco';
                else if (classes.includes('bolanegra')) color = 'negro';

                if (number && color !== 'desconocido') {
                    colorNumberPairs.push({ color, number: parseInt(number) });
                }
            });

        if (colorNumberPairs.length >= 6) {
            results.push({ sorteo, fecha, pairs: colorNumberPairs.slice(0, 6) });
        }
    });
    return results;
}

// ========================================
// SCRAPING BALOTO
// ========================================

async function scrapeBaloto() {
    console.log('1️⃣  Scrapeando Baloto desde resultadobaloto.com...\n');
    const sourceUrl = 'https://www.resultadobaloto.com/';
    const startedAt = Date.now();

    try {
        const response = await axios.get(sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const parsed = parseBalotoPanels($);
        let scraped = 0;

        parsed.forEach(({ sorteo, fecha, numeros, superBalota }) => {
            const inserted = db.insertResult('Baloto', sorteo, fecha, numeros, superBalota);
            if (inserted) {
                console.log(`  ✅ Baloto #${sorteo} - ${fecha}`);
                console.log(`     Números: ${numeros.join(', ')} + SB: ${superBalota}`);
                scraped++;
            }
        });

        console.log(`\n  📊 Total Baloto scrapeados: ${scraped}\n`);
        db.logScrapingRun({
            game: 'Baloto',
            sourceUrl,
            status: parsed.length > 0 ? 'ok' : 'no_data',
            sorteosEncontrados: parsed.length,
            sorteosInsertados: scraped,
            durationMs: Date.now() - startedAt,
        });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto: ${error.message}\n`);
        db.logScrapingRun({
            game: 'Baloto',
            sourceUrl,
            status: 'error',
            durationMs: Date.now() - startedAt,
            errorMessage: error.message,
        });
        return 0;
    }
}

// ========================================
// SCRAPING BALOTO REVANCHA
// ========================================

async function scrapeBalotoRevancha() {
    console.log('2️⃣  Scrapeando Baloto Revancha desde resultadobaloto.com...\n');
    const sourceUrl = 'https://www.resultadobaloto.com/';
    const startedAt = Date.now();

    try {
        const response = await axios.get(sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const parsed = parseBalotoRevanchaPanels($);
        let scraped = 0;

        parsed.forEach(({ sorteo, fecha, numeros, superBalota }) => {
            const inserted = db.insertResult('Baloto Revancha', sorteo, fecha, numeros, superBalota);
            if (inserted) {
                console.log(`  ✅ Baloto Revancha #${sorteo} - ${fecha}`);
                console.log(`     Números: ${numeros.join(', ')} + SB: ${superBalota}`);
                scraped++;
            }
        });

        console.log(`\n  📊 Total Baloto Revancha scrapeados: ${scraped}\n`);
        db.logScrapingRun({
            game: 'Baloto Revancha',
            sourceUrl,
            status: parsed.length > 0 ? 'ok' : 'no_data',
            sorteosEncontrados: parsed.length,
            sorteosInsertados: scraped,
            durationMs: Date.now() - startedAt,
        });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto Revancha: ${error.message}\n`);
        db.logScrapingRun({
            game: 'Baloto Revancha',
            sourceUrl,
            status: 'error',
            durationMs: Date.now() - startedAt,
            errorMessage: error.message,
        });
        return 0;
    }
}

// ========================================
// SCRAPING MILOTO
// ========================================

async function scrapeMiloto() {
    console.log('3️⃣  Scrapeando Miloto desde resultadobaloto.com...\n');
    const sourceUrl = 'https://www.resultadobaloto.com/miloto.php';
    const startedAt = Date.now();

    try {
        const response = await axios.get(sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const parsed = parseMilotoPanels($);
        let scraped = 0;

        parsed.forEach(({ sorteo, fecha, numeros }) => {
            const inserted = db.insertResult('Miloto', sorteo, fecha, numeros);
            if (inserted) {
                console.log(`  ✅ Miloto #${sorteo} - ${fecha}`);
                console.log(`     Números: ${numeros.join(', ')}`);
                scraped++;
            }
        });

        console.log(`\n  📊 Total Miloto scrapeados: ${scraped}\n`);
        db.logScrapingRun({
            game: 'Miloto',
            sourceUrl,
            status: parsed.length > 0 ? 'ok' : 'no_data',
            sorteosEncontrados: parsed.length,
            sorteosInsertados: scraped,
            durationMs: Date.now() - startedAt,
        });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Miloto: ${error.message}\n`);
        db.logScrapingRun({
            game: 'Miloto',
            sourceUrl,
            status: 'error',
            durationMs: Date.now() - startedAt,
            errorMessage: error.message,
        });
        return 0;
    }
}

// ========================================
// SCRAPING COLORLOTO
// ========================================

async function scrapeColorloto() {
    console.log('4️⃣  Scrapeando Colorloto desde resultadobaloto.com...\n');
    const sourceUrl = 'https://www.resultadobaloto.com/colorloto.php';
    const startedAt = Date.now();

    try {
        const response = await axios.get(sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const parsed = parseColorlotoPanels($);
        let scraped = 0;

        parsed.forEach(({ sorteo, fecha, pairs }) => {
            const numeros = pairs.map(p => `${p.color}-${p.number}`);
            const inserted = db.insertResult('Colorloto', sorteo, fecha, numeros, null, pairs);
            if (inserted) {
                console.log(`  ✅ Colorloto #${sorteo} - ${fecha}`);
                console.log(`     Combinaciones: ${numeros.join(', ')}`);
                scraped++;
            }
        });

        console.log(`\n  📊 Total Colorloto scrapeados: ${scraped}\n`);
        db.logScrapingRun({
            game: 'Colorloto',
            sourceUrl,
            status: parsed.length > 0 ? 'ok' : 'no_data',
            sorteosEncontrados: parsed.length,
            sorteosInsertados: scraped,
            durationMs: Date.now() - startedAt,
        });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Colorloto: ${error.message}\n`);
        db.logScrapingRun({
            game: 'Colorloto',
            sourceUrl,
            status: 'error',
            durationMs: Date.now() - startedAt,
            errorMessage: error.message,
        });
        return 0;
    }
}

// ========================================
// EJECUTAR SCRAPING
// ========================================

async function runInitialScraping() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔄 INICIANDO SCRAPING DE TODAS LAS FUENTES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const results = {
        baloto: await scrapeBaloto(),
        balotoRevancha: await scrapeBalotoRevancha(),
        miloto: await scrapeMiloto(),
        colorloto: await scrapeColorloto(),
    };

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE SCRAPING INICIAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`  Baloto:          ${results.baloto} sorteos`);
    console.log(`  Baloto Revancha: ${results.balotoRevancha} sorteos`);
    console.log(`  Miloto:          ${results.miloto} sorteos`);
    console.log(`  Colorloto:       ${results.colorloto} sorteos`);
    console.log(`  ${'─'.repeat(30)}`);
    console.log(`  TOTAL:           ${Object.values(results).reduce((a, b) => a + b, 0)} sorteos\n`);

    // Mostrar estadísticas de la base de datos
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💾 ESTADO DE LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const totalBaloto = db.getTotalResults('Baloto');
    const totalBalotoRevancha = db.getTotalResults('Baloto Revancha');
    const totalMiloto = db.getTotalResults('Miloto');
    const totalColorloto = db.getTotalResults('Colorloto');
    const totalGeneral = db.getTotalResults();

    console.log(`  Baloto:          ${totalBaloto} registros`);
    console.log(`  Baloto Revancha: ${totalBalotoRevancha} registros`);
    console.log(`  Miloto:          ${totalMiloto} registros`);
    console.log(`  Colorloto:       ${totalColorloto} registros`);
    console.log(`  ${'─'.repeat(30)}`);
    console.log(`  TOTAL BD:        ${totalGeneral} registros\n`);

    console.log('✅ SCRAPING INICIAL COMPLETADO\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    console.log('🚀 INICIANDO SCRAPING INICIAL DE DATOS HISTÓRICOS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    db.initDatabase();
    runInitialScraping()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error en scraping inicial:', error);
            process.exit(1);
        });
}

module.exports = {
    runInitialScraping,
    parseBalotoPanels,
    parseBalotoRevanchaPanels,
    parseMilotoPanels,
    parseColorlotoPanels,
};
