require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const db = require('./services/database');
const { runInitialScraping } = require('./services/initialScraping');
const { getAcumuladosOficiales } = require('./services/acumuladosOficiales');
const {
    generateIntelligentBaloto,
    generateIntelligentMiloto,
    generateIntelligentColorloto,
    getNumberFrequency,
    MIN_SORTEOS_FOR_STATISTICS,
} = require('./services/intelligentGenerator');
const { buildFullReport } = require('./services/reportBuilder');

// ========================================
// CONFIGURACIÓN DE ENTORNO
// ========================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (IS_PRODUCTION ? false : '*');

// ========================================
// CACHÉ TTL EN MEMORIA PARA SCRAPING
// ========================================
const _scraperCache = new Map();
const SCRAPER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCachedHtml(url) {
    const entry = _scraperCache.get(url);
    if (entry && Date.now() < entry.expiresAt) return entry.html;
    _scraperCache.delete(url);
    return null;
}

function setCachedHtml(url, html) {
    _scraperCache.set(url, { html, expiresAt: Date.now() + SCRAPER_CACHE_TTL_MS });
}

// Constantes compartidas para scraping
const SCRAPER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};
const AXIOS_TIMEOUT_MS = 15000;

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos al arrancar el servidor
db.initDatabase();

// ========================================
// RATE LIMITING — endpoints de scraping
// ========================================
const scrapingLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas peticiones, intenta de nuevo más tarde.' },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // CSP desactivado: la app usa scripts inline
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Archivos estáticos: sin caché en dev, caché de 1h en producción
app.use(
    express.static('public', {
        etag: IS_PRODUCTION,
        maxAge: IS_PRODUCTION ? '1h' : 0,
        setHeaders: IS_PRODUCTION
            ? undefined
            : res => {
                  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
              },
    })
);

// ========================================
// HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
    try {
        const totalRecords = db.getTotalResults();
        res.json({
            status: 'ok',
            db: 'connected',
            totalRecords,
            uptime: Math.floor(process.uptime()),
            environment: IS_PRODUCTION ? 'production' : 'development',
        });
    } catch (err) {
        res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

// Endpoint para obtener resultados de Baloto mediante scraping
app.get('/api/baloto', scrapingLimiter, async (req, res) => {
    try {
        const SCRAPER_URL = 'https://www.resultadobaloto.com/';
        let htmlData = getCachedHtml(SCRAPER_URL);
        if (!htmlData) {
            const response = await axios.get(SCRAPER_URL, { headers: SCRAPER_HEADERS, timeout: AXIOS_TIMEOUT_MS });
            htmlData = response.data;
            setCachedHtml(SCRAPER_URL, htmlData);
        }
        const $ = cheerio.load(htmlData);

        // Buscar los 5 números principales del Baloto (1-43)
        const numbers = [];
        const superBalota = [];

        // Buscar en el primer panel de resultados de Baloto
        const firstPanel = $('#listaResultados .panel').first();

        // Números principales (clase label-baloto para números normales)
        firstPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 43) {
                    numbers.push(num);
                }
            }
        });

        // Súper Balota (clase label-comple para el número complementario/súper balota)
        firstPanel.find('.label-comple').each((i, elem) => {
            if (superBalota.length < 1) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 16) {
                    superBalota.push(num);
                }
            }
        });

        // Buscar fecha del sorteo
        let fecha = null;
        const timeElement = firstPanel.find('time');
        if (timeElement.length > 0) {
            fecha = timeElement.text().trim();
        }

        // Buscar número de sorteo
        let sorteo = null;
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        if (sorteoMatch) {
            sorteo = sorteoMatch[1];
        }

        // Extraer acumulado del sitio de resultados (fallback)
        let acumulado = null;
        let acumuladoRevancha = null;
        $('p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\$\s*([\d,\.]+)\s*millones?\s+y\s+\$\s*([\d,\.]+)\s*millones?/i);
            if (match) {
                acumulado = parseFloat(match[1].replace(/,/g, '')) * 1000000;
                acumuladoRevancha = parseFloat(match[2].replace(/,/g, '')) * 1000000;
            }
        });

        // Intentar obtener acumulados del sitio oficial (más actualizado)
        try {
            const acumuladosOficiales = await getAcumuladosOficiales();
            if (acumuladosOficiales) {
                if (acumuladosOficiales.baloto) {
                    acumulado = acumuladosOficiales.baloto * 1000000;
                }
                if (acumuladosOficiales.revancha) {
                    acumuladoRevancha = acumuladosOficiales.revancha * 1000000;
                }
            }
        } catch (error) {
            console.log('No se pudo obtener acumulados oficiales, usando fallback');
        }

        // Extraer premios de la tabla (primera tabla es Baloto)
        const premios = [];
        const prizeTable = $('table.table-bordered').first();
        prizeTable.find('tr').each((i, row) => {
            const cells = [];
            $(row)
                .find('td')
                .each((j, cell) => {
                    cells.push($(cell).text().trim());
                });
            if (cells.length >= 4 && cells[0].includes('Aciertos')) {
                const categoria = cells[0];
                const importePorGanador = cells[3].replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '');
                const premio = parseInt(importePorGanador) || 0;
                premios.push({ categoria, premio });
            }
        });

        if (numbers.length === 5 && superBalota.length === 1) {
            res.json({
                success: true,
                numbers: numbers,
                superBalota: superBalota[0],
                fecha: fecha,
                sorteo: sorteo,
                acumulado: acumulado,
                acumuladoRevancha: acumuladoRevancha,
                premios: premios,
                source: 'resultadobaloto.com',
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No se pudieron extraer los números del Baloto',
                numbersFound: numbers.length,
                superBalotaFound: superBalota.length,
            });
        }
    } catch (error) {
        console.error('Error al hacer scraping de Baloto:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resultados de Baloto',
            ...(IS_PRODUCTION ? {} : { details: error.message }),
        });
    }
});

// Endpoint para obtener resultados de Baloto Revancha mediante scraping
app.get('/api/baloto-revancha', scrapingLimiter, async (req, res) => {
    try {
        const SCRAPER_URL = 'https://www.resultadobaloto.com/';
        let htmlData = getCachedHtml(SCRAPER_URL);
        if (!htmlData) {
            const response = await axios.get(SCRAPER_URL, { headers: SCRAPER_HEADERS, timeout: AXIOS_TIMEOUT_MS });
            htmlData = response.data;
            setCachedHtml(SCRAPER_URL, htmlData);
        }
        const $ = cheerio.load(htmlData);

        // Buscar los números del Baloto Revancha
        const numbers = [];
        const superBalota = [];

        // En el primer panel hay 10 números: los primeros 5 son Baloto, los siguientes 5 son Revancha
        const firstPanel = $('#listaResultados .panel').eq(0);

        const allNumbers = [];
        firstPanel.find('.label-baloto').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 43) {
                allNumbers.push(num);
            }
        });

        // Los números de la Revancha son del índice 5 al 9 (los últimos 5)
        for (let i = 5; i < 10 && i < allNumbers.length; i++) {
            numbers.push(allNumbers[i]);
        }

        // Súper Balota: la segunda (índice 1)
        const allSuperBalotas = [];
        firstPanel.find('.label-comple').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 16) {
                allSuperBalotas.push(num);
            }
        });

        if (allSuperBalotas.length > 1) {
            superBalota.push(allSuperBalotas[1]); // Segunda Súper Balota = Revancha
        }

        // Buscar fecha del sorteo
        let fecha = null;
        const timeElement = firstPanel.find('time');
        if (timeElement.length > 0) {
            fecha = timeElement.text().trim();
        }

        // Buscar número de sorteo
        let sorteo = null;
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto.*?(\d+)/i);
        if (sorteoMatch) {
            sorteo = sorteoMatch[1];
        }

        // Extraer acumulado de Revancha del sitio de resultados (fallback)
        let acumuladoRevancha = null;
        $('p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\$\s*([\d,\.]+)\s*millones?\s+y\s+\$\s*([\d,\.]+)\s*millones?/i);
            if (match) {
                acumuladoRevancha = parseFloat(match[2].replace(/,/g, '')) * 1000000;
            }
        });

        // Intentar obtener acumulado oficial (más actualizado)
        try {
            const acumuladosOficiales = await getAcumuladosOficiales();
            if (acumuladosOficiales && acumuladosOficiales.revancha) {
                acumuladoRevancha = acumuladosOficiales.revancha * 1000000;
            }
        } catch (error) {
            console.log('No se pudo obtener acumulado oficial, usando fallback');
        }

        // Extraer premios de la tabla (segunda tabla es Revancha)
        const premios = [];
        const prizeTable = $('table.table-bordered').eq(1);
        prizeTable.find('tr').each((i, row) => {
            const cells = [];
            $(row)
                .find('td')
                .each((j, cell) => {
                    cells.push($(cell).text().trim());
                });
            if (cells.length >= 4 && cells[0].includes('Aciertos')) {
                const categoria = cells[0];
                const importePorGanador = cells[3].replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '');
                const premio = parseInt(importePorGanador) || 0;
                premios.push({ categoria, premio });
            }
        });

        if (numbers.length === 5 && superBalota.length === 1) {
            res.json({
                success: true,
                numbers: numbers,
                superBalota: superBalota[0],
                fecha: fecha,
                sorteo: sorteo,
                acumulado: acumuladoRevancha,
                premios: premios,
                source: 'resultadobaloto.com',
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No se pudieron extraer los números del Baloto Revancha',
                numbersFound: numbers.length,
                superBalotaFound: superBalota.length,
            });
        }
    } catch (error) {
        console.error('Error al hacer scraping de Baloto Revancha:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resultados de Baloto Revancha',
            ...(IS_PRODUCTION ? {} : { details: error.message }),
        });
    }
});

// Endpoint para obtener resultados de Miloto mediante scraping
app.get('/api/miloto', scrapingLimiter, async (req, res) => {
    try {
        const SCRAPER_URL = 'https://www.resultadobaloto.com/miloto.php';
        let htmlData = getCachedHtml(SCRAPER_URL);
        if (!htmlData) {
            const response = await axios.get(SCRAPER_URL, { headers: SCRAPER_HEADERS, timeout: AXIOS_TIMEOUT_MS });
            htmlData = response.data;
            setCachedHtml(SCRAPER_URL, htmlData);
        }
        const $ = cheerio.load(htmlData);

        // Buscar los 5 números del Miloto (1-39)
        const numbers = [];
        const firstPanel = $('#listaResultados .panel').first();

        firstPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 39) {
                    numbers.push(num);
                }
            }
        });

        // Buscar fecha del sorteo
        let fecha = null;
        const timeElement = firstPanel.find('time');
        if (timeElement.length > 0) {
            fecha = timeElement.text().trim();
        }

        // Buscar número de sorteo
        let sorteo = null;
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Miloto\s*(\d+)/i);
        if (sorteoMatch) {
            sorteo = sorteoMatch[1];
        }

        // Extraer acumulado del sitio de resultados (fallback)
        let acumulado = null;
        $('p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\$\s*([\d,\.]+)\s*millones?.*Miloto/i);
            if (match) {
                acumulado = parseFloat(match[1].replace(/,/g, '')) * 1000000;
            }
        });

        // Intentar obtener acumulado del sitio oficial (más actualizado)
        try {
            const acumuladosOficiales = await getAcumuladosOficiales();
            if (acumuladosOficiales && acumuladosOficiales.miloto) {
                acumulado = acumuladosOficiales.miloto * 1000000;
            }
        } catch (error) {
            console.log('No se pudo obtener acumulado oficial, usando fallback');
        }

        if (numbers.length === 5) {
            res.json({
                success: true,
                numbers: numbers,
                fecha: fecha,
                sorteo: sorteo,
                acumulado: acumulado,
                source: 'resultadobaloto.com',
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No se pudieron extraer los 5 números del Miloto',
                numbersFound: numbers.length,
            });
        }
    } catch (error) {
        console.error('Error al hacer scraping de Miloto:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resultados de Miloto',
            ...(IS_PRODUCTION ? {} : { details: error.message }),
        });
    }
});

// Endpoint para obtener resultados de Colorloto mediante scraping
app.get('/api/colorloto', scrapingLimiter, async (req, res) => {
    try {
        const SCRAPER_URL = 'https://www.resultadobaloto.com/colorloto.php';
        let htmlData = getCachedHtml(SCRAPER_URL);
        if (!htmlData) {
            const response = await axios.get(SCRAPER_URL, { headers: SCRAPER_HEADERS, timeout: AXIOS_TIMEOUT_MS });
            htmlData = response.data;
            setCachedHtml(SCRAPER_URL, htmlData);
        }
        const $ = cheerio.load(htmlData);

        // Buscar 6 combinaciones de color-número
        const colorNumberPairs = [];

        // Mapeo de clases CSS a nombres de colores
        const colorClassMap = {
            bolaamarilla: 'amarillo',
            bolaazul: 'azul',
            bolaroja: 'rojo',
            bolaverde: 'verde',
            bolablanca: 'blanco',
            bolanegra: 'negro',
        };

        // Buscar en el primer panel de resultados
        const firstPanel = $('#listaResultados .panel').first();

        // Estructura real: <span class='circulo bolaamarilla'>2</span>
        firstPanel.find('span.circulo').each((i, elem) => {
            if (colorNumberPairs.length >= 6) return false;

            const classes = $(elem).attr('class') || '';
            const number = parseInt($(elem).text().trim());

            // Identificar color por clase CSS
            let color = null;
            for (const [cssClass, colorName] of Object.entries(colorClassMap)) {
                if (classes.includes(cssClass)) {
                    color = colorName;
                    break;
                }
            }

            if (color && !isNaN(number) && number >= 1 && number <= 7) {
                colorNumberPairs.push({ color, number });
            }
        });

        // Buscar fecha del sorteo
        let fecha = null;
        const timeElement = firstPanel.find('time');
        if (timeElement.length > 0) {
            fecha = timeElement.text().trim();
        }

        // Buscar número de sorteo
        let sorteo = null;
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Colorloto\s*(\d+)/i);
        if (sorteoMatch) {
            sorteo = sorteoMatch[1];
        }

        // Extraer acumulado del sitio de resultados (fallback)
        let acumulado = null;
        $('p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\$\s*([\d,\.]+)\s*millones?.*Colorloto/i);
            if (match) {
                acumulado = parseFloat(match[1].replace(/,/g, '')) * 1000000;
            }
        });

        // Intentar obtener acumulado del sitio oficial (más actualizado)
        try {
            const acumuladosOficiales = await getAcumuladosOficiales();
            if (acumuladosOficiales && acumuladosOficiales.colorloto) {
                acumulado = acumuladosOficiales.colorloto * 1000000;
            }
        } catch (error) {
            console.log('No se pudo obtener acumulado oficial, usando fallback');
        }

        if (colorNumberPairs.length === 6) {
            res.json({
                success: true,
                colorNumberPairs: colorNumberPairs,
                fecha: fecha,
                sorteo: sorteo,
                acumulado: acumulado,
                source: 'resultadobaloto.com',
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No se pudieron extraer las 6 combinaciones de color-número del Colorloto',
                pairsFound: colorNumberPairs.length,
            });
        }
    } catch (error) {
        console.error('Error al hacer scraping de Colorloto:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resultados de Colorloto',
            ...(IS_PRODUCTION ? {} : { details: error.message }),
        });
    }
});

// ========================================
// ENDPOINT COMBINADO BALOTO + REVANCHA (un solo HTTP fetch)
// ========================================
app.get('/api/baloto-combined', scrapingLimiter, async (req, res) => {
    try {
        const SCRAPER_URL = 'https://www.resultadobaloto.com/';
        let htmlData = getCachedHtml(SCRAPER_URL);
        if (!htmlData) {
            const response = await axios.get(SCRAPER_URL, { headers: SCRAPER_HEADERS, timeout: AXIOS_TIMEOUT_MS });
            htmlData = response.data;
            setCachedHtml(SCRAPER_URL, htmlData);
        }
        const $ = cheerio.load(htmlData);

        const firstPanel = $('#listaResultados .panel').eq(0);

        const allNumbers = [];
        firstPanel.find('.label-baloto').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 43) allNumbers.push(num);
        });

        const allSuperBalotas = [];
        firstPanel.find('.label-comple').each((i, elem) => {
            const num = parseInt($(elem).text().trim());
            if (!isNaN(num) && num >= 1 && num <= 16) allSuperBalotas.push(num);
        });

        if (allNumbers.length < 10 || allSuperBalotas.length < 2) {
            return res.status(404).json({
                success: false,
                error: 'No se pudieron extraer los datos de Baloto y Revancha',
                numbersFound: allNumbers.length,
                superBalotasFound: allSuperBalotas.length,
            });
        }

        const fecha = firstPanel.find('time').text().trim() || null;
        const heading = firstPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto\s*(\d+)/i);
        const sorteo = sorteoMatch ? sorteoMatch[1] : null;

        // Acumulados (fallback)
        let acumulado = null;
        let acumuladoRevancha = null;
        $('p').each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\$\s*([\d,\.]+)\s*millones?\s+y\s+\$\s*([\d,\.]+)\s*millones?/i);
            if (match) {
                acumulado = parseFloat(match[1].replace(/,/g, '')) * 1000000;
                acumuladoRevancha = parseFloat(match[2].replace(/,/g, '')) * 1000000;
            }
        });

        // Acumulados oficiales (con cach\u00e9 propia)
        try {
            const acumuladosOficiales = await getAcumuladosOficiales();
            if (acumuladosOficiales) {
                if (acumuladosOficiales.baloto) acumulado = acumuladosOficiales.baloto * 1000000;
                if (acumuladosOficiales.revancha) acumuladoRevancha = acumuladosOficiales.revancha * 1000000;
            }
        } catch (err) {
            console.log('No se pudo obtener acumulados oficiales, usando fallback');
        }

        // Tablas de premios
        const balotroPremios = [];
        $('table.table-bordered').eq(0).find('tr').each((i, row) => {
            const cells = [];
            $(row).find('td').each((j, cell) => cells.push($(cell).text().trim()));
            if (cells.length >= 4 && cells[0].includes('Aciertos')) {
                balotroPremios.push({ categoria: cells[0], premio: parseInt(cells[3].replace(/[\$\.,]/g, '')) || 0 });
            }
        });

        const revanchaPremios = [];
        $('table.table-bordered').eq(1).find('tr').each((i, row) => {
            const cells = [];
            $(row).find('td').each((j, cell) => cells.push($(cell).text().trim()));
            if (cells.length >= 4 && cells[0].includes('Aciertos')) {
                revanchaPremios.push({ categoria: cells[0], premio: parseInt(cells[3].replace(/[\$\.,]/g, '')) || 0 });
            }
        });

        res.json({
            success: true,
            source: 'resultadobaloto.com',
            baloto: {
                numbers: allNumbers.slice(0, 5),
                superBalota: allSuperBalotas[0],
                fecha,
                sorteo,
                acumulado,
                premios: balotroPremios,
            },
            revancha: {
                numbers: allNumbers.slice(5, 10),
                superBalota: allSuperBalotas[1],
                fecha,
                sorteo,
                acumulado: acumuladoRevancha,
                premios: revanchaPremios,
            },
        });
    } catch (error) {
        console.error('Error al hacer scraping combinado Baloto/Revancha:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al obtener resultados de Baloto y Revancha',
            ...(IS_PRODUCTION ? {} : { details: error.message }),
        });
    }
});

// ========================================
// GENERADOR INTELIGENTE - NUEVOS ENDPOINTS
// ========================================

// Generar números inteligentes de Baloto
app.get('/api/generate/baloto', (req, res) => {
    try {
        const result = generateIntelligentBaloto();
        res.json({
            success: true,
            numbers: result.numbers,
            superBalota: result.superBalota,
            method: result.method,
            totalSorteos: result.totalSorteos,
            confidence: result.confidence,
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado con estadísticas posicionales de ${result.totalSorteos} sorteos (confianza: ${result.confidence}%)`
                    : `Generado aleatoriamente (se necesitan ${MIN_SORTEOS_FOR_STATISTICS} sorteos para usar estadísticas, actuales: ${result.totalSorteos})`,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generar números inteligentes de Miloto
app.get('/api/generate/miloto', (req, res) => {
    try {
        const result = generateIntelligentMiloto();
        res.json({
            success: true,
            numbers: result.numbers,
            method: result.method,
            totalSorteos: result.totalSorteos,
            confidence: result.confidence,
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado con estadísticas posicionales de ${result.totalSorteos} sorteos (confianza: ${result.confidence}%)`
                    : `Generado aleatoriamente (se necesitan ${MIN_SORTEOS_FOR_STATISTICS} sorteos para usar estadísticas, actuales: ${result.totalSorteos})`,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generar números inteligentes de Colorloto
app.get('/api/generate/colorloto', (req, res) => {
    try {
        const result = generateIntelligentColorloto();
        res.json({
            success: true,
            pairs: result.pairs,
            method: result.method,
            totalSorteos: result.totalSorteos,
            confidence: result.confidence,
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado con estadísticas por color de ${result.totalSorteos} sorteos (confianza: ${result.confidence}%)`
                    : `Generado aleatoriamente (se necesitan ${MIN_SORTEOS_FOR_STATISTICS} sorteos para usar estadísticas, actuales: ${result.totalSorteos})`,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de estadísticas generales
app.get('/api/statistics', (req, res) => {
    try {
        const balotoTotal = db.getTotalResults('Baloto');
        const milotoTotal = db.getTotalResults('Miloto');
        const colorlotoTotal = db.getTotalResults('Colorloto');

        const balotoFreq = balotoTotal > 0 ? getNumberFrequency('Baloto') : {};
        const milotoFreq = milotoTotal > 0 ? getNumberFrequency('Miloto') : {};

        // Top 10 números Baloto
        const balotoTop10 = Object.entries(balotoFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([num, count]) => ({ number: parseInt(num), count }));

        // Top 10 números Miloto
        const milotoTop10 = Object.entries(milotoFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([num, count]) => ({ number: parseInt(num), count }));

        res.json({
            success: true,
            totals: {
                baloto: balotoTotal,
                miloto: milotoTotal,
                colorloto: colorlotoTotal,
            },
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            baloto: {
                hasEnoughData: balotoTotal >= MIN_SORTEOS_FOR_STATISTICS,
                top10: balotoTop10,
            },
            miloto: {
                hasEnoughData: milotoTotal >= MIN_SORTEOS_FOR_STATISTICS,
                top10: milotoTop10,
            },
            colorloto: {
                hasEnoughData: colorlotoTotal >= MIN_SORTEOS_FOR_STATISTICS,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de portafolio estratégico (Baloto, Revancha, Miloto, Colorloto)
app.get('/api/portfolio', scrapingLimiter, (req, res) => {
    try {
        const report = buildFullReport();
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ENDPOINTS DE HISTORIAL DE SORTEOS
// ========================================

// Endpoint para listar sorteos históricos
app.get('/api/history/:game', (req, res) => {
    try {
        const { game } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        // Validar juego
        const validGames = ['Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto'];
        if (!validGames.includes(game)) {
            return res.status(400).json({
                success: false,
                error: `Juego no válido. Opciones: ${validGames.join(', ')}`,
            });
        }

        const results = db.getAllResults(game, limit);

        res.json({
            success: true,
            game: game,
            total: results.length,
            sorteos: results.map(r => ({
                id: r.id,
                sorteo: r.sorteo,
                fecha: r.fecha,
                numeros: r.numeros.split(',').map(n => parseInt(n.trim())),
                superBalota: r.superBalota ? parseInt(r.superBalota) : null,
                colorNumberPairs: r.colorNumberPairs ? JSON.parse(r.colorNumberPairs) : null,
            })),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para obtener un sorteo específico por ID
app.get('/api/history/:game/:sorteoId', (req, res) => {
    try {
        const { game, sorteoId } = req.params;

        const result = db.getResultByGameAndSorteo(game, sorteoId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Sorteo no encontrado',
            });
        }

        res.json({
            success: true,
            sorteo: {
                id: result.id,
                sorteo: result.sorteo,
                fecha: result.fecha,
                numeros: result.numeros.split(',').map(n => parseInt(n.trim())),
                superBalota: result.superBalota ? parseInt(result.superBalota) : null,
                colorNumberPairs: result.colorNumberPairs ? JSON.parse(result.colorNumberPairs) : null,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para validar contra sorteo histórico
app.post('/api/validate-historical', express.json(), (req, res) => {
    try {
        const { game, sorteoId, userNumbers, superBalota, colorNumberPairs } = req.body;

        // Validar parámetros de entrada
        const validGames = ['Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto'];
        if (!game || !validGames.includes(game)) {
            return res.status(400).json({ success: false, error: 'Juego no válido.' });
        }
        if (sorteoId === undefined || isNaN(parseInt(sorteoId))) {
            return res.status(400).json({ success: false, error: 'sorteoId inválido.' });
        }
        if (game !== 'Colorloto' && (!Array.isArray(userNumbers) || userNumbers.length < 1)) {
            return res.status(400).json({ success: false, error: 'userNumbers debe ser un array.' });
        }

        // Obtener resultado histórico
        const result = db.getResultByGameAndSorteo(game, sorteoId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Sorteo no encontrado',
            });
        }

        // Convertir resultados históricos
        const historicalNumbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        const historicalSuperBalota = result.superBalota ? parseInt(result.superBalota) : null;

        // Calcular aciertos según el juego
        let validation = {};

        if (game === 'Baloto' || game === 'Baloto Revancha') {
            const matches = userNumbers.filter(num => historicalNumbers.includes(num)).length;
            const superMatch = superBalota === historicalSuperBalota;

            validation = {
                matches,
                superMatch,
                userNumbers,
                historicalNumbers,
                userSuperBalota: superBalota,
                historicalSuperBalota,
            };
        } else if (game === 'Miloto') {
            const matches = userNumbers.filter(num => historicalNumbers.includes(num)).length;

            validation = {
                matches,
                userNumbers,
                historicalNumbers,
            };
        } else if (game === 'Colorloto') {
            const historicalPairs = JSON.parse(result.colorNumberPairs);
            const remainingHistoricalPairs = [...historicalPairs];
            let exactMatches = 0;

            colorNumberPairs.forEach(userPair => {
                const matchIndex = remainingHistoricalPairs.findIndex(
                    histPair => userPair.color === histPair.color && userPair.number === histPair.number
                );
                if (matchIndex !== -1) {
                    exactMatches++;
                    remainingHistoricalPairs.splice(matchIndex, 1);
                }
            });

            validation = {
                exactMatches,
                userPairs: colorNumberPairs,
                historicalPairs,
            };
        }

        res.json({
            success: true,
            game,
            sorteo: result.sorteo,
            fecha: result.fecha,
            validation,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎰 Servidor de Validador de Tiquetes iniciado          ║
║                                                            ║
║   📍 URL: http://localhost:${PORT}                         ║
║   🌍 Entorno: ${IS_PRODUCTION ? 'producción         ' : 'desarrollo          '}                   ║
║                                                            ║
║   📡 Endpoints disponibles:                               ║
║   • GET  /health               - Estado del servidor      ║
║   • GET  /api/baloto-combined  - Baloto + Revancha (1 req)║
║   • GET  /api/baloto           - Resultados de Baloto     ║
║   • GET  /api/baloto-revancha  - Resultados Revancha      ║
║   • GET  /api/miloto           - Resultados de Miloto     ║
║   • GET  /api/colorloto        - Resultados de Colorloto  ║
║   • GET  /api/generate/baloto  - Generar Baloto IA        ║
║   • GET  /api/generate/miloto  - Generar Miloto IA        ║
║   • GET  /api/generate/colorloto - Generar Colorloto IA   ║
║   • GET  /api/statistics       - Estadísticas generales   ║
║   • GET  /api/history/:game    - Historial de sorteos    ║
║   • GET  /api/history/:game/:id - Sorteo específico      ║
║   • POST /api/validate-historical - Validar histórico    ║
║                                                            ║
║   🌐 Abre http://localhost:3000 en tu navegador          ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// ========================================
// SCRAPING AUTOMÁTICO — cada 6 horas
// ========================================
const SCRAPING_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 horas

async function autoScrape() {
    console.log(`[auto-scrape] ${new Date().toLocaleString('es-CO')} — iniciando...`);
    try {
        await runInitialScraping();
        console.log(`[auto-scrape] completado.`);
    } catch (err) {
        console.error(`[auto-scrape] error:`, err.message);
    }
}

// Primera ejecución 60 s después del arranque para no bloquear el inicio
setTimeout(() => {
    autoScrape();
    setInterval(autoScrape, SCRAPING_INTERVAL_MS);
}, 60_000).unref();

// Apagado limpio: cierra la BD antes de terminar (evita corrupción SQLite WAL)
function gracefulShutdown(signal) {
    console.log(`\nRecibida señal ${signal}, cerrando servidor...`);
    server.close(() => {
        console.log('Servidor HTTP cerrado.');
        try {
            db.closeDatabase();
            console.log('Base de datos cerrada correctamente.');
        } catch (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        }
        process.exit(0);
    });
    // Forzar salida si no cierra en 10 segundos
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
