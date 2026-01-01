const axios = require('axios');
const cheerio = require('cheerio');

async function testAcumulado() {
    try {
        console.log('Probando extracción de acumulado de Baloto...\n');

        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);
        const firstPanel = $('#listaResultados .panel').first();

        // Ver todo el contenido del panel
        console.log('=== CONTENIDO DEL PANEL ===');
        console.log(firstPanel.text().substring(0, 500));
        console.log('\n');

        // Buscar acumulado con diferentes patrones
        const panelText = firstPanel.text();

        console.log('=== BUSCANDO ACUMULADO ===');

        // Patrón 1: "Acumulado: $XXX"
        const pattern1 = panelText.match(/Acumulado[:\s]*\$([0-9.,]+)/i);
        console.log('Patrón 1 (Acumulado: $):', pattern1 ? pattern1[1] : 'No encontrado');

        // Patrón 2: Solo números grandes con $
        const pattern2 = panelText.match(/\$\s*([0-9.,]{10,})/);
        console.log('Patrón 2 ($ grande):', pattern2 ? pattern2[1] : 'No encontrado');

        // Patrón 3: Palabras relacionadas con premio
        const pattern3 = panelText.match(/Premio[:\s]*\$([0-9.,]+)/i);
        console.log('Patrón 3 (Premio:):', pattern3 ? pattern3[1] : 'No encontrado');

        // Patrón 4: Cualquier monto grande
        const allPrices = panelText.match(/\$\s*[0-9.,]+/g);
        console.log('\nTodos los montos encontrados:', allPrices);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAcumulado();
