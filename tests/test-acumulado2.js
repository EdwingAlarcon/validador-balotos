const axios = require('axios');
const cheerio = require('cheerio');

async function testAcumuladoBaloto() {
    console.log('=== PROBANDO BALOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    // Buscar "millones" con contexto
    const millonesMatch = bodyText.match(/(\d+)\s*millones/i);
    console.log('Millones encontrados:', millonesMatch ? millonesMatch[0] : 'No');

    // Buscar cerca de "Baloto"
    const balotoSection = bodyText.substring(bodyText.indexOf('Baloto'), bodyText.indexOf('Baloto') + 500);
    console.log('\nTexto cerca de "Baloto":\n', balotoSection.substring(0, 300));
}

async function testAcumuladoMiloto() {
    console.log('\n\n=== PROBANDO MILOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    const millonesMatch = bodyText.match(/(\d+)\s*millones/i);
    console.log('Millones encontrados:', millonesMatch ? millonesMatch[0] : 'No');
}

async function testAcumuladoColorloto() {
    console.log('\n\n=== PROBANDO COLORLOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    const millonesMatch = bodyText.match(/(\d+)\s*millones/i);
    console.log('Millones encontrados:', millonesMatch ? millonesMatch[0] : 'No');
}

(async () => {
    try {
        await testAcumuladoBaloto();
        await testAcumuladoMiloto();
        await testAcumuladoColorloto();
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
