const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // Usar puerto del entorno o 3000 por defecto

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos desde public/

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

        if (numbers.length === 5 && superBalota.length === 1) {
            res.json({
                success: true,
                numbers: numbers,
                superBalota: superBalota[0],
                fecha: fecha,
                sorteo: sorteo,
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

        // Buscar los números del Baloto Revancha (segundo panel)
        const numbers = [];
        const superBalota = [];

        // El Baloto Revancha es típicamente el segundo panel
        const revanchaPanel = $('#listaResultados .panel').eq(1);

        // Números principales
        revanchaPanel.find('.label-baloto').each((i, elem) => {
            if (numbers.length < 5) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 43) {
                    numbers.push(num);
                }
            }
        });

        // Súper Balota
        revanchaPanel.find('.label-comple').each((i, elem) => {
            if (superBalota.length < 1) {
                const num = parseInt($(elem).text().trim());
                if (!isNaN(num) && num >= 1 && num <= 16) {
                    superBalota.push(num);
                }
            }
        });

        // Buscar fecha del sorteo
        let fecha = null;
        const timeElement = revanchaPanel.find('time');
        if (timeElement.length > 0) {
            fecha = timeElement.text().trim();
        }

        // Buscar número de sorteo
        let sorteo = null;
        const heading = revanchaPanel.find('.panel-heading h2').text();
        const sorteoMatch = heading.match(/Baloto.*?(\d+)/i);
        if (sorteoMatch) {
            sorteo = sorteoMatch[1];
        }

        if (numbers.length === 5 && superBalota.length === 1) {
            res.json({
                success: true,
                numbers: numbers,
                superBalota: superBalota[0],
                fecha: fecha,
                sorteo: sorteo,
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

        if (numbers.length === 5) {
            res.json({
                success: true,
                numbers: numbers,
                fecha: fecha,
                sorteo: sorteo,
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

        if (colorNumberPairs.length === 6) {
            res.json({
                success: true,
                colorNumberPairs: colorNumberPairs,
                fecha: fecha,
                sorteo: sorteo,
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

// Servidor
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎰 Servidor de Validador de Tiquetes iniciado          ║
║                                                            ║
║   📍 URL: http://localhost:${PORT}                         ║
║                                                            ║
║   📡 Endpoints disponibles:                               ║
║   • GET  /api/baloto          - Resultados de Baloto      ║
║   • GET  /api/baloto-revancha - Resultados Baloto Revancha║
║   • GET  /api/miloto          - Resultados de Miloto      ║
║   • GET  /api/colorloto       - Resultados de Colorloto   ║
║                                                            ║
║   🌐 Abre http://localhost:3000 en tu navegador          ║
╚════════════════════════════════════════════════════════════╝
    `);
});
