const axios = require('axios');
const cheerio = require('cheerio');

async function debugBalotoRevancha() {
    try {
        console.log('🔍 Analizando estructura de resultadobaloto.com...\n');

        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        console.log('📊 TODOS LOS PANELES ENCONTRADOS:\n');
        $('#listaResultados .panel').each((i, panel) => {
            console.log(`\n════════ PANEL ${i} ════════`);

            const heading = $(panel).find('.panel-heading h2').text().trim();
            console.log(`Título: ${heading}`);

            const timeElement = $(panel).find('time');
            if (timeElement.length > 0) {
                console.log(`Fecha: ${timeElement.text().trim()}`);
            }

            const numbers = [];
            $(panel)
                .find('.label-baloto')
                .each((j, elem) => {
                    numbers.push($(elem).text().trim());
                });
            console.log(`Números (.label-baloto): [${numbers.join(', ')}]`);

            const superBalota = [];
            $(panel)
                .find('.label-comple')
                .each((j, elem) => {
                    superBalota.push($(elem).text().trim());
                });
            console.log(`Súper Balota (.label-comple): [${superBalota.join(', ')}]`);

            console.log(`═══════════════════════════\n`);
        });

        console.log('\n🎯 PRUEBA DE SCRAPING CON .eq(1):\n');
        const revanchaPanel = $('#listaResultados .panel').eq(1);
        const heading = revanchaPanel.find('.panel-heading h2').text().trim();
        console.log(`Título del panel .eq(1): ${heading}`);

        const numbers = [];
        revanchaPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                numbers.push($(elem).text().trim());
            }
        });
        console.log(`Números extraídos: [${numbers.join(', ')}]`);

        const superBalota = [];
        revanchaPanel.find('.label-comple').each((i, elem) => {
            if (superBalota.length < 1) {
                superBalota.push($(elem).text().trim());
            }
        });
        console.log(`Súper Balota extraída: [${superBalota.join(', ')}]`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugBalotoRevancha();
