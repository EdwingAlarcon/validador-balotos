const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        console.log('🔍 Iniciando prueba de scraping...');
        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('✅ Response recibido');
        console.log(`📏 Tamaño: ${response.data.length} bytes`);
        
        const $ = cheerio.load(response.data);
        console.log('✅ Cheerio cargado');
        
        const numbers = [];
        const firstPanel = $('#listaResultados .panel').first();
        console.log(`📦 Panel encontrado: ${firstPanel.length > 0 ? 'SÍ' : 'NO'}`);
        
        firstPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 39) {
                    numbers.push(num);
                    console.log(`  ✅ Número ${i + 1}: ${num}`);
                }
            }
        });
        
        console.log(`\n📊 Resultado final:`);
        console.log(`   Números extraídos: ${numbers.length}`);
        console.log(`   Números: [${numbers.join(', ')}]`);
        console.log('\n✅ Prueba completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

test();
