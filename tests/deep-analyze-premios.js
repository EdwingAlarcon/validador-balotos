const axios = require('axios');
const cheerio = require('cheerio');

async function deepAnalyze() {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);

        console.log('=== EXTRAYENDO ACUMULADOS ===\n');

        // Buscar acumulados en el texto
        $('p').each((i, el) => {
            const text = $(el).text();
            if (text.includes('acumulado')) {
                console.log(text);

                // Extraer acumulado Baloto
                const balotoMatch = text.match(/\$\s*([\d,\.]+)\s*millones?\s+y\s+\$\s*([\d,\.]+)\s*millones?/i);
                if (balotoMatch) {
                    console.log('\n✅ ACUMULADOS ENCONTRADOS:');
                    console.log(`   Baloto: $${balotoMatch[1]} millones`);
                    console.log(`   Revancha: $${balotoMatch[2]} millones`);
                }
            }
        });

        console.log('\n=== BUSCANDO TABLAS CON CLASE "table" ===\n');
        $('table').each((i, table) => {
            const $table = $(table);
            const tableClass = $table.attr('class') || 'no-class';
            console.log(`\n--- Tabla ${i} (${tableClass}) ---`);

            $table
                .find('tr')
                .slice(0, 10)
                .each((j, row) => {
                    const cells = [];
                    $(row)
                        .find('td, th')
                        .each((k, cell) => {
                            cells.push($(cell).text().trim());
                        });
                    if (cells.length > 0) {
                        console.log(cells.join(' | '));
                    }
                });
        });

        console.log('\n=== MILOTO ===\n');
        const milotoRes = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $m = cheerio.load(milotoRes.data);

        $m('p').each((i, el) => {
            const text = $m(el).text();
            if (text.includes('acumulado')) {
                console.log('Miloto acumulado:', text);
            }
        });

        console.log('\n=== COLORLOTO ===\n');
        const colorRes = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $c = cheerio.load(colorRes.data);

        $c('p').each((i, el) => {
            const text = $c(el).text();
            if (text.includes('acumulado')) {
                console.log('Colorloto acumulado:', text);
            }
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

deepAnalyze();
