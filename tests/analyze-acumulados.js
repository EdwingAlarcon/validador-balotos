const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeAcumulados() {
    try {
        console.log('🔍 Analizando HTML de resultadobaloto.com...\n');

        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);

        console.log('=== BUSCANDO ACUMULADOS ===\n');

        // Buscar elementos que contengan "acumulado"
        $('*').each((i, el) => {
            const text = $(el).text().trim();
            if (text.match(/acumulado/i) && text.length < 200 && text.length > 5) {
                const tagName = $(el).prop('tagName');
                const className = $(el).attr('class') || 'no-class';
                const id = $(el).attr('id') || 'no-id';
                console.log(`${tagName}#${id}.${className}`);
                console.log(`  Texto: ${text.substring(0, 100)}`);
                console.log('---');
            }
        });

        console.log('\n=== BUSCANDO PREMIOS ===\n');

        // Buscar elementos que contengan cantidades de dinero
        $('*').each((i, el) => {
            const text = $(el).text().trim();
            if (text.match(/\$[\s,\d]+\.?\d*\s*(millón|mill|m)?/i) && text.length < 100 && text.length > 3) {
                const tagName = $(el).prop('tagName');
                const className = $(el).attr('class') || 'no-class';
                const id = $(el).attr('id') || 'no-id';
                console.log(`${tagName}#${id}.${className}`);
                console.log(`  Texto: ${text}`);
                console.log('---');
            }
        });

        console.log('\n=== PANEL PRINCIPAL DE BALOTO ===\n');
        const firstPanel = $('#listaResultados .panel').first();
        console.log('HTML del panel:');
        console.log(firstPanel.html());
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzeAcumulados();
