const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const db = require('./services/database');
const { getAcumuladosOficiales } = require('./services/acumuladosOficiales');
const {
    generateIntelligentBaloto,
    generateIntelligentMiloto,
    generateIntelligentColorloto,
    getNumberFrequency,
    MIN_SORTEOS_FOR_STATISTICS,
} = require('./services/intelligentGenerator');

const app = express();
const PORT = process.env.PORT || 3000; // Usar puerto del entorno o 3000 por defecto

// Inicializar base de datos al arrancar el servidor
db.initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Desactivar caché para archivos estáticos en desarrollo
app.use(
    express.static('public', {
        etag: false,
        maxAge: 0,
        setHeaders: res => {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        },
    })
);

// Endpoint para obtener resultados de Baloto mediante scraping
app.get('/api/baloto', async (req, res) => {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

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
            details: error.message,
        });
    }
});

// Endpoint para obtener resultados de Baloto Revancha mediante scraping
app.get('/api/baloto-revancha', async (req, res) => {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

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
            details: error.message,
        });
    }
});

// Endpoint para obtener resultados de Miloto mediante scraping
app.get('/api/miloto', async (req, res) => {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/miloto.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

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
            details: error.message,
        });
    }
});

// Endpoint para obtener resultados de Colorloto mediante scraping
app.get('/api/colorloto', async (req, res) => {
    try {
        const response = await axios.get('https://www.resultadobaloto.com/colorloto.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(response.data);

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
            details: error.message,
        });
    }
});

// Endpoint de debug
app.get('/api/debug/:game', async (req, res) => {
    const { game } = req.params;
    const urls = {
        miloto: 'https://www.resultadobaloto.com/miloto.php',
        colorloto: 'https://www.resultadobaloto.com/colorloto.php',
    };

    try {
        const response = await axios.get(urls[game], {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        res.send(response.data);
    } catch (error) {
        res.status(500).send(error.message);
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
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado usando estadísticas de ${result.totalSorteos} sorteos históricos`
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
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado usando estadísticas de ${result.totalSorteos} sorteos históricos`
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
            minRequired: MIN_SORTEOS_FOR_STATISTICS,
            message:
                result.method === 'statistical'
                    ? `Generado usando estadísticas de ${result.totalSorteos} sorteos históricos`
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

// Servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎰 Servidor de Validador de Tiquetes iniciado          ║
║                                                            ║
║   📍 URL: http://localhost:${PORT}                         ║
║                                                            ║
║   📡 Endpoints disponibles:                               ║
║   • GET  /api/baloto           - Resultados de Baloto     ║
║   • GET  /api/baloto-revancha  - Resultados Revancha      ║
║   • GET  /api/miloto           - Resultados de Miloto     ║
║   • GET  /api/colorloto        - Resultados de Colorloto  ║
║   • GET  /api/generate/baloto  - Generar Baloto IA        ║
║   • GET  /api/generate/miloto  - Generar Miloto IA        ║
║   • GET  /api/generate/colorloto - Generar Colorloto IA   ║
║   • GET  /api/statistics       - Estadísticas generales   ║
║                                                            ║
║   🌐 Abre http://localhost:3000 en tu navegador          ║
╚════════════════════════════════════════════════════════════╝
    `);
});
