const axios = require('axios');

async function downloadCSS() {
    const cssFiles = [
        { name: 'Baloto', url: 'https://www.codificatuidea.com/baloto/static/css/style-new-v13.css' },
        { name: 'Miloto', url: 'https://www.codificatuidea.com/baloto/static/miloto/css/style-miloto-new-v4.css' },
        {
            name: 'Colorloto',
            url: 'https://www.codificatuidea.com/baloto/static/colorloto/css/style-colorloto-new-v4.css',
        },
    ];

    for (const css of cssFiles) {
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`🎨 ${css.name.toUpperCase()} - ESTILOS`);
        console.log(`${'═'.repeat(70)}\n`);

        try {
            const response = await axios.get(css.url, { timeout: 10000 });
            const content = response.data;

            // Buscar clases de colores
            const ballClasses = content.match(
                /\.(yellow-ball|red-ball|blue-ball|green-ball|white-ball|black-ball)[^{]*\{[^}]*\}/gi
            );
            const numberClasses = content.match(/\.(baloto-number|miloto-number|colorloto-number)[^{]*\{[^}]*\}/gi);
            const balotaClasses = content.match(/\.balota(-[a-z]+)?[^{]*\{[^}]*background[^}]*\}/gi);

            if (ballClasses) {
                console.log('🔵 BOLAS (balls):');
                ballClasses.forEach(rule => console.log(`  ${rule}\n`));
            }

            if (numberClasses) {
                console.log('\n📊 NÚMEROS:');
                numberClasses.forEach(rule => console.log(`  ${rule}\n`));
            }

            if (balotaClasses) {
                console.log('\n🎱 BALOTAS:');
                balotaClasses.slice(0, 10).forEach(rule => console.log(`  ${rule}\n`));
            }

            // Buscar colores hexadecimales y rgb
            const colors = content.match(
                /(background-color|background|color|border-color):\s*(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))/gi
            );
            if (colors) {
                console.log('\n🎨 PALETA DE COLORES ENCONTRADA:');
                const uniqueColors = [...new Set(colors)];
                uniqueColors.slice(0, 20).forEach(color => console.log(`  ${color}`));
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

downloadCSS();
