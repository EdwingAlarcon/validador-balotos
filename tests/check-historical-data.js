const axios = require('axios');
const cheerio = require('cheerio');

async function checkHistoricalData() {
    console.log('🔍 Investigando disponibilidad de datos históricos...\n');

    // Verificar página principal de Baloto
    console.log('1️⃣ Verificando página principal de Baloto...');
    const balotoMain = await axios.get('https://www.resultadobaloto.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const $main = cheerio.load(balotoMain.data);

    // Buscar enlaces a resultados históricos o archivos
    const historicalLinks = [];
    $main('a').each((i, elem) => {
        const href = $main(elem).attr('href');
        const text = $main(elem).text().toLowerCase();
        if (
            href &&
            (text.includes('histor') ||
                text.includes('archivo') ||
                text.includes('resultados anteriores') ||
                href.includes('histor') ||
                href.includes('archivo'))
        ) {
            historicalLinks.push({ text, href });
        }
    });

    console.log('Enlaces históricos encontrados:', historicalLinks.length);
    if (historicalLinks.length > 0) {
        console.log(historicalLinks);
    }

    // Verificar cuántos paneles de resultados hay en la página principal
    console.log('\n2️⃣ Cantidad de resultados en página principal:');
    console.log('Baloto - Paneles:', $main('#listaResultados .panel').length);

    // Verificar si hay paginación
    const pagination = [];
    $main('a, button, .pagination, .pager, [class*="page"]').each((i, elem) => {
        const text = $main(elem).text().toLowerCase();
        const classes = $main(elem).attr('class') || '';
        if (
            text.includes('siguiente') ||
            text.includes('anterior') ||
            text.includes('más') ||
            classes.includes('pag')
        ) {
            pagination.push({ text, classes, href: $main(elem).attr('href') });
        }
    });
    console.log('Paginación encontrada:', pagination.length);
    if (pagination.length > 0) {
        console.log(pagination.slice(0, 5)); // Mostrar solo los primeros 5
    }

    // Verificar Miloto
    console.log('\n3️⃣ Verificando Miloto...');
    const miloto = await axios.get('https://www.resultadobaloto.com/miloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $miloto = cheerio.load(miloto.data);
    console.log('Miloto - Paneles:', $miloto('#listaResultados .panel').length);

    // Verificar Colorloto
    console.log('\n4️⃣ Verificando Colorloto...');
    const colorloto = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $colorloto = cheerio.load(colorloto.data);
    console.log('Colorloto - Paneles:', $colorloto('#listaResultados .panel').length);

    // Buscar estructura de URLs con fechas o IDs
    console.log('\n5️⃣ Probando URLs con parámetros...');
    const testUrls = [
        'https://www.resultadobaloto.com/?page=2',
        'https://www.resultadobaloto.com/resultados.php',
        'https://www.resultadobaloto.com/archivo.php',
        'https://www.resultadobaloto.com/historico.php',
    ];

    for (const url of testUrls) {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000,
                maxRedirects: 0,
            });
            console.log('✅', url, '- Status:', response.status);
        } catch (err) {
            console.log('❌', url, '- Error:', err.response?.status || err.code);
        }
    }

    // Extraer todos los sorteos visibles en la página principal
    console.log('\n6️⃣ Analizando sorteos en página principal...');
    const sorteos = [];
    $main('#listaResultados .panel').each((i, panel) => {
        const heading = $main(panel).find('.panel-heading h2').text();
        const fecha = $main(panel).find('time').text().trim();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;

        if (sorteo) {
            sorteos.push({ sorteo, fecha, heading: heading.substring(0, 50) });
        }
    });

    console.log('Total sorteos encontrados:', sorteos.length);
    if (sorteos.length > 0) {
        console.log('Primer sorteo:', sorteos[0]);
        console.log('Último sorteo:', sorteos[sorteos.length - 1]);

        if (sorteos.length > 2) {
            console.log('Algunos sorteos intermedios:');
            sorteos.slice(1, Math.min(4, sorteos.length)).forEach(s => console.log(' -', s));
        }
    }

    // Verificar si se puede acceder a sorteos específicos por número
    console.log('\n7️⃣ Probando acceso a sorteos específicos...');
    if (sorteos.length > 0) {
        const ultimoSorteo = parseInt(sorteos[0].sorteo);
        const testSorteoUrls = [
            `https://www.resultadobaloto.com/?sorteo=${ultimoSorteo}`,
            `https://www.resultadobaloto.com/baloto.php?sorteo=${ultimoSorteo}`,
            `https://www.resultadobaloto.com/resultado/${ultimoSorteo}`,
        ];

        for (const url of testSorteoUrls) {
            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000,
                    maxRedirects: 0,
                });
                console.log('✅', url, '- Status:', response.status);
            } catch (err) {
                console.log('❌', url, '- Error:', err.response?.status || err.code);
            }
        }
    }
}

checkHistoricalData().catch(console.error);
