const axios = require('axios');
const cheerio = require('cheerio');

async function testBalotoScraping() {
    try {
        console.log('🔍 Probando scraping de Baloto desde resultadobaloto.com...\n');
        
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('✅ Página descargada correctamente');
        console.log(`📏 Tamaño: ${response.data.length} bytes\n`);
        
        const $ = cheerio.load(response.data);
        
        // Buscar primer panel
        const firstPanel = $('#listaResultados .panel').first();
        console.log(`📦 Panel encontrado: ${firstPanel.length > 0 ? 'SÍ' : 'NO'}\n`);
        
        // Números principales
        const numbers = [];
        firstPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 43) {
                    numbers.push(num);
                    console.log(`  🎲 Número ${i + 1}: ${num}`);
                }
            }
        });
        
        // Súper Balota
        const superBalota = [];
        firstPanel.find('.label-comple').each((i, elem) => {
            if (superBalota.length < 1) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 16) {
                    superBalota.push(num);
                    console.log(`  ⭐ Súper Balota: ${num}`);
                }
            }
        });
        
        // Fecha
        const timeElement = firstPanel.find('time');
        const fecha = timeElement.length > 0 ? timeElement.text().trim() : null;
        console.log(`  📅 Fecha: ${fecha || 'No encontrada'}`);
        
        // Sorteo
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;
        console.log(`  🎫 Sorteo: ${sorteo || 'No encontrado'}`);
        
        console.log('\n📊 Resultado final:');
        console.log(`   Números: [${numbers.join(', ')}]`);
        console.log(`   Súper Balota: ${superBalota[0] || 'No encontrada'}`);
        console.log(`   Total números: ${numbers.length}/5`);
        console.log(`   Total súper balota: ${superBalota.length}/1`);
        
        if (numbers.length === 5 && superBalota.length === 1) {
            console.log('\n✅ ¡Scraping de Baloto exitoso!');
        } else {
            console.log('\n❌ Faltan datos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testBalotoScraping();
