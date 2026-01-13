const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeTableStructure() {
    try {
        console.log('🔍 Analizando estructura de tablas de premios...\n');

        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);

        console.log('=== ACUMULADO PRINCIPAL ===\n');
        // Buscar el acumulado en el texto principal
        $('p').each((i, el) => {
            const text = $(el).text();
            if (text.includes('premio acumulado')) {
                console.log('Texto encontrado:', text);
                // Extraer el valor del acumulado
                const match = text.match(/\$\s*([\d,\.]+)\s*millones?/i);
                if (match) {
                    console.log('Acumulado extraído:', match[1]);
                }
            }
        });

        console.log('\n=== TABLA DE PREMIOS BALOTO ===\n');
        const firstPanel = $('#listaResultados .panel').first();

        // Buscar todas las filas de la tabla
        firstPanel.find('tr').each((i, row) => {
            const $row = $(row);
            const cells = [];
            $row.find('td, th').each((j, cell) => {
                cells.push($(cell).text().trim());
            });
            if (cells.length > 0) {
                console.log(`Fila ${i}:`, cells.join(' | '));
            }
        });

        console.log('\n=== ESTRUCTURA COMPLETA TABLA ===\n');
        const table = firstPanel.find('table').first();
        if (table.length > 0) {
            console.log('Tabla encontrada!');
            console.log('HTML:', table.html().substring(0, 500));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzeTableStructure();
