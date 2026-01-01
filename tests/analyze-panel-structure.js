const axios = require('axios');
const cheerio = require('cheerio');

async function analyzePanelStructure() {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        console.log('🔍 ANÁLISIS DETALLADO DEL PRIMER PANEL:\n');

        const firstPanel = $('#listaResultados .panel').eq(0);

        console.log('═══════════════════════════════════════');
        console.log('Título:', firstPanel.find('.panel-heading h2').text().trim());
        console.log('═══════════════════════════════════════\n');

        console.log('📋 Estructura HTML del panel-body:');
        const panelBody = firstPanel.find('.panel-body');

        // Buscar todas las filas/secciones
        panelBody.find('.row').each((i, row) => {
            console.log(`\n--- FILA ${i} ---`);

            $(row)
                .find('.col-md-6, .col-sm-6, .col-xs-6, [class*="col-"]')
                .each((j, col) => {
                    const heading = $(col).find('h3, h4, p strong, .text-center').first().text().trim();
                    console.log(`  📌 Sección: ${heading || '(sin título)'}`);

                    const numbers = [];
                    $(col)
                        .find('.label-baloto')
                        .each((k, elem) => {
                            numbers.push($(elem).text().trim());
                        });
                    if (numbers.length > 0) {
                        console.log(`     Números: [${numbers.join(', ')}]`);
                    }

                    const superBalota = [];
                    $(col)
                        .find('.label-comple')
                        .each((k, elem) => {
                            superBalota.push($(elem).text().trim());
                        });
                    if (superBalota.length > 0) {
                        console.log(`     Súper Balota: [${superBalota.join(', ')}]`);
                    }
                });
        });

        console.log('\n\n🎯 ESTRATEGIA DE SCRAPING:\n');
        console.log('Los 10 números encontrados corresponden a:');
        console.log('  • Primeros 5 números: BALOTO normal');
        console.log('  • Segundos 5 números: BALOTO REVANCHA');
        console.log('  • Primera Súper Balota: BALOTO normal');
        console.log('  • Segunda Súper Balota: BALOTO REVANCHA');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzePanelStructure();
