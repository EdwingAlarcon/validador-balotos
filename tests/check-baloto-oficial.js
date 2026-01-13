const axios = require('axios');
const cheerio = require('cheerio');

async function checkBalotoOficial() {
    console.log('🔍 Intentando acceder a baloto.com (sitio oficial)...\n');

    try {
        const response = await axios.get('https://www.baloto.com/', {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 10000,
            maxRedirects: 5,
        });

        console.log('✅ Respuesta recibida');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Tamaño:', response.data.length, 'caracteres');

        const $ = cheerio.load(response.data);

        console.log('\n=== BUSCANDO ACUMULADOS ===\n');

        // Buscar en todo el contenido
        const bodyText = $('body').text();

        // Buscar Miloto
        const milotoMatch =
            bodyText.match(/miloto.*?(\d+)\s*millones?/i) || bodyText.match(/(\d+)\s*millones?.*?miloto/i);
        if (milotoMatch) {
            console.log('💰 Miloto:', milotoMatch[0]);
        }

        // Buscar cualquier mención de acumulados
        $('*').each((i, el) => {
            const text = $(el).text().trim();
            if (text.match(/acumulado/i) && text.length < 200) {
                console.log('Acumulado encontrado:', text.substring(0, 150));
            }
        });

        // Buscar números grandes (acumulados)
        const bigNumbers = bodyText.match(/\$?\s*\d+[.,]?\d*\s*millones?/gi);
        if (bigNumbers) {
            console.log('\n=== NÚMEROS ENCONTRADOS ===');
            const unique = [...new Set(bigNumbers)];
            unique.slice(0, 10).forEach(num => console.log('  -', num));
        }
    } catch (error) {
        console.error('❌ Error al acceder a baloto.com:', error.message);
        console.log('\n📝 Nota: El sitio baloto.com puede usar JavaScript para cargar datos dinámicamente.');
        console.log('    En ese caso, necesitaríamos usar un browser headless (puppeteer).');
    }
}

checkBalotoOficial();
