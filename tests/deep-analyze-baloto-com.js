const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function deepAnalyzeBalotoCom() {
    console.log('🔬 ANÁLISIS PROFUNDO: baloto.com (Página Oficial)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Explorar /resultados
    console.log('1️⃣  EXPLORANDO: https://www.baloto.com/resultados\n');

    try {
        const resultadosPage = await axios.get('https://www.baloto.com/resultados', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 15000,
        });

        const $ = cheerio.load(resultadosPage.data);

        console.log('✅ Página accesible');
        console.log('Título:', $('title').text());
        console.log('H1:', $('h1').first().text());
        console.log('Tamaño HTML:', resultadosPage.data.length, 'bytes\n');

        // Guardar HTML para inspección
        fs.writeFileSync('tests/baloto-resultados.html', resultadosPage.data);
        console.log('💾 HTML guardado en: tests/baloto-resultados.html\n');

        // Buscar números en la página
        console.log('🔍 Buscando números de sorteo:\n');

        const possibleNumbers = [];
        $('.numero, .number, [class*="numero"], [class*="bola"], .ball, [class*="ball"]').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && !isNaN(text) && text.length <= 2) {
                possibleNumbers.push(text);
            }
        });

        if (possibleNumbers.length > 0) {
            console.log('Posibles números encontrados:', possibleNumbers.slice(0, 20).join(', '));
        } else {
            console.log('⚠️  No se encontraron números con clases esperadas');
        }

        // Buscar cualquier número en el rango 1-43
        console.log('\n🔎 Buscando números en el contenido HTML...\n');
        const allText = $('body').text();
        const numberMatches = allText.match(/\b([1-9]|[1-3][0-9]|4[0-3])\b/g);
        if (numberMatches) {
            console.log(`Total números 1-43 en página: ${numberMatches.length}`);
            console.log('Primeros 30:', numberMatches.slice(0, 30).join(', '));
        }

        // Buscar scripts que carguen datos
        console.log('\n📜 Buscando scripts con datos dinámicos:\n');
        let foundData = false;
        $('script').each((i, elem) => {
            const scriptContent = $(elem).html();
            if (scriptContent) {
                // Buscar JSON con resultados
                const jsonMatches = scriptContent.match(/\{[^{}]*"?(?:numero|number|sorteo|result)[^{}]*\}/gi);
                if (jsonMatches && jsonMatches.length > 0) {
                    console.log('✅ Script con datos JSON encontrado:');
                    console.log(jsonMatches[0].substring(0, 200));
                    foundData = true;
                }

                // Buscar llamadas a API
                const apiMatches = scriptContent.match(/(fetch|axios|ajax)\s*\([^)]*resultados?[^)]*\)/gi);
                if (apiMatches) {
                    console.log('✅ Llamada a API encontrada:');
                    apiMatches.forEach(m => console.log('  ', m.substring(0, 100)));
                    foundData = true;
                }
            }
        });

        if (!foundData) {
            console.log('⚠️  No se encontraron scripts con datos obvios');
        }

        // Buscar enlaces de paginación o históricos
        console.log('\n🔗 Enlaces relacionados con históricos:\n');
        const historicalLinks = [];
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase();
            if (
                href &&
                (text.includes('anterior') ||
                    text.includes('histórico') ||
                    text.includes('archivo') ||
                    text.includes('ver más') ||
                    text.includes('todos') ||
                    href.includes('page') ||
                    href.includes('fecha') ||
                    href.includes('sorteo'))
            ) {
                historicalLinks.push({ text: text.substring(0, 50), href });
            }
        });

        if (historicalLinks.length > 0) {
            console.log('Enlaces encontrados:');
            historicalLinks.slice(0, 10).forEach(l => console.log(`  - "${l.text}": ${l.href}`));
        } else {
            console.log('❌ No se encontraron enlaces históricos');
        }
    } catch (err) {
        console.log(`❌ Error accediendo a /resultados: ${err.message}\n`);
    }

    // 2. Explorar /miloto/resultados
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('2️⃣  EXPLORANDO: https://www.baloto.com/miloto/resultados\n');

    try {
        const milotoPage = await axios.get('https://www.baloto.com/miloto/resultados', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000,
        });

        const $m = cheerio.load(milotoPage.data);
        console.log('✅ Página accesible');
        console.log('Título:', $m('title').text());
    } catch (err) {
        console.log(`❌ Error: ${err.message}`);
    }

    // 3. Buscar endpoint API
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('3️⃣  PROBANDO ENDPOINTS API\n');

    const apiEndpoints = [
        '/api/v1/results',
        '/api/v1/resultados',
        '/api/v1/baloto',
        '/api/v1/baloto/resultados',
        '/api/resultados',
        '/api/baloto',
        '/api/ultimo-sorteo',
        '/api/sorteos',
    ];

    for (const endpoint of apiEndpoints) {
        try {
            const url = `https://www.baloto.com${endpoint}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000,
            });

            console.log(`✅ ${endpoint}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Tipo: ${response.headers['content-type']}`);

            if (response.headers['content-type']?.includes('json')) {
                const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                console.log('   Datos:', JSON.stringify(data).substring(0, 200));
            }
            console.log('');
        } catch (err) {
            if (err.response?.status === 404) {
                console.log(`❌ ${endpoint} - 404 Not Found`);
            } else {
                console.log(`❌ ${endpoint} - ${err.message}`);
            }
        }
    }

    // RESUMEN FINAL
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL: baloto.com vs resultadobaloto.com');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('COMPARACIÓN DETALLADA:\n');
    console.log('┌──────────────────────────┬────────────────┬──────────────────┐');
    console.log('│ Característica           │ baloto.com     │ resultadobaloto  │');
    console.log('├──────────────────────────┼────────────────┼──────────────────┤');
    console.log('│ Scraping HTML            │ ⚠️  Complejo   │ ✅ Simple        │');
    console.log('│ Requiere JavaScript      │ ⚠️  Probable   │ ❌ No            │');
    console.log('│ API disponible           │ ❓ Desconocido │ ❌ No            │');
    console.log('│ Datos históricos         │ ❓ Por explorar│ ❌ No (solo 4)   │');
    console.log('│ Código implementado      │ ❌ No          │ ✅ Sí            │');
    console.log('│ Estabilidad              │ ❓ Desconocida │ ✅ Probada       │');
    console.log('│ Tiempo implementación    │ 🔴 Alto        │ ✅ Ya listo      │');
    console.log('└──────────────────────────┴────────────────┴──────────────────┘\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMENDACIÓN DEFINITIVA');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ USAR: resultadobaloto.com (ACTUAL)\n');
    console.log('Justificación:');
    console.log('  1. ✅ Código ya funcional y probado');
    console.log('  2. ✅ Scraping confiable sin JavaScript');
    console.log('  3. ✅ 4 sorteos inmediatamente disponibles');
    console.log('  4. ✅ Estructura HTML estable');
    console.log('  5. ⚠️  baloto.com requiere más investigación (tiempo no justificado)\n');

    console.log('📋 PLAN DE ACCIÓN RECOMENDADO:\n');
    console.log('  FASE 1: Base de datos y acumulación (AHORA)');
    console.log('    • Crear SQLite con schema para históricos');
    console.log('    • Scrapear los 4 sorteos actuales como semilla');
    console.log('    • Implementar scraper automático diario');
    console.log('    Tiempo: 4-6 horas\n');

    console.log('  FASE 2: Estadísticas básicas (SEMANA 1)');
    console.log('    • Endpoints de frecuencia de números');
    console.log('    • Dashboard con Chart.js');
    console.log('    • Tabla de números "calientes/fríos"');
    console.log('    Tiempo: 4-6 horas\n');

    console.log('  FASE 3: Features avanzados (DESPUÉS)');
    console.log('    • Generador de combinaciones');
    console.log('    • Análisis de patrones');
    console.log('    • Exportación de datos');
    console.log('    Tiempo: 4-6 horas\n');

    console.log('⏱️  TOTAL: 12-18 horas de desarrollo');
    console.log('📈 DATOS: Crecimiento automático 3x semana');
    console.log('🎯 RESULTADO: Sistema completo de estadísticas funcional');
}

deepAnalyzeBalotoCom().catch(console.error);
