const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeColors() {
    const pages = [
        { name: 'Baloto', url: 'https://baloto.com/resultados' },
        { name: 'Miloto', url: 'https://baloto.com/miloto/resultados' },
        { name: 'Colorloto', url: 'https://baloto.com/colorloto/resultados' },
    ];

    for (const page of pages) {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`🎨 ANÁLISIS DE COLORES: ${page.name.toUpperCase()}`);
        console.log(`${'═'.repeat(60)}\n`);

        try {
            const response = await axios.get(page.url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                },
                timeout: 10000,
                maxRedirects: 5,
            });

            const $ = cheerio.load(response.data);

            console.log(`📄 URL: ${page.url}`);
            console.log(`✅ Página cargada correctamente\n`);

            // Buscar elementos de números
            const numberElements = [
                '.ball',
                '.number',
                '.num',
                '.balota',
                '.resultado',
                '[class*="ball"]',
                '[class*="number"]',
                '[class*="num"]',
                '[class*="resultado"]',
                '[class*="bola"]',
            ];

            console.log('🔍 Buscando elementos de números...\n');

            let foundElements = false;
            for (const selector of numberElements) {
                const elements = $(selector);
                if (elements.length > 0) {
                    foundElements = true;
                    console.log(`  ✓ Selector: ${selector} (${elements.length} elementos)`);

                    // Analizar estilos inline y clases
                    elements.slice(0, 5).each((i, elem) => {
                        const style = $(elem).attr('style');
                        const className = $(elem).attr('class');
                        const text = $(elem).text().trim();

                        if (i === 0) {
                            console.log(`    Ejemplo: "${text}"`);
                            if (className) console.log(`    Clase: ${className}`);
                            if (style) console.log(`    Style: ${style}`);
                        }
                    });
                    console.log('');
                }
            }

            if (!foundElements) {
                console.log('  ⚠️ No se encontraron elementos de números con selectores comunes\n');
            }

            // Buscar estilos CSS en la página
            console.log('📋 Estilos CSS encontrados:\n');
            const styles = $('style');
            if (styles.length > 0) {
                let cssContent = '';
                styles.each((i, elem) => {
                    cssContent += $(elem).html() + '\n';
                });

                // Buscar reglas con colores
                const colorRules = cssContent.match(/\.(ball|number|num|balota|resultado|bola)[^{]*\{[^}]*\}/gi);
                if (colorRules) {
                    colorRules.slice(0, 10).forEach(rule => {
                        console.log(`  ${rule.substring(0, 200)}...`);
                    });
                } else {
                    console.log('  ⚠️ No se encontraron reglas CSS relevantes en <style>');
                }
            }

            // Buscar links a CSS externos
            console.log('\n🔗 Archivos CSS externos:\n');
            const cssLinks = $('link[rel="stylesheet"]');
            cssLinks.slice(0, 5).each((i, elem) => {
                console.log(`  • ${$(elem).attr('href')}`);
            });

            // Analizar la estructura general
            console.log('\n📊 Estructura HTML principal:\n');
            const mainContent = $('main, .main, #main, .content, #content, .resultados, .results').first();
            if (mainContent.length > 0) {
                const htmlSnippet = mainContent.html();
                if (htmlSnippet) {
                    console.log(htmlSnippet.substring(0, 500).replace(/\s+/g, ' '));
                }
            }
        } catch (error) {
            console.error(`❌ Error al obtener ${page.name}:`, error.message);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Headers:`, error.response.headers);
            }
        }
    }
}

analyzeColors();
