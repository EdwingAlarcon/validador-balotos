const axios = require('axios');
const cheerio = require('cheerio');

// Función para extraer acumulados del sitio oficial baloto.com
async function getAcumuladosOficiales() {
    try {
        const response = await axios.get('https://www.baloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const $ = cheerio.load(response.data);
        const acumulados = {};

        // Buscar acumulados en el HTML
        $('*').each((i, el) => {
            const text = $(el).text().trim();

            // Buscar ACUMULADO BALOTO (exacto, sin REVANCHA)
            if (text === 'ACUMULADO BALOTO' && !acumulados.baloto) {
                const nextText = $(el).next().text().replace(/\s+/g, '');
                const match = nextText.match(/\$?([\d,\.]+)/);
                if (match) {
                    const value = match[1].replace(/\./g, '').replace(/,/g, '.');
                    acumulados.baloto = parseFloat(value);
                }
            }

            // Buscar ACUMULADO REVANCHA
            if (text === 'ACUMULADO REVANCHA' && !acumulados.revancha) {
                const nextText = $(el).next().text().replace(/\s+/g, '');
                const match = nextText.match(/\$?([\d,\.]+)/);
                if (match) {
                    const value = match[1].replace(/\./g, '').replace(/,/g, '.');
                    acumulados.revancha = parseFloat(value);
                }
            }

            // Buscar ACUMULADO MILOTO
            if (text === 'ACUMULADO MILOTO' && !acumulados.miloto) {
                const nextText = $(el).next().text().replace(/\s+/g, '');
                const match = nextText.match(/\$?([\d,\.]+)/);
                if (match) {
                    const value = match[1].replace(/\./g, '').replace(/,/g, '.');
                    acumulados.miloto = parseFloat(value);
                }
            }

            // Buscar ACUMULADO ColorLOTO
            if (text === 'ACUMULADO ColorLOTO' && !acumulados.colorloto) {
                const nextText = $(el).next().text().replace(/\s+/g, '');
                const match = nextText.match(/\$?([\d,\.]+)/);
                if (match) {
                    const value = match[1].replace(/\./g, '').replace(/,/g, '.');
                    acumulados.colorloto = parseFloat(value);
                }
            }
        });

        return acumulados;
    } catch (error) {
        console.error('Error al obtener acumulados de baloto.com:', error.message);
        return null;
    }
}

module.exports = { getAcumuladosOficiales };
