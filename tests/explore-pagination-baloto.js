const axios = require('axios');
const cheerio = require('cheerio');

async function explorePaginationBalotoCom() {
    console.log('🎯 DESCUBRIMIENTO: baloto.com tiene PAGINACIÓN\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔍 Explorando sistema de paginación en /resultados...\n');

    // Obtener varias páginas
    const pagesToTest = [1, 2, 3, 10, 50, 104];
    const allSorteos = [];

    for (const pageNum of pagesToTest) {
        try {
            console.log(`📄 Página ${pageNum}:`);

            const url = `https://www.baloto.com/resultados?page=${pageNum}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000,
            });

            const $ = cheerio.load(response.data);

            // Buscar números en la página
            const numeros = [];
            $('.numero, .number, [class*="numero"], [class*="bola"], .ball').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && !isNaN(text) && text.length <= 2) {
                    numeros.push(text);
                }
            });

            // Buscar fechas
            const fechas = [];
            $('time, .fecha, [class*="fecha"], [class*="date"]').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text) {
                    fechas.push(text);
                }
            });

            // Buscar información de sorteo
            const bodyText = $('body').text();
            const sorteoMatches = bodyText.match(/Sorteo\s*#?\s*(\d+)/gi);

            console.log(`  Números encontrados: ${numeros.length}`);
            if (numeros.length > 0) {
                console.log(`  Primeros números: ${numeros.slice(0, 10).join(', ')}`);
            }
            console.log(`  Fechas encontradas: ${fechas.length}`);
            if (fechas.length > 0) {
                console.log(`  Primera fecha: ${fechas[0]}`);
            }
            if (sorteoMatches) {
                console.log(`  Sorteos mencionados: ${sorteoMatches.slice(0, 3).join(', ')}`);
            }

            // Guardar para análisis
            if (pageNum <= 3) {
                allSorteos.push({
                    pagina: pageNum,
                    numeros: numeros.slice(0, 6),
                    fecha: fechas[0],
                    totalNumeros: numeros.length,
                });
            }

            console.log('');

            // Delay para no saturar
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            console.log(`  ❌ Error en página ${pageNum}: ${err.message}\n`);
        }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISIS DETALLADO DE ESTRUCTURA HTML');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Analizar estructura de primera página en detalle
    const page1 = await axios.get('https://www.baloto.com/resultados?page=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(page1.data);

    console.log('🔎 Buscando contenedores de resultados:\n');

    const possibleContainers = [
        '.resultado',
        '.result',
        '.sorteo',
        '[class*="result"]',
        '[class*="sorteo"]',
        'article',
        '.card',
        '[class*="card"]',
        '.row',
        '[id*="result"]',
    ];

    possibleContainers.forEach(selector => {
        const elements = $(selector);
        if (elements.length > 0 && elements.length < 50) {
            // Filtrar contenedores masivos
            console.log(`✅ ${selector}: ${elements.length} elementos`);

            // Analizar primer elemento
            const firstElem = $(elements[0]);
            const html = firstElem.html();
            if (html && html.length < 500) {
                console.log(`   Vista previa: ${html.substring(0, 150)}...`);
            }
        }
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💡 CONCLUSIÓN: baloto.com vs resultadobaloto.com');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('BALOTO.COM (OFICIAL):\n');
    console.log('  ✅ VENTAJAS:');
    console.log('    • Sistema de paginación (104 páginas = cientos de sorteos)');
    console.log('    • Fuente oficial y confiable');
    console.log('    • Potencialmente más datos históricos\n');

    console.log('  ⚠️  DESVENTAJAS:');
    console.log('    • Requiere análisis de estructura HTML compleja');
    console.log('    • Probable carga dinámica con JavaScript');
    console.log('    • Requiere reimplementar todo el scraper');
    console.log('    • Tiempo estimado: 8-12 horas adicionales\n');

    console.log('RESULTADOBALOTO.COM (ACTUAL):\n');
    console.log('  ✅ VENTAJAS:');
    console.log('    • Código ya implementado y funcionando');
    console.log('    • Estructura HTML simple y estable');
    console.log('    • Sin JavaScript requerido');
    console.log('    • 4 sorteos inmediatos disponibles\n');

    console.log('  ⚠️  DESVENTAJAS:');
    console.log('    • Solo 4 sorteos visibles');
    console.log('    • No hay acceso a históricos profundos');
    console.log('    • Requiere acumulación progresiva\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 RECOMENDACIÓN FINAL');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('OPCIÓN 1 (RÁPIDA): Mantener resultadobaloto.com');
    console.log('  ⏱️  Tiempo: 6-8 horas');
    console.log('  📊 Datos iniciales: 4 sorteos');
    console.log('  📈 Crecimiento: 3 sorteos/semana automático');
    console.log('  ✅ Funcional inmediatamente\n');

    console.log('OPCIÓN 2 (ÓPTIMA): Migrar a baloto.com');
    console.log('  ⏱️  Tiempo: 14-20 horas');
    console.log('  📊 Datos iniciales: 100+ sorteos (estimado)');
    console.log('  📈 Crecimiento: 3 sorteos/semana automático');
    console.log('  ⚠️  Requiere investigación adicional\n');

    console.log('OPCIÓN 3 (HÍBRIDA - RECOMENDADA): ');
    console.log('  1. AHORA: Implementar con resultadobaloto.com (6-8h)');
    console.log('     • Sistema funcional de inmediato');
    console.log('     • 4 sorteos iniciales + acumulación');
    console.log('');
    console.log('  2. DESPUÉS: Migrar a baloto.com (8-10h)');
    console.log('     • Cuando tengas tiempo');
    console.log('     • Agregar scraper de históricos profundos');
    console.log('     • Mantener compatibilidad con sistema actual\n');

    console.log('💡 MI RECOMENDACIÓN:');
    console.log('   👉 OPCIÓN 3 (HÍBRIDA)');
    console.log('   Implementa primero con lo que funciona, luego optimiza.\n');
}

explorePaginationBalotoCom().catch(console.error);
