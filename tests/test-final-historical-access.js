const axios = require('axios');
const cheerio = require('cheerio');

async function testFinalHistoricalAccess() {
    console.log('🎯 PRUEBA FINAL: Acceso a datos históricos\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Obtener sorteo actual
    const mainPage = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(mainPage.data);

    const currentSorteoMatch = $('#listaResultados .panel')
        .first()
        .find('.panel-heading h2')
        .text()
        .match(/Baloto\s*(\d+)/i);
    const currentSorteo = currentSorteoMatch ? parseInt(currentSorteoMatch[1]) : 2599;

    console.log(`✅ Sorteo actual detectado: #${currentSorteo}\n`);

    // Probar acceso a últimos 20 sorteos (hacia atrás)
    console.log('🔍 Probando acceso a últimos 20 sorteos...\n');

    const results = [];

    for (let i = 0; i < 20; i++) {
        const sorteoNum = currentSorteo - i;

        try {
            const response = await axios.get(`https://www.resultadobaloto.com/?sorteo=${sorteoNum}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000,
            });

            const $page = cheerio.load(response.data);
            const heading = $page('#listaResultados .panel').first().find('.panel-heading h2').text();
            const sorteoEncontrado = heading.match(/Baloto\s*(\d+)/i);

            if (sorteoEncontrado) {
                const numeros = [];
                $page('#listaResultados .panel')
                    .first()
                    .find('.label-baloto')
                    .each((j, elem) => {
                        if (numeros.length < 5) {
                            numeros.push($page(elem).text().trim());
                        }
                    });
                const sb = $page('#listaResultados .panel').first().find('.label-comple').first().text().trim();
                const fecha = $page('#listaResultados .panel').first().find('time').text().trim();

                const success = sorteoEncontrado[1] == sorteoNum;
                results.push({
                    solicitado: sorteoNum,
                    recibido: sorteoEncontrado[1],
                    exito: success,
                    fecha,
                    numeros: numeros.join('-'),
                    superBalota: sb,
                });

                if (success) {
                    console.log(`✅ Sorteo #${sorteoNum} - ${numeros.join('-')} + SB:${sb}`);
                } else {
                    console.log(`⚠️  Sorteo #${sorteoNum} - Redirigió a #${sorteoEncontrado[1]}`);
                }
            } else {
                console.log(`❌ Sorteo #${sorteoNum} - No encontrado`);
                results.push({ solicitado: sorteoNum, exito: false });
            }

            // Delay para no saturar el servidor
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.log(`❌ Sorteo #${sorteoNum} - Error: ${err.message}`);
            results.push({ solicitado: sorteoNum, exito: false, error: err.message });
        }
    }

    // Resumen
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('═══════════════════════════════════════════════════\n');

    const exitosos = results.filter(r => r.exito).length;
    const fallidos = results.filter(r => !r.exito).length;

    console.log(`Total intentos: ${results.length}`);
    console.log(`✅ Exitosos: ${exitosos} (${((exitosos / results.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Fallidos: ${fallidos} (${((fallidos / results.length) * 100).toFixed(1)}%)\n`);

    if (exitosos > 0) {
        const sorteosAccesibles = results.filter(r => r.exito).map(r => parseInt(r.solicitado));
        const minAccesible = Math.min(...sorteosAccesibles);
        const maxAccesible = Math.max(...sorteosAccesibles);

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ CONCLUSIÓN FINAL');
        console.log('═══════════════════════════════════════════════════\n');

        console.log(`SÍ es posible obtener datos históricos`);
        console.log(`Rango accesible probado: #${minAccesible} a #${maxAccesible}`);
        console.log(`Total sorteos en rango: ${maxAccesible - minAccesible + 1}\n`);

        console.log('📋 ESTRATEGIA RECOMENDADA PARA MÓDULO DE ESTADÍSTICAS:\n');
        console.log('1️⃣  Crear endpoint /api/scrape-historical');
        console.log('    • Parámetros: sorteoInicial, cantidad');
        console.log('    • Itera hacia atrás obteniendo cada sorteo');
        console.log('    • Delay de 500-1000ms entre solicitudes\n');

        console.log('2️⃣  Almacenar en SQLite/JSON:');
        console.log('    • Tabla: historical_results');
        console.log('    • Campos: sorteo, fecha, numeros, superBalota, juego');
        console.log('    • Índice por sorteo y fecha\n');

        console.log('3️⃣  Endpoints de estadísticas:');
        console.log('    • /api/stats/frequency - Frecuencia de números');
        console.log('    • /api/stats/hot-cold - Números calientes/fríos');
        console.log('    • /api/stats/pairs - Pares frecuentes');
        console.log('    • /api/stats/super-balota - Análisis súper balota\n');

        console.log('4️⃣  Dashboard en frontend:');
        console.log('    • Gráficos con Chart.js');
        console.log('    • Tabla de frecuencias');
        console.log('    • Heatmap de números');
        console.log('    • Timeline de resultados\n');

        console.log('⏱️  TIEMPO ESTIMADO IMPLEMENTACIÓN: 8-12 horas');
        console.log('💾 ESPACIO REQUERIDO: ~1MB por 1000 sorteos');
    } else {
        console.log('❌ No fue posible acceder a datos históricos de forma confiable');
        console.log('   Alternativa: Almacenar datos desde ahora en adelante');
    }
}

testFinalHistoricalAccess().catch(console.error);
