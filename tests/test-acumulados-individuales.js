const axios = require('axios');
const cheerio = require('cheerio');

async function testBaloto() {
    console.log('=== BALOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    // Buscar en el panel específico de Baloto
    const balotoPanel = $('#listaResultados .panel').first();
    const balotoText = balotoPanel.text();

    console.log('Texto del panel Baloto (primeros 800 chars):');
    console.log(balotoText.substring(0, 800));
    console.log('\n');

    // Buscar todos los "millones" en el panel
    const allMillones = balotoText.match(/(\d+)\s*millones/gi);
    console.log('Todos los millones en panel Baloto:', allMillones);
    console.log('\n\n');
}

async function testRevancha() {
    console.log('=== BALOTO REVANCHA ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    // El panel de Baloto contiene tanto Baloto como Revancha
    // Buscar la sección de Revancha específicamente
    const bodyText = $('body').text();
    const revanchaIndex = bodyText.toLowerCase().indexOf('revancha');
    const revanchaSection = bodyText.substring(revanchaIndex, revanchaIndex + 500);

    console.log('Texto cerca de "Revancha":');
    console.log(revanchaSection);
    console.log('\n\n');
}

async function testMiloto() {
    console.log('=== MILOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    const milotoPanel = $('#listaResultados .panel').first();
    const milotoText = milotoPanel.text();

    console.log('Texto del panel Miloto (primeros 800 chars):');
    console.log(milotoText.substring(0, 800));
    console.log('\n');

    const allMillones = milotoText.match(/(\d+)\s*millones/gi);
    console.log('Todos los millones en panel Miloto:', allMillones);
    console.log('\n\n');
}

async function testColorloto() {
    console.log('=== COLORLOTO ===\n');
    const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    const colorlotoPanel = $('#listaResultados .panel').first();
    const colorlotoText = colorlotoPanel.text();

    console.log('Texto del panel Colorloto (primeros 800 chars):');
    console.log(colorlotoText.substring(0, 800));
    console.log('\n');

    const allMillones = colorlotoText.match(/(\d+)\s*millones/gi);
    console.log('Todos los millones en panel Colorloto:', allMillones);
    console.log('\n\n');
}

(async () => {
    try {
        await testBaloto();
        await testRevancha();
        await testMiloto();
        await testColorloto();
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
