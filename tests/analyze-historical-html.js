const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function analyzeHistoricalHTML() {
    console.log('🔍 Analizando estructura HTML de páginas históricas...\n');

    // Descargar y analizar resultados.php
    const response = await axios.get('https://www.resultadobaloto.com/resultados.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    // Guardar HTML completo
    fs.writeFileSync('tests/resultados-page.html', response.data);
    console.log('✅ HTML guardado en: tests/resultados-page.html');
    console.log('📏 Tamaño del HTML:', response.data.length, 'bytes\n');

    const $ = cheerio.load(response.data);

    // Buscar cualquier contenedor de resultados
    console.log('🔎 Buscando contenedores de resultados...\n');

    const containers = [
        { selector: '#listaResultados', name: 'listaResultados' },
        { selector: '.panel', name: 'panel' },
        { selector: '.resultado', name: 'resultado' },
        { selector: '[class*="result"]', name: 'elementos con "result"' },
        { selector: '[id*="result"]', name: 'elementos con id "result"' },
        { selector: 'table', name: 'tablas' },
        { selector: '.sorteo', name: 'sorteo' },
        { selector: '[class*="sorteo"]', name: 'elementos con "sorteo"' },
    ];

    containers.forEach(({ selector, name }) => {
        const elements = $(selector);
        if (elements.length > 0) {
            console.log(`✅ ${name} (${selector}): ${elements.length} encontrados`);

            // Mostrar el primer elemento como muestra
            if (elements.length > 0) {
                const firstHTML = $(elements[0]).html();
                if (firstHTML && firstHTML.length < 500) {
                    console.log('   Primer elemento:', firstHTML.substring(0, 200));
                }
            }
        } else {
            console.log(`❌ ${name} (${selector}): 0 encontrados`);
        }
    });

    // Buscar scripts que puedan cargar datos dinámicamente
    console.log('\n📜 Analizando scripts JavaScript...\n');
    let hasAjaxLoading = false;
    $('script').each((i, elem) => {
        const scriptContent = $(elem).html();
        if (
            scriptContent &&
            (scriptContent.includes('ajax') ||
                scriptContent.includes('fetch') ||
                scriptContent.includes('XMLHttpRequest'))
        ) {
            console.log('⚠️  Detectado script con carga AJAX/Fetch - Los datos pueden cargarse dinámicamente');
            hasAjaxLoading = true;
        }
    });

    if (!hasAjaxLoading) {
        console.log('ℹ️  No se detectaron scripts de carga dinámica');
    }

    // Buscar enlaces a JSON o APIs
    console.log('\n🔗 Buscando enlaces a APIs o archivos JSON...\n');
    const apiLinks = [];
    $('script').each((i, elem) => {
        const scriptContent = $(elem).html();
        if (scriptContent) {
            const matches = scriptContent.match(/(https?:\/\/[^\s'"]+\.json|\/api\/[^\s'"]+)/gi);
            if (matches) {
                matches.forEach(match => apiLinks.push(match));
            }
        }
    });

    if (apiLinks.length > 0) {
        console.log('API/JSON encontrados:', [...new Set(apiLinks)]);
    } else {
        console.log('No se encontraron referencias a APIs');
    }

    // Extraer título de la página
    console.log('\n📄 Información de la página:');
    console.log('Título:', $('title').text());
    console.log('H1:', $('h1').text());

    // Verificar si la página requiere JavaScript
    const bodyContent = $('body').text().toLowerCase();
    if (bodyContent.includes('javascript') && bodyContent.includes('habilit')) {
        console.log('⚠️  La página puede requerir JavaScript habilitado');
    }
}

analyzeHistoricalHTML().catch(console.error);
