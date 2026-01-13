const axios = require('axios');
const cheerio = require('cheerio');

console.log('🔍 EXPLORANDO DATOS HISTÓRICOS DISPONIBLES\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function exploreBalotoHistory() {
    try {
        console.log('1️⃣  Probando acceso a sorteos históricos de Baloto...\n');

        // Probar URL base
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);

        // Verificar si hay enlaces de archivo/histórico
        const archiveLinks = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().toLowerCase();

            if (
                href &&
                (text.includes('archivo') ||
                    text.includes('histórico') ||
                    text.includes('anterior') ||
                    text.includes('resultados'))
            ) {
                archiveLinks.push({ text: text.trim(), href });
            }
        });

        if (archiveLinks.length > 0) {
            console.log('   ✅ Enlaces de archivo encontrados:');
            archiveLinks.forEach(link => {
                console.log(`      - ${link.text}: ${link.href}`);
            });
        } else {
            console.log('   ℹ️  No se encontraron enlaces de archivo específicos');
        }

        // Contar sorteos en página principal
        const panels = $('#listaResultados .panel');
        console.log(`\n   📊 Sorteos visibles en página principal: ${panels.length}`);

        // Buscar paginación
        console.log('\n   🔍 Buscando controles de paginación...');
        const pagination = [];
        $('.pagination a, .pager a, a[class*="pag"]').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href) {
                pagination.push({ text, href });
            }
        });

        if (pagination.length > 0) {
            console.log('   ✅ Paginación encontrada:');
            pagination.slice(0, 10).forEach(p => {
                console.log(`      - ${p.text || 'Sin texto'}: ${p.href}`);
            });
        } else {
            console.log('   ℹ️  No se encontró paginación visible');
        }

        // Probar URLs con parámetros
        console.log('\n2️⃣  Probando URLs con parámetros...\n');

        const testUrls = [
            'https://www.resultadobaloto.com/?page=2',
            'https://www.resultadobaloto.com/archivo.php',
            'https://www.resultadobaloto.com/historico.php',
            'https://www.resultadobaloto.com/resultados.php',
        ];

        for (const url of testUrls) {
            try {
                const res = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000,
                });
                console.log(`   ✅ ${url} - Status: ${res.status}`);
            } catch (err) {
                console.log(`   ❌ ${url} - ${err.response?.status || 'No disponible'}`);
            }
        }

        // Analizar estructura de sorteos específicos
        console.log('\n3️⃣  Probando acceso a sorteos específicos...\n');

        // Intentar URLs de sorteos individuales
        const sorteoTests = [2600, 2595, 2590, 2580, 2570];

        for (const sorteo of sorteoTests) {
            const url = `https://www.resultadobaloto.com/sorteo-${sorteo}.php`;
            try {
                const res = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000,
                });

                if (res.status === 200) {
                    const $page = cheerio.load(res.data);
                    const title = $page('title').text();
                    console.log(`   ✅ Sorteo ${sorteo}: ${title.substring(0, 50)}...`);
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    console.log(`   ⚠️  Sorteo ${sorteo}: No encontrado`);
                } else {
                    console.log(`   ❌ Sorteo ${sorteo}: Error ${err.message}`);
                }
            }
        }

        console.log('\n4️⃣  Verificando sorteos en página principal...\n');

        // Extraer números de sorteo visibles
        const sorteoNumbers = [];
        $('#listaResultados .panel').each((i, panel) => {
            const heading = $(panel).find('.panel-heading h2').text();
            const match = heading.match(/Baloto\s*(\d+)/i);
            if (match) {
                sorteoNumbers.push(parseInt(match[1]));
            }
        });

        if (sorteoNumbers.length > 0) {
            sorteoNumbers.sort((a, b) => b - a);
            console.log(`   📋 Sorteos disponibles: ${sorteoNumbers.join(', ')}`);
            console.log(`   📊 Rango: ${sorteoNumbers[sorteoNumbers.length - 1]} a ${sorteoNumbers[0]}`);
        }
    } catch (error) {
        console.error('❌ Error explorando históricos:', error.message);
    }
}

async function exploreMilotoHistory() {
    try {
        console.log('\n5️⃣  Explorando Miloto histórico...\n');

        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const panels = $('#listaResultados .panel, .panel');

        console.log(`   📊 Sorteos Miloto visibles: ${panels.length}`);

        const sorteos = [];
        panels.each((i, panel) => {
            const heading = $(panel).find('.panel-heading h2, h2').text();
            const match = heading.match(/Miloto\s*(\d+)/i);
            if (match) {
                sorteos.push(parseInt(match[1]));
            }
        });

        if (sorteos.length > 0) {
            sorteos.sort((a, b) => b - a);
            console.log(`   📋 Sorteos: ${sorteos.slice(0, 10).join(', ')}...`);
            console.log(`   📊 Rango: ${sorteos[sorteos.length - 1]} a ${sorteos[0]}`);
        }
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
}

async function exploreColorlotoHistory() {
    try {
        console.log('\n6️⃣  Explorando Colorloto histórico...\n');

        const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const $ = cheerio.load(response.data);
        const panels = $('#listaResultados .panel, .panel');

        console.log(`   📊 Sorteos Colorloto visibles: ${panels.length}`);
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
}

// Ejecutar exploración
(async () => {
    await exploreBalotoHistory();
    await exploreMilotoHistory();
    await exploreColorlotoHistory();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ EXPLORACIÓN COMPLETADA\n');
    console.log('💡 Próximo paso: Crear script de scraping masivo basado en');
    console.log('   los datos encontrados.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
})();
