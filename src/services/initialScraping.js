const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../services/database');
const firecrawlClient = require('./firecrawlClient');
const {
    OFFICIAL_URLS,
    parseBalotoListingMarkdown,
    parseMilotoListingMarkdown,
    parseColorlotoListingHtml,
} = require('./officialScraper');

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
// HELPERS COMPARTIDOS
// ========================================

// Inserta un lote de sorteos ya parseados y registra la corrida en
// scraping_log. Común a fuente oficial y de respaldo.
function insertBalotoLikeRows(game, rows, label) {
    let scraped = 0;
    rows.forEach(({ sorteo, fecha, numeros, superBalota }) => {
        const inserted = db.insertResult(game, sorteo, fecha, numeros, superBalota);
        if (inserted) {
            console.log(`  ✅ ${game} #${sorteo} - ${fecha}`);
            console.log(`     Números: ${numeros.join(', ')}${superBalota ? ' + SB: ' + superBalota : ''}`);
            scraped++;
        }
    });
    console.log(`\n  📊 Total ${label} scrapeados: ${scraped}\n`);
    return scraped;
}

function logRun(game, sourceUrl, startedAt, { status, sorteosEncontrados = 0, sorteosInsertados = 0, errorMessage = null }) {
    db.logScrapingRun({
        game,
        sourceUrl,
        status,
        sorteosEncontrados,
        sorteosInsertados,
        durationMs: Date.now() - startedAt,
        errorMessage,
    });
}

// ========================================
// SCRAPING BALOTO / BALOTO REVANCHA
// Fuente primaria: baloto.com oficial (vía Firecrawl, requiere JS). Si no
// está configurada la API key, si Firecrawl falla, o si no trae sorteos
// nuevos, cae a resultadobaloto.com como respaldo.
// ========================================

async function fetchOfficialBalotoListing() {
    const data = await firecrawlClient.scrape(OFFICIAL_URLS.balotoListing, { formats: ['markdown'] });
    return parseBalotoListingMarkdown(data.markdown || '');
}

async function scrapeBalotoBackup() {
    const sourceUrl = 'https://www.resultadobaloto.com/';
    const response = await axios.get(sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(response.data);
    return { sourceUrl, parsed: parseBalotoPanels($) };
}

async function scrapeBalotoRevanchaBackup() {
    const sourceUrl = 'https://www.resultadobaloto.com/';
    const response = await axios.get(sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(response.data);
    return { sourceUrl, parsed: parseBalotoRevanchaPanels($) };
}

async function scrapeBaloto() {
    console.log('1️⃣  Scrapeando Baloto...\n');
    const startedAt = Date.now();

    if (firecrawlClient.isConfigured()) {
        try {
            const { baloto: parsed } = await fetchOfficialBalotoListing();
            if (parsed.length > 0) {
                console.log('  🌐 Fuente: baloto.com (oficial)');
                const scraped = insertBalotoLikeRows('Baloto', parsed, 'Baloto');
                logRun('Baloto', OFFICIAL_URLS.balotoListing, startedAt, { status: 'ok', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
                return scraped;
            }
            logRun('Baloto', OFFICIAL_URLS.balotoListing, startedAt, { status: 'no_data' });
        } catch (error) {
            console.warn(`  ⚠️  baloto.com oficial falló (${error.message}), usando respaldo resultadobaloto.com\n`);
            logRun('Baloto', OFFICIAL_URLS.balotoListing, startedAt, { status: 'error', errorMessage: error.message });
        }
    }

    const backupStartedAt = Date.now();
    try {
        console.log('  🌐 Fuente: resultadobaloto.com (respaldo)');
        const { sourceUrl, parsed } = await scrapeBalotoBackup();
        const scraped = insertBalotoLikeRows('Baloto', parsed, 'Baloto');
        logRun('Baloto', sourceUrl, backupStartedAt, { status: parsed.length > 0 ? 'ok' : 'no_data', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto (respaldo): ${error.message}\n`);
        logRun('Baloto', 'https://www.resultadobaloto.com/', backupStartedAt, { status: 'error', errorMessage: error.message });
        return 0;
    }
}

async function scrapeBalotoRevancha() {
    console.log('2️⃣  Scrapeando Baloto Revancha...\n');
    const startedAt = Date.now();

    if (firecrawlClient.isConfigured()) {
        try {
            const { revancha: parsed } = await fetchOfficialBalotoListing();
            if (parsed.length > 0) {
                console.log('  🌐 Fuente: baloto.com (oficial)');
                const scraped = insertBalotoLikeRows('Baloto Revancha', parsed, 'Baloto Revancha');
                logRun('Baloto Revancha', OFFICIAL_URLS.balotoListing, startedAt, { status: 'ok', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
                return scraped;
            }
            logRun('Baloto Revancha', OFFICIAL_URLS.balotoListing, startedAt, { status: 'no_data' });
        } catch (error) {
            console.warn(`  ⚠️  baloto.com oficial falló (${error.message}), usando respaldo resultadobaloto.com\n`);
            logRun('Baloto Revancha', OFFICIAL_URLS.balotoListing, startedAt, { status: 'error', errorMessage: error.message });
        }
    }

    const backupStartedAt = Date.now();
    try {
        console.log('  🌐 Fuente: resultadobaloto.com (respaldo)');
        const { sourceUrl, parsed } = await scrapeBalotoRevanchaBackup();
        const scraped = insertBalotoLikeRows('Baloto Revancha', parsed, 'Baloto Revancha');
        logRun('Baloto Revancha', sourceUrl, backupStartedAt, { status: parsed.length > 0 ? 'ok' : 'no_data', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto Revancha (respaldo): ${error.message}\n`);
        logRun('Baloto Revancha', 'https://www.resultadobaloto.com/', backupStartedAt, { status: 'error', errorMessage: error.message });
        return 0;
    }
}

// ========================================
// SCRAPING MILOTO
// ========================================

async function scrapeMiloto() {
    console.log('3️⃣  Scrapeando Miloto...\n');
    const startedAt = Date.now();

    if (firecrawlClient.isConfigured()) {
        try {
            const data = await firecrawlClient.scrape(OFFICIAL_URLS.milotoListing, { formats: ['markdown'] });
            const parsed = parseMilotoListingMarkdown(data.markdown || '');
            if (parsed.length > 0) {
                console.log('  🌐 Fuente: baloto.com (oficial)');
                const scraped = insertBalotoLikeRows('Miloto', parsed, 'Miloto');
                logRun('Miloto', OFFICIAL_URLS.milotoListing, startedAt, { status: 'ok', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
                return scraped;
            }
            logRun('Miloto', OFFICIAL_URLS.milotoListing, startedAt, { status: 'no_data' });
        } catch (error) {
            console.warn(`  ⚠️  baloto.com oficial falló (${error.message}), usando respaldo resultadobaloto.com\n`);
            logRun('Miloto', OFFICIAL_URLS.milotoListing, startedAt, { status: 'error', errorMessage: error.message });
        }
    }

    const backupSourceUrl = 'https://www.resultadobaloto.com/miloto.php';
    const backupStartedAt = Date.now();
    try {
        console.log('  🌐 Fuente: resultadobaloto.com (respaldo)');
        const response = await axios.get(backupSourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        const parsed = parseMilotoPanels($);
        const scraped = insertBalotoLikeRows('Miloto', parsed, 'Miloto');
        logRun('Miloto', backupSourceUrl, backupStartedAt, { status: parsed.length > 0 ? 'ok' : 'no_data', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Miloto (respaldo): ${error.message}\n`);
        logRun('Miloto', backupSourceUrl, backupStartedAt, { status: 'error', errorMessage: error.message });
        return 0;
    }
}

// ========================================
// SCRAPING COLORLOTO
// ========================================

function insertColorlotoRows(rows) {
    let scraped = 0;
    rows.forEach(({ sorteo, fecha, pairs }) => {
        const numeros = pairs.map(p => `${p.color}-${p.number}`);
        const inserted = db.insertResult('Colorloto', sorteo, fecha, numeros, null, pairs);
        if (inserted) {
            console.log(`  ✅ Colorloto #${sorteo} - ${fecha}`);
            console.log(`     Combinaciones: ${numeros.join(', ')}`);
            scraped++;
        }
    });
    console.log(`\n  📊 Total Colorloto scrapeados: ${scraped}\n`);
    return scraped;
}

async function scrapeColorloto() {
    console.log('4️⃣  Scrapeando Colorloto...\n');
    const startedAt = Date.now();

    if (firecrawlClient.isConfigured()) {
        try {
            const data = await firecrawlClient.scrape(OFFICIAL_URLS.colorlotoListing, { formats: ['html'] });
            const parsed = parseColorlotoListingHtml(data.html || '');
            if (parsed.length > 0) {
                console.log('  🌐 Fuente: baloto.com (oficial)');
                const scraped = insertColorlotoRows(parsed);
                logRun('Colorloto', OFFICIAL_URLS.colorlotoListing, startedAt, { status: 'ok', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
                return scraped;
            }
            logRun('Colorloto', OFFICIAL_URLS.colorlotoListing, startedAt, { status: 'no_data' });
        } catch (error) {
            console.warn(`  ⚠️  baloto.com oficial falló (${error.message}), usando respaldo resultadobaloto.com\n`);
            logRun('Colorloto', OFFICIAL_URLS.colorlotoListing, startedAt, { status: 'error', errorMessage: error.message });
        }
    }

    const backupSourceUrl = 'https://www.resultadobaloto.com/colorloto.php';
    const backupStartedAt = Date.now();
    try {
        console.log('  🌐 Fuente: resultadobaloto.com (respaldo)');
        const response = await axios.get(backupSourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(response.data);
        const parsed = parseColorlotoPanels($);
        const scraped = insertColorlotoRows(parsed);
        logRun('Colorloto', backupSourceUrl, backupStartedAt, { status: parsed.length > 0 ? 'ok' : 'no_data', sorteosEncontrados: parsed.length, sorteosInsertados: scraped });
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Colorloto (respaldo): ${error.message}\n`);
        logRun('Colorloto', backupSourceUrl, backupStartedAt, { status: 'error', errorMessage: error.message });
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
