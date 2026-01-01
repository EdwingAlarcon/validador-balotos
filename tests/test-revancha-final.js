const axios = require('axios');
const cheerio = require('cheerio');

async function testBalotoRevancha() {
    try {
        console.log('🧪 PRUEBA DE EXTRACCIÓN DE BALOTO REVANCHA\n');

        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

        const firstPanel = $('#listaResultados .panel').eq(0);

        console.log('📊 PANEL COMPLETO:');
        console.log('Título:', firstPanel.find('.panel-heading h2').text().trim());
        console.log('Fecha:', firstPanel.find('time').text().trim());

        const allNumbers = [];
        firstPanel.find('.label-baloto').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 43) {
                allNumbers.push(num);
            }
        });

        const allSuperBalotas = [];
        firstPanel.find('.label-comple').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 16) {
                allSuperBalotas.push(num);
            }
        });

        console.log('\n✅ EXTRACCIÓN EXITOSA:');
        console.log('═══════════════════════════════════════');
        console.log('🎱 BALOTO (primeros 5 números):');
        console.log(`   Números: [${allNumbers.slice(0, 5).join(', ')}]`);
        console.log(`   Súper Balota: ${allSuperBalotas[0]}`);
        console.log('\n🎯 BALOTO REVANCHA (últimos 5 números):');
        console.log(`   Números: [${allNumbers.slice(5, 10).join(', ')}]`);
        console.log(`   Súper Balota: ${allSuperBalotas[1]}`);
        console.log('═══════════════════════════════════════');

        // Simular el endpoint
        const numbers = allNumbers.slice(5, 10);
        const superBalota = allSuperBalotas[1];
        const fecha = firstPanel.find('time').text().trim();
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto.*?(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;

        console.log('\n📡 RESPUESTA DEL ENDPOINT:');
        console.log(
            JSON.stringify(
                {
                    success: true,
                    numbers: numbers,
                    superBalota: superBalota,
                    fecha: fecha,
                    sorteo: sorteo,
                    source: 'resultadobaloto.com',
                },
                null,
                2
            )
        );
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testBalotoRevancha();
