const axios = require('axios');
const cheerio = require('cheerio');

async function verifyAcumulados() {
    console.log('🔍 Verificando acumulados en resultadobaloto.com...\n');

    try {
        // Página principal de Baloto
        console.log('=== BALOTO Y REVANCHA ===');
        const balotoRes = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $b = cheerio.load(balotoRes.data);

        $b('p').each((i, el) => {
            const text = $b(el).text();
            if (text.includes('acumulado') && text.includes('próximo sorteo')) {
                console.log('Texto encontrado:', text);

                // Extraer acumulados
                const match = text.match(/\$\s*([\d,\.]+)\s*millones?\s+y\s+\$\s*([\d,\.]+)\s*millones?/i);
                if (match) {
                    console.log(`✅ Baloto: $${match[1]} millones`);
                    console.log(`✅ Revancha: $${match[2]} millones`);
                }
            }
        });

        // Página de Miloto
        console.log('\n=== MILOTO ===');
        const milotoRes = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $m = cheerio.load(milotoRes.data);

        $m('p').each((i, el) => {
            const text = $m(el).text();
            if (text.includes('acumulado') && text.includes('próximo sorteo')) {
                console.log('Texto encontrado:', text);

                // Intentar diferentes patrones
                let match = text.match(/\$\s*([\d,\.]+)\s*millones?.*Miloto/i);
                if (!match) {
                    match = text.match(/Miloto.*\$\s*([\d,\.]+)\s*millones?/i);
                }
                if (!match) {
                    match = text.match(/\$\s*([\d,\.]+)\s*millones?/i);
                }

                if (match) {
                    console.log(`✅ Miloto acumulado: $${match[1]} millones`);
                    console.log(`   Valor numérico: ${parseFloat(match[1].replace(/,/g, ''))}`);
                } else {
                    console.log('❌ No se pudo extraer con regex');
                }
            }
        });

        // Página de Colorloto
        console.log('\n=== COLORLOTO ===');
        const colorRes = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $c = cheerio.load(colorRes.data);

        $c('p').each((i, el) => {
            const text = $c(el).text();
            if (text.includes('acumulado') && text.includes('próximo sorteo')) {
                console.log('Texto encontrado:', text);

                const match = text.match(/\$\s*([\d,\.]+)\s*millones?.*Colorloto/i);
                if (match) {
                    console.log(`✅ Colorloto acumulado: $${match[1]} millones`);
                }
            }
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyAcumulados();
