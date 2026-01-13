const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../src/services/database');

console.log('🔄 SCRAPING MASIVO DE DATOS HISTÓRICOS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

db.initDatabase();

async function massiveScrapeBaloto() {
    console.log('1️⃣  Scraping masivo de Baloto desde /resultados.php...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/resultados.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;
        let duplicates = 0;

        // Buscar todos los paneles de resultados
        $('#listaResultados .panel, .panel').each((i, panel) => {
            const $panel = $(panel);
            const heading = $panel.find('.panel-heading h2, h2').text();
            const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $panel.find('time').text().trim() || $panel.find('.fecha, .date').text().trim();

                // Extraer números principales
                const numeros = [];
                $panel.find('.label-baloto').each((j, elem) => {
                    if (numeros.length < 5) {
                        const num = $(elem).text().trim();
                        if (num && !isNaN(num)) numeros.push(num);
                    }
                });

                // Extraer súper balota
                const superBalota = $panel.find('.label-comple').first().text().trim();

                if (numeros.length === 5 && superBalota && fecha) {
                    const inserted = db.insertResult('Baloto', sorteo, fecha, numeros, superBalota);
                    if (inserted) {
                        console.log(`   ✅ Baloto #${sorteo} - ${fecha}`);
                        console.log(`      ${numeros.join(', ')} + SB: ${superBalota}`);
                        scraped++;
                    } else {
                        duplicates++;
                    }
                }
            }

            // También buscar Baloto Revancha en el mismo panel
            if (heading.match(/revancha/i) || $panel.find('*:contains("Revancha")').length > 0) {
                const sorteoMatch2 = heading.match(/(\d+)/);
                if (sorteoMatch2) {
                    const sorteo = parseInt(sorteoMatch2[1]);
                    const fecha = $panel.find('time').text().trim() || $panel.find('.fecha, .date').text().trim();

                    const numeros = [];
                    $panel.find('.label-baloto').each((j, elem) => {
                        const num = $(elem).text().trim();
                        if (num && !isNaN(num) && numeros.length < 5) {
                            numeros.push(num);
                        }
                    });

                    const superBalota = $panel.find('.label-comple').first().text().trim();

                    if (numeros.length === 5 && superBalota && fecha) {
                        const inserted = db.insertResult('Baloto Revancha', sorteo, fecha, numeros, superBalota);
                        if (inserted) {
                            console.log(`   ✅ Revancha #${sorteo} - ${fecha}`);
                            scraped++;
                        } else {
                            duplicates++;
                        }
                    }
                }
            }
        });

        console.log(`\n   📊 Total Baloto scrapeados: ${scraped}`);
        console.log(`   ℹ️  Duplicados omitidos: ${duplicates}\n`);

        return scraped;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        return 0;
    }
}

async function massiveScrapeMiloto() {
    console.log('2️⃣  Scraping masivo de Miloto...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;
        let duplicates = 0;

        $('#listaResultados .panel, .panel').each((i, panel) => {
            const $panel = $(panel);
            const heading = $panel.find('.panel-heading h2, h2').text();
            const sorteoMatch = heading.match(/Miloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $panel.find('time').text().trim() || $panel.find('.fecha, .date').text().trim();

                const numeros = [];
                $panel.find('.label-baloto').each((j, elem) => {
                    if (numeros.length < 5) {
                        const num = $(elem).text().trim();
                        if (num && !isNaN(num)) numeros.push(num);
                    }
                });

                if (numeros.length === 5 && fecha) {
                    const inserted = db.insertResult('Miloto', sorteo, fecha, numeros);
                    if (inserted) {
                        console.log(`   ✅ Miloto #${sorteo} - ${fecha}`);
                        console.log(`      ${numeros.join(', ')}`);
                        scraped++;
                    } else {
                        duplicates++;
                    }
                }
            }
        });

        console.log(`\n   📊 Total Miloto scrapeados: ${scraped}`);
        console.log(`   ℹ️  Duplicados omitidos: ${duplicates}\n`);

        return scraped;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        return 0;
    }
}

async function massScrapeColorloto() {
    console.log('3️⃣  Scraping masivo de Colorloto...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        let scraped = 0;
        let duplicates = 0;

        $('#listaResultados .panel, .panel').each((i, panel) => {
            const $panel = $(panel);
            const heading = $panel.find('.panel-heading h2, h2').text();
            const sorteoMatch = heading.match(/Colorloto\s*(\d+)/i);

            if (sorteoMatch) {
                const sorteo = parseInt(sorteoMatch[1]);
                const fecha = $panel.find('time').text().trim() || $panel.find('.fecha, .date').text().trim();

                const pairs = [];
                $panel.find('.label-color').each((j, elem) => {
                    const color =
                        $(elem).attr('data-color') ||
                        $(elem)
                            .attr('class')
                            .match(/color-(\w+)/)?.[1];
                    const number = $(elem).text().trim();

                    if (color && number && !isNaN(number)) {
                        pairs.push({ color, number: parseInt(number) });
                    }
                });

                if (pairs.length === 6 && fecha) {
                    const inserted = db.insertResult('Colorloto', sorteo, fecha, [], null, pairs);
                    if (inserted) {
                        const pairStr = pairs.map(p => `${p.color}-${p.number}`).join(', ');
                        console.log(`   ✅ Colorloto #${sorteo} - ${fecha}`);
                        console.log(`      ${pairStr}`);
                        scraped++;
                    } else {
                        duplicates++;
                    }
                }
            }
        });

        console.log(`\n   📊 Total Colorloto scrapeados: ${scraped}`);
        console.log(`   ℹ️  Duplicados omitidos: ${duplicates}\n`);

        return scraped;
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        return 0;
    }
}

// Ejecutar scraping masivo
(async () => {
    console.log('Iniciando scraping masivo de históricos...\n\n');

    const balotoCount = await massiveScrapeBaloto();
    const milotoCount = await massiveScrapeMiloto();
    const colorlotoCount = await massScrapeColorloto();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DEL SCRAPING MASIVO\n');
    console.log(`   Baloto nuevos:    ${balotoCount} sorteos`);
    console.log(`   Miloto nuevos:    ${milotoCount} sorteos`);
    console.log(`   Colorloto nuevos: ${colorlotoCount} sorteos`);
    console.log(`   ──────────────────────────────`);
    console.log(`   TOTAL NUEVOS:     ${balotoCount + milotoCount + colorlotoCount} sorteos`);

    console.log('\n💾 ESTADO TOTAL DE LA BASE DE DATOS\n');
    console.log(`   Baloto:           ${db.getTotalResults('Baloto')} registros`);
    console.log(`   Baloto Revancha:  ${db.getTotalResults('Baloto Revancha')} registros`);
    console.log(`   Miloto:           ${db.getTotalResults('Miloto')} registros`);
    console.log(`   Colorloto:        ${db.getTotalResults('Colorloto')} registros`);
    console.log(`   ──────────────────────────────`);
    console.log(`   TOTAL BD:         ${db.getTotalResults()} registros`);

    const minRequired = 20;
    const balotoTotal = db.getTotalResults('Baloto');
    const milotoTotal = db.getTotalResults('Miloto');
    const colorlotoTotal = db.getTotalResults('Colorloto');

    console.log('\n✅ VALIDACIÓN DE DATOS\n');

    if (balotoTotal >= minRequired) {
        console.log(`   ✅ Baloto: ${balotoTotal} sorteos (suficiente)`);
    } else {
        console.log(`   ⚠️  Baloto: ${balotoTotal} sorteos (se recomienda ${minRequired})`);
    }

    if (milotoTotal >= minRequired) {
        console.log(`   ✅ Miloto: ${milotoTotal} sorteos (suficiente)`);
    } else {
        console.log(`   ⚠️  Miloto: ${milotoTotal} sorteos (se recomienda ${minRequired})`);
    }

    if (colorlotoTotal >= minRequired) {
        console.log(`   ✅ Colorloto: ${colorlotoTotal} sorteos (suficiente)`);
    } else {
        console.log(`   ⚠️  Colorloto: ${colorlotoTotal} sorteos (se recomienda ${minRequired})`);
    }

    const allSufficient = balotoTotal >= minRequired && milotoTotal >= minRequired && colorlotoTotal >= minRequired;

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (allSufficient) {
        console.log('🎉 ÉXITO: Hay datos suficientes para implementar generador estadístico\n');
    } else {
        console.log('⚠️  Se necesitan más datos. Considera ejecutar scraping adicional.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
})();
