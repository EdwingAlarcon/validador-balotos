const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeStructure() {
    try {
        const response = await axios.get('https://www.baloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        console.log('=== ANALIZANDO ESTRUCTURA ===\n');

        let found = {};

        $('*').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();

            // Buscar "ACUMULADO MILOTO"
            if (text === 'ACUMULADO MILOTO' && !found.miloto) {
                console.log('MILOTO encontrado:');
                console.log('  Elemento:', $el.prop('tagName'));
                console.log('  Clase:', $el.attr('class'));
                console.log('  Siguiente hermano:', $el.next().text());
                console.log('  Siguiente siguiente:', $el.next().next().text());
                console.log('  Padre:', $el.parent().text().substring(0, 100));
                found.miloto = true;
            }

            // Buscar "ACUMULADO BALOTO" (sin REVANCHA)
            if (text === 'ACUMULADO BALOTO' && !found.baloto) {
                console.log('\nBALOTO encontrado:');
                console.log('  Siguiente:', $el.next().text());
                console.log('  Siguiente siguiente:', $el.next().next().text());
                found.baloto = true;
            }

            // Buscar "ACUMULADO REVANCHA"
            if (text === 'ACUMULADO REVANCHA' && !found.revancha) {
                console.log('\nREVANCHA encontrado:');
                console.log('  Siguiente:', $el.next().text());
                console.log('  Siguiente siguiente:', $el.next().next().text());
                found.revancha = true;
            }

            // Buscar "ACUMULADO ColorLOTO"
            if (text === 'ACUMULADO ColorLOTO' && !found.colorloto) {
                console.log('\nCOLORLOTO encontrado:');
                console.log('  Siguiente:', $el.next().text());
                console.log('  Siguiente siguiente:', $el.next().next().text());
                found.colorloto = true;
            }
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

analyzeStructure();
