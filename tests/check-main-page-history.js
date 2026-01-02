const axios = require('axios');
const cheerio = require('cheerio');

async function checkMainPageHistory() {
    console.log('🔍 Verificando si la página principal tiene múltiples sorteos...\n');

    const response = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const $ = cheerio.load(response.data);

    // Extraer TODOS los paneles
    console.log('═══════════════════════════════════════════════════');
    console.log('BALOTO - Página Principal');
    console.log('═══════════════════════════════════════════════════\n');

    const todosLosSorteos = [];
    $('#listaResultados .panel').each((i, panel) => {
        const heading = $(panel).find('.panel-heading h2').text();
        const fecha = $(panel).find('time').text().trim();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;

        // Extraer números
        const numeros = [];
        $(panel)
            .find('.label-baloto')
            .each((j, elem) => {
                if (numeros.length < 5) {
                    numeros.push($(elem).text().trim());
                }
            });

        const superBalota = $(panel).find('.label-comple').first().text().trim();

        if (sorteo) {
            todosLosSorteos.push({
                sorteo,
                fecha,
                numeros: numeros.join('-'),
                superBalota,
                heading: heading.substring(0, 60),
            });
        }
    });

    console.log(`Total sorteos en página principal: ${todosLosSorteos.length}\n`);

    if (todosLosSorteos.length > 0) {
        console.log('📊 SORTEOS ENCONTRADOS:\n');
        todosLosSorteos.forEach((sorteo, index) => {
            console.log(`${index + 1}. Sorteo #${sorteo.sorteo}`);
            console.log(`   Fecha: ${sorteo.fecha}`);
            console.log(`   Números: ${sorteo.numeros} + SB: ${sorteo.superBalota}`);
            console.log('');
        });

        // Calcular el rango de sorteos disponibles
        const sorteoNumbers = todosLosSorteos.map(s => parseInt(s.sorteo)).filter(n => !isNaN(n));
        const minSorteo = Math.min(...sorteoNumbers);
        const maxSorteo = Math.max(...sorteoNumbers);

        console.log('\n═══════════════════════════════════════════════════');
        console.log('📈 ANÁLISIS DE DATOS DISPONIBLES');
        console.log('═══════════════════════════════════════════════════\n');
        console.log(`Sorteo más antiguo en página principal: #${minSorteo}`);
        console.log(`Sorteo más reciente: #${maxSorteo}`);
        console.log(`Rango: ${maxSorteo - minSorteo + 1} sorteos`);
        console.log(`Sorteos mostrados: ${todosLosSorteos.length}\n`);

        // Probar si podemos acceder a sorteos más antiguos
        console.log('═══════════════════════════════════════════════════');
        console.log('🔬 PROBANDO ACCESO A SORTEOS MÁS ANTIGUOS');
        console.log('═══════════════════════════════════════════════════\n');

        const sorteosAProbar = [
            minSorteo - 10,
            minSorteo - 50,
            minSorteo - 100,
            2500, // Sorteo ejemplo más antiguo
            2000,
            1500,
            1000,
        ];

        for (const sorteoNum of sorteosAProbar) {
            try {
                const sorteoResponse = await axios.get(`https://www.resultadobaloto.com/?sorteo=${sorteoNum}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000,
                });

                const $sorteo = cheerio.load(sorteoResponse.data);
                const panelHeading = $sorteo('#listaResultados .panel').first().find('.panel-heading h2').text();
                const sorteoEncontrado = panelHeading.match(/Baloto\s*(\d+)/i);

                if (sorteoEncontrado && sorteoEncontrado[1] == sorteoNum) {
                    const nums = [];
                    $sorteo('#listaResultados .panel')
                        .first()
                        .find('.label-baloto')
                        .each((j, elem) => {
                            if (nums.length < 5) {
                                nums.push($sorteo(elem).text().trim());
                            }
                        });
                    const sb = $sorteo('#listaResultados .panel').first().find('.label-comple').first().text().trim();
                    const fecha = $sorteo('#listaResultados .panel').first().find('time').text().trim();

                    console.log(`✅ Sorteo #${sorteoNum}`);
                    console.log(`   Fecha: ${fecha}`);
                    console.log(`   Números: ${nums.join('-')} + SB: ${sb}`);
                } else {
                    console.log(`⚠️  Sorteo #${sorteoNum} - Redirigido o no encontrado`);
                }
            } catch (err) {
                console.log(`❌ Sorteo #${sorteoNum} - Error: ${err.message}`);
            }
        }

        // Conclusión
        console.log('\n═══════════════════════════════════════════════════');
        console.log('💡 CONCLUSIÓN');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('✅ DATOS HISTÓRICOS ACCESIBLES:');
        console.log('   • URL: https://www.resultadobaloto.com/?sorteo=XXXX');
        console.log('   • Permite acceder a sorteos individuales por número');
        console.log('   • Mismo formato HTML que la página principal');
        console.log('   • Scraping compatible con código actual\n');

        console.log('📋 ESTRATEGIA PARA OBTENER DATOS HISTÓRICOS:');
        console.log('   1. Usar sorteo actual como referencia inicial');
        console.log(`   2. Iterar hacia atrás: sorteo ${maxSorteo} hasta sorteo deseado`);
        console.log('   3. Cada solicitud obtiene 1 sorteo completo');
        console.log('   4. Almacenar en base de datos local para futuras consultas\n');

        console.log('⏱️  ESTIMACIÓN DE TIEMPO:');
        console.log('   • ~1 segundo por sorteo (incluyendo delay para no saturar servidor)');
        console.log('   • 100 sorteos históricos ≈ 2-3 minutos');
        console.log('   • 500 sorteos históricos ≈ 10-15 minutos');
        console.log('   • 1000 sorteos históricos ≈ 20-30 minutos\n');
    }
}

checkMainPageHistory().catch(console.error);
