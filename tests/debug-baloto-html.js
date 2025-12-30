const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function debugBalotoHTML() {
    try {
        console.log('Descargando HTML de Baloto...');
        
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const firstPanel = $('#listaResultados .panel').first();
        
        // Extraer solo el HTML del primer panel
        const panelHTML = firstPanel.html();
        
        // Guardar en archivo para inspección
        fs.writeFileSync('baloto-panel-debug.html', panelHTML);
        
        console.log('✅ HTML guardado en baloto-panel-debug.html');
        console.log('\n📋 Buscando clases de span en el panel:');
        
        firstPanel.find('span').each((i, elem) => {
            const classes = $(elem).attr('class') || 'sin-clase';
            const text = $(elem).text().trim();
            if (text) {
                console.log(`  [${i}] Clase: "${classes}" | Texto: "${text}"`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugBalotoHTML();
