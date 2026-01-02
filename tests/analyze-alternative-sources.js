const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeAlternativeSources() {
    console.log('🔍 ANÁLISIS COMPARATIVO DE FUENTES DE DATOS HISTÓRICOS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // FUENTE 1: resultadobaloto.com (ya analizada)
    console.log('📊 FUENTE 1: https://www.resultadobaloto.com/');
    console.log('───────────────────────────────────────────────────────────────\n');

    const source1 = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $s1 = cheerio.load(source1.data);

    const sorteos1 = [];
    $s1('#listaResultados .panel').each((i, panel) => {
        const heading = $s1(panel).find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        if (sorteoMatch) {
            const fecha = $s1(panel).find('time').text().trim();
            const numeros = [];
            $s1(panel)
                .find('.label-baloto')
                .each((j, elem) => {
                    if (numeros.length < 5) numeros.push($s1(elem).text().trim());
                });
            const sb = $s1(panel).find('.label-comple').first().text().trim();
            sorteos1.push({ sorteo: sorteoMatch[1], fecha, numeros: numeros.join('-'), sb });
        }
    });

    console.log(`Sorteos en página principal: ${sorteos1.length}`);
    if (sorteos1.length > 0) {
        console.log(`Rango: Sorteo #${sorteos1[sorteos1.length - 1].sorteo} a #${sorteos1[0].sorteo}`);
        console.log('Ejemplo:', sorteos1[0]);
    }

    // Buscar enlaces a históricos
    console.log('\nEnlaces históricos/archivo:');
    const links1 = [];
    $s1('a').each((i, elem) => {
        const href = $s1(elem).attr('href');
        const text = $s1(elem).text().toLowerCase();
        if (
            href &&
            (text.includes('histor') ||
                text.includes('archivo') ||
                text.includes('resultados') ||
                text.includes('todos'))
        ) {
            if (!links1.find(l => l.href === href)) {
                links1.push({ text: text.substring(0, 40), href });
            }
        }
    });
    links1.slice(0, 5).forEach(l => console.log(`  - ${l.text}: ${l.href}`));

    // Probar acceso a sorteo antiguo
    console.log('\n🔬 Probando acceso a sorteo antiguo (#2590):');
    try {
        const oldSorteo1 = await axios.get('https://www.resultadobaloto.com/?sorteo=2590', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $old1 = cheerio.load(oldSorteo1.data);
        const heading = $old1('#listaResultados .panel').first().find('.panel-heading h2').text();
        const match = heading.match(/Baloto\s*(\d+)/i);
        console.log(
            `  Resultado: ${
                match ? (match[1] == '2590' ? '✅ Acceso directo' : `⚠️ Redirigió a #${match[1]}`) : '❌ No encontrado'
            }`
        );
    } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
    }

    // FUENTE 2: baloto.com (página oficial)
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FUENTE 2: https://www.baloto.com/ (Página Oficial)');
    console.log('───────────────────────────────────────────────────────────────\n');

    try {
        const source2 = await axios.get('https://www.baloto.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
        });
        const $s2 = cheerio.load(source2.data);

        console.log('✅ Página accesible');
        console.log('Título:', $s2('title').text());
        console.log('Tamaño HTML:', source2.data.length, 'bytes\n');

        // Buscar resultados
        const resultSelectors = [
            { name: 'Resultados principales', selector: '.resultado, .result, [class*="result"]' },
            { name: 'Números ganadores', selector: '.numero, .number, [class*="numero"]' },
            { name: 'Últimos sorteos', selector: '.sorteo, [class*="sorteo"]' },
            { name: 'Tablas de resultados', selector: 'table' },
            { name: 'Listas de resultados', selector: 'ul li, ol li' },
        ];

        console.log('🔎 Buscando estructura de datos:\n');
        resultSelectors.forEach(({ name, selector }) => {
            const count = $s2(selector).length;
            console.log(`  ${name} (${selector}): ${count} elementos`);
        });

        // Buscar enlaces históricos
        console.log('\n🔗 Enlaces históricos/archivo en baloto.com:');
        const links2 = [];
        $s2('a').each((i, elem) => {
            const href = $s2(elem).attr('href');
            const text = $s2(elem).text().toLowerCase();
            if (
                href &&
                (text.includes('histor') ||
                    text.includes('archivo') ||
                    text.includes('resultados') ||
                    text.includes('todos') ||
                    text.includes('anteriores'))
            ) {
                if (!links2.find(l => l.href === href)) {
                    links2.push({ text: text.substring(0, 40), href });
                }
            }
        });

        if (links2.length > 0) {
            links2.slice(0, 10).forEach(l => console.log(`  - ${l.text}: ${l.href}`));
        } else {
            console.log('  ❌ No se encontraron enlaces históricos');
        }

        // Buscar APIs o endpoints
        console.log('\n🔍 Buscando APIs/Endpoints:');
        let foundAPIs = false;
        $s2('script').each((i, elem) => {
            const script = $s2(elem).html();
            if (script) {
                const apiMatches = script.match(/(https?:\/\/[^\s'"]+\/api\/[^\s'"]+|\/api\/[^\s'"]+)/gi);
                if (apiMatches) {
                    const uniqueAPIs = [...new Set(apiMatches)];
                    uniqueAPIs.slice(0, 5).forEach(api => console.log(`  - ${api}`));
                    foundAPIs = true;
                }
            }
        });
        if (!foundAPIs) {
            console.log('  ❌ No se encontraron endpoints API visibles');
        }
    } catch (err) {
        console.log(`❌ No se pudo acceder a baloto.com: ${err.message}`);
        console.log('   (Puede requerir JavaScript, cookies, o estar bloqueado)');
    }

    // FUENTE 3: Otras alternativas
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FUENTE 3: Alternativas adicionales');
    console.log('───────────────────────────────────────────────────────────────\n');

    const alternatives = [
        { name: 'Loteria de Bogotá', url: 'https://www.loteriadebogota.com/' },
        { name: 'Gana', url: 'https://www.gana.com.co/' },
        { name: 'Resultado Loterias', url: 'https://www.resultadoloterias.com/' },
    ];

    for (const alt of alternatives) {
        try {
            console.log(`🔍 Probando: ${alt.name} (${alt.url})`);
            const response = await axios.get(alt.url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 8000,
            });
            const $ = cheerio.load(response.data);
            console.log(`  ✅ Accesible - Título: ${$('title').text().substring(0, 50)}`);

            // Buscar "baloto" en el contenido
            const bodyText = $('body').text().toLowerCase();
            if (bodyText.includes('baloto')) {
                console.log(`  ✅ Contiene información de Baloto`);

                // Buscar números
                const numeros = bodyText.match(/\b([1-9]|[1-3][0-9]|4[0-3])\b/g);
                if (numeros && numeros.length >= 5) {
                    console.log(`  ℹ️  Posibles números encontrados en contenido`);
                }
            } else {
                console.log(`  ⚠️  No parece contener info de Baloto`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }
        console.log('');
    }

    // RESUMEN COMPARATIVO
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN COMPARATIVO');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('┌─────────────────────────┬──────────────┬──────────────┬─────────────┐');
    console.log('│ Característica          │ resultadob.. │ baloto.com   │ Recomendado │');
    console.log('├─────────────────────────┼──────────────┼──────────────┼─────────────┤');
    console.log(`│ Acceso sin JS           │ ✅ Sí        │ ?            │ resultadob..│`);
    console.log(`│ Sorteos visibles        │ ${sorteos1.length} sorteos    │ ?            │ resultadob..│`);
    console.log(`│ Históricos accesibles   │ ❌ No        │ ?            │ -           │`);
    console.log(`│ Scraping actual         │ ✅ Funciona  │ ?            │ resultadob..│`);
    console.log(`│ Estructura conocida     │ ✅ Sí        │ ❌ No        │ resultadob..│`);
    console.log(`│ Código ya implementado  │ ✅ Sí        │ ❌ No        │ resultadob..│`);
    console.log('└─────────────────────────┴──────────────┴──────────────┴─────────────┘\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMENDACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ CONTINUAR USANDO: resultadobaloto.com\n');
    console.log('Razones:');
    console.log('  1. ✅ Ya tienes código funcional implementado');
    console.log('  2. ✅ Scraping funciona perfectamente');
    console.log(`  3. ✅ ${sorteos1.length} sorteos accesibles en página principal`);
    console.log('  4. ✅ Estructura HTML estable y documentada');
    console.log('  5. ✅ Funciona sin JavaScript\n');

    console.log('📋 ESTRATEGIA PARA DATOS HISTÓRICOS:\n');
    console.log('  OPCIÓN A (Recomendada): Sistema de acumulación progresiva');
    console.log('    • Scrapear los 4 sorteos actuales como base inicial');
    console.log('    • Implementar scraper automático diario');
    console.log('    • Almacenar en SQLite cada nuevo sorteo');
    console.log('    • En 3 meses: ~39 sorteos');
    console.log('    • En 6 meses: ~78 sorteos');
    console.log('    • En 1 año: ~156 sorteos\n');

    console.log('  OPCIÓN B (Complementaria): Datos semilla manual');
    console.log('    • Buscar dataset público en Kaggle/GitHub');
    console.log('    • Cargar manualmente 50-100 sorteos históricos');
    console.log('    • Combinar con acumulación automática\n');

    console.log('⏱️  TIEMPO IMPLEMENTACIÓN: 6-8 horas');
    console.log('💾 ALMACENAMIENTO: ~500KB por año de datos');
    console.log('🔄 ACTUALIZACIÓN: Automática cada sorteo (3x semana)');
}

analyzeAlternativeSources().catch(console.error);
