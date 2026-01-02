const axios = require('axios');
const cheerio = require('cheerio');

async function debugColorloto() {
    console.log('🔍 Investigando estructura HTML de Colorloto...\n');

    try {
        const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);

        console.log('📊 Elementos encontrados:');
        console.log('  Paneles (#listaResultados .panel):', $('#listaResultados .panel').length);
        console.log('  Títulos H2:', $('.panel-heading h2').length);
        console.log('  Elementos .label-baloto:', $('.label-baloto').length);
        console.log('  Elementos .label-colorloto:', $('.label-colorloto').length);
        console.log('  Elementos .color-numero:', $('.color-numero').length);
        console.log('  Elementos .number:', $('.number').length);

        console.log('\n📝 Primer panel HTML:');
        const firstPanel = $('#listaResultados .panel').first();
        if (firstPanel.length) {
            console.log(firstPanel.html().substring(0, 500));

            console.log('\n🎯 Extrayendo datos del primer panel:');
            const heading = firstPanel.find('.panel-heading h2').text();
            console.log('  Título:', heading);
            const fecha = firstPanel.find('time').text().trim();
            console.log('  Fecha:', fecha);

            // Buscar diferentes selectores posibles
            console.log('\n🔎 Buscando números con diferentes selectores:');
            firstPanel.find('span[class*="label"]').each((i, elem) => {
                console.log(`  ${i + 1}. Clase: ${$(elem).attr('class')} - Texto: ${$(elem).text().trim()}`);
            });
        } else {
            console.log('⚠️ No se encontraron paneles');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugColorloto();
