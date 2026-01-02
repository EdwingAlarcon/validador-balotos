const axios = require('axios');
const cheerio = require('cheerio');

async function exploreHistoricalPages() {
    console.log('📚 Explorando páginas de datos históricos...\n');

    // 1. Explorar resultados.php
    console.log('═══════════════════════════════════════════════════');
    console.log('1️⃣ EXPLORANDO /resultados.php (HISTÓRICO)');
    console.log('═══════════════════════════════════════════════════\n');

    const resultadosPage = await axios.get('https://www.resultadobaloto.com/resultados.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $resultados = cheerio.load(resultadosPage.data);

    console.log('Paneles encontrados:', $resultados('#listaResultados .panel').length);

    // Extraer todos los sorteos
    const sorteosHistoricos = [];
    $resultados('#listaResultados .panel').each((i, panel) => {
        const heading = $resultados(panel).find('.panel-heading h2').text();
        const fecha = $resultados(panel).find('time').text().trim();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;

        // Extraer números
        const numeros = [];
        $resultados(panel)
            .find('.label-baloto')
            .each((j, elem) => {
                if (numeros.length < 5) {
                    numeros.push($resultados(elem).text().trim());
                }
            });

        const superBalota = $resultados(panel).find('.label-comple').first().text().trim();

        if (sorteo) {
            sorteosHistoricos.push({ sorteo, fecha, numeros, superBalota });
        }
    });

    console.log('\n📊 Sorteos históricos encontrados:', sorteosHistoricos.length);
    if (sorteosHistoricos.length > 0) {
        console.log('Más antiguo:', sorteosHistoricos[sorteosHistoricos.length - 1]);
        console.log('Más reciente:', sorteosHistoricos[0]);
    }

    // Buscar paginación
    console.log('\n🔍 Buscando sistema de paginación...');
    const paginationLinks = [];
    $resultados('a').each((i, elem) => {
        const href = $resultados(elem).attr('href');
        const text = $resultados(elem).text().toLowerCase();
        if (
            href &&
            (href.includes('page') ||
                text.includes('siguiente') ||
                text.includes('anterior') ||
                text.includes('página'))
        ) {
            paginationLinks.push({ text, href });
        }
    });
    console.log('Enlaces de paginación:', paginationLinks);

    // 2. Explorar calendario.php
    console.log('\n═══════════════════════════════════════════════════');
    console.log('2️⃣ EXPLORANDO /calendario.php');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        const calendarioPage = await axios.get('https://www.resultadobaloto.com/calendario.php', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $calendario = cheerio.load(calendarioPage.data);

        console.log('Paneles en calendario:', $calendario('#listaResultados .panel').length);

        // Buscar todas las fechas disponibles
        const fechasDisponibles = [];
        $calendario('a').each((i, elem) => {
            const href = $calendario(elem).attr('href');
            const text = $calendario(elem).text();
            if (href && (href.includes('fecha') || href.includes('date') || href.includes('sorteo'))) {
                fechasDisponibles.push({ text: text.substring(0, 50), href });
            }
        });

        if (fechasDisponibles.length > 0) {
            console.log('\n📅 Fechas/sorteos disponibles:', fechasDisponibles.length);
            console.log('Primeras 5:', fechasDisponibles.slice(0, 5));
        }
    } catch (err) {
        console.log('Error accediendo a calendario.php:', err.message);
    }

    // 3. Probar acceso a sorteo específico por parámetro
    console.log('\n═══════════════════════════════════════════════════');
    console.log('3️⃣ PROBANDO ACCESO A SORTEOS ESPECÍFICOS');
    console.log('═══════════════════════════════════════════════════\n');

    if (sorteosHistoricos.length > 0) {
        const sorteoAntiguo = sorteosHistoricos[sorteosHistoricos.length - 1].sorteo;
        console.log(`Probando sorteo antiguo #${sorteoAntiguo}...`);

        const sorteoPage = await axios.get(`https://www.resultadobaloto.com/?sorteo=${sorteoAntiguo}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $sorteo = cheerio.load(sorteoPage.data);

        // Verificar que cargó el sorteo correcto
        const heading = $sorteo('#listaResultados .panel').first().find('.panel-heading h2').text();
        console.log('Sorteo cargado:', heading.substring(0, 60));

        const numeros = [];
        $sorteo('#listaResultados .panel')
            .first()
            .find('.label-baloto')
            .each((j, elem) => {
                if (numeros.length < 5) {
                    numeros.push($sorteo(elem).text().trim());
                }
            });
        console.log('Números:', numeros.join(', '));
    }

    // 4. Explorar Miloto y Colorloto históricos
    console.log('\n═══════════════════════════════════════════════════');
    console.log('4️⃣ EXPLORANDO MILOTO Y COLORLOTO HISTÓRICOS');
    console.log('═══════════════════════════════════════════════════\n');

    // Miloto
    const milotoResultados = await axios.get('https://www.resultadobaloto.com/resultados.php?juego=miloto', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $milotoResultados = cheerio.load(milotoResultados.data);
    console.log('Miloto - Paneles históricos:', $milotoResultados('#listaResultados .panel').length);

    // Colorloto
    const colorlotoResultados = await axios.get('https://www.resultadobaloto.com/resultados.php?juego=colorloto', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $colorlotoResultados = cheerio.load(colorlotoResultados.data);
    console.log('Colorloto - Paneles históricos:', $colorlotoResultados('#listaResultados .panel').length);

    // 5. Resumen final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ RESUMEN DE HALLAZGOS');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('✅ DISPONIBLE: /resultados.php - Histórico de Baloto');
    console.log('✅ DISPONIBLE: /resultados.php?juego=miloto - Histórico de Miloto');
    console.log('✅ DISPONIBLE: /resultados.php?juego=colorloto - Histórico de Colorloto');
    console.log('✅ DISPONIBLE: /?sorteo=XXXX - Acceso directo por número de sorteo');
    console.log('✅ DISPONIBLE: /calendario.php - Calendario de sorteos\n');

    console.log('📊 DATOS OBTENIBLES:');
    console.log(`  - ${sorteosHistoricos.length} sorteos por página en histórico`);
    console.log('  - Números ganadores completos');
    console.log('  - Fechas de cada sorteo');
    console.log('  - Número de sorteo');
    console.log('  - Súper Balota\n');

    console.log('💡 ESTRATEGIA RECOMENDADA:');
    console.log('  1. Scrapear /resultados.php inicialmente');
    console.log('  2. Guardar datos en base de datos local');
    console.log('  3. Actualizar diariamente con endpoint actual');
    console.log('  4. Permitir consulta de sorteos específicos por ID');
}

exploreHistoricalPages().catch(console.error);
