const axios = require('axios');
const cheerio = require('cheerio');

async function findAcumulados() {
    console.log('=== BUSCANDO ESTRUCTURA DE ACUMULADOS ===\n');

    // Test Baloto
    const balotoResponse = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $baloto = cheerio.load(balotoResponse.data);

    console.log('1. BALOTO - Buscando "millones" en h3, h4, strong, b:');
    $baloto('h3, h4, strong, b, .premio, .acumulado').each((i, elem) => {
        const text = $baloto(elem).text().trim();
        if (text.toLowerCase().includes('millon') || text.includes('$')) {
            console.log(`   ${text}`);
        }
    });

    console.log('\n2. BALOTO - Buscando en divs con "Baloto":');
    $baloto('div').each((i, elem) => {
        const text = $baloto(elem).text();
        if (text.includes('Baloto') && text.includes('millon')) {
            console.log(`   ${text.substring(0, 200)}`);
        }
    });

    // Test Miloto
    console.log('\n\n3. MILOTO:');
    const milotoResponse = await axios.get('https://www.resultadobaloto.com/miloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $miloto = cheerio.load(milotoResponse.data);

    $miloto('h3, h4, strong, b').each((i, elem) => {
        const text = $miloto(elem).text().trim();
        if (text.toLowerCase().includes('millon') || (text.includes('$') && text.length < 100)) {
            console.log(`   ${text}`);
        }
    });

    // Test Colorloto
    console.log('\n\n4. COLORLOTO:');
    const colorlotoResponse = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $colorloto = cheerio.load(colorlotoResponse.data);

    $colorloto('h3, h4, strong, b').each((i, elem) => {
        const text = $colorloto(elem).text().trim();
        if (text.toLowerCase().includes('millon') || (text.includes('$') && text.length < 100)) {
            console.log(`   ${text}`);
        }
    });

    // Buscar patrones específicos en toda la página de Baloto
    console.log('\n\n5. BALOTO - Todo el texto con "millones":');
    const bodyText = $baloto('body').text();
    const lines = bodyText.split('\n');
    for (let line of lines) {
        if (line.includes('millon') && line.trim().length < 150) {
            console.log(`   ${line.trim()}`);
        }
    }
}

findAcumulados().catch(console.error);
