const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../services/database');

console.log('🚀 INICIANDO SCRAPING INICIAL DE DATOS HISTÓRICOS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Inicializar base de datos
db.initDatabase();

// ========================================
// SCRAPING BALOTO
// ========================================

async function scrapeBaloto() {
    console.log('1️⃣  Scrapeando Baloto desde resultadobaloto.com...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;

        $('#listaResultados .panel').each((i, panel) => {
            const heading = $(panel).find('.panel-heading h2').text();
            const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $(panel).find('time').text().trim();

                // Extraer números principales
                const numeros = [];
                $(panel)
                    .find('.label-baloto')
                    .each((j, elem) => {
                        if (numeros.length < 5) {
                            const num = $(elem).text().trim();
                            if (num) numeros.push(num);
                        }
                    });

                // Extraer súper balota
                const superBalota = $(panel).find('.label-comple').first().text().trim();

                if (numeros.length === 5 && superBalota) {
                    const inserted = db.insertResult('Baloto', sorteo, fecha, numeros, superBalota);
                    if (inserted) {
                        console.log(`  ✅ Baloto #${sorteo} - ${fecha}`);
                        console.log(`     Números: ${numeros.join(', ')} + SB: ${superBalota}`);
                        scraped++;
                    }
                }
            }
        });

        console.log(`\n  📊 Total Baloto scrapeados: ${scraped}\n`);
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto: ${error.message}\n`);
        return 0;
    }
}

// ========================================
// SCRAPING BALOTO REVANCHA
// ========================================

async function scrapeBalotoRevancha() {
    console.log('2️⃣  Scrapeando Baloto Revancha desde resultadobaloto.com...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const firstPanel = $('#listaResultados .panel').eq(0);

        // Los segundos 5 números son Baloto Revancha
        const allNumbers = [];
        firstPanel.find('.label-baloto').each((i, elem) => {
            allNumbers.push($(elem).text().trim());
        });

        const allSuperBalotas = [];
        firstPanel.find('.label-comple').each((i, elem) => {
            allSuperBalotas.push($(elem).text().trim());
        });

        if (allNumbers.length >= 10 && allSuperBalotas.length >= 2) {
            const revanchaNumbers = allNumbers.slice(5, 10);
            const revanchaSB = allSuperBalotas[1];

            const heading = firstPanel.find('.panel-heading h2').text();
            const sorteoMatch = heading.match(/Baloto.*?(\d+)/i);
            const sorteo = sorteoMatch ? parseInt(sorteoMatch[1]) : null;
            const fecha = firstPanel.find('time').text().trim();

            const inserted = db.insertResult('Baloto Revancha', sorteo, fecha, revanchaNumbers, revanchaSB);
            if (inserted) {
                console.log(`  ✅ Baloto Revancha #${sorteo} - ${fecha}`);
                console.log(`     Números: ${revanchaNumbers.join(', ')} + SB: ${revanchaSB}`);
            }

            console.log(`\n  📊 Total Baloto Revancha scrapeados: 1\n`);
            return 1;
        } else {
            console.log(`  ⚠️  No se encontraron datos de Baloto Revancha\n`);
            return 0;
        }
    } catch (error) {
        console.error(`  ❌ Error scrapeando Baloto Revancha: ${error.message}\n`);
        return 0;
    }
}

// ========================================
// SCRAPING MILOTO
// ========================================

async function scrapeMiloto() {
    console.log('3️⃣  Scrapeando Miloto desde resultadobaloto.com...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;

        $('#listaResultados .panel').each((i, panel) => {
            const heading = $(panel).find('.panel-heading h2').text();
            const sorteoMatch = heading.match(/Miloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $(panel).find('time').text().trim();

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
                    const inserted = db.insertResult('Miloto', sorteo, fecha, numeros);
                    if (inserted) {
                        console.log(`  ✅ Miloto #${sorteo} - ${fecha}`);
                        console.log(`     Números: ${numeros.join(', ')}`);
                        scraped++;
                    }
                }
            }
        });

        console.log(`\n  📊 Total Miloto scrapeados: ${scraped}\n`);
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Miloto: ${error.message}\n`);
        return 0;
    }
}

// ========================================
// SCRAPING COLORLOTO
// ========================================

async function scrapeColorloto() {
    console.log('4️⃣  Scrapeando Colorloto desde resultadobaloto.com...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;

        $('#listaResultados .panel').each((i, panel) => {
            const heading = $(panel).find('.panel-heading h2').text();
            const sorteoMatch = heading.match(/Colorloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $(panel).find('time').text().trim();

                const colorNumberPairs = [];
                $(panel)
                    .find('.circulo')
                    .each((j, elem) => {
                        const classes = $(elem).attr('class') || '';
                        const number = $(elem).text().trim();

                        // Detectar el color basado en la clase CSS
                        let color = 'desconocido';
                        if (classes.includes('bolaamarilla')) color = 'amarillo';
                        else if (classes.includes('bolaroja')) color = 'rojo';
                        else if (classes.includes('bolaverde')) color = 'verde';
                        else if (classes.includes('bolaazul')) color = 'azul';
                        else if (classes.includes('bolacafe')) color = 'cafe';
                        else if (classes.includes('bolanaranja')) color = 'naranja';

                        if (number && color !== 'desconocido') {
                            colorNumberPairs.push({ color, number: parseInt(number) });
                        }
                    });

                if (colorNumberPairs.length >= 6) {
                    // Tomar solo los primeros 6
                    const pairs = colorNumberPairs.slice(0, 6);
                    const numeros = pairs.map(p => `${p.color}-${p.number}`);

                    const inserted = db.insertResult('Colorloto', sorteo, fecha, numeros, null, pairs);
                    if (inserted) {
                        console.log(`  ✅ Colorloto #${sorteo} - ${fecha}`);
                        console.log(`     Combinaciones: ${numeros.join(', ')}`);
                        scraped++;
                    }
                }
            }
        });

        console.log(`\n  📊 Total Colorloto scrapeados: ${scraped}\n`);
        return scraped;
    } catch (error) {
        console.error(`  ❌ Error scrapeando Colorloto: ${error.message}\n`);
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

module.exports = { runInitialScraping };
