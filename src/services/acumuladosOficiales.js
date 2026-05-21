const axios = require('axios');

// Caché TTL para evitar requests repetidos a baloto.com
let _acumuladosCache = null;
let _acumuladosCacheExpiresAt = 0;
const ACUMULADOS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

/**
 * Extrae el valor monetario que sigue a `label` en el HTML crudo.
 * Mucho más rápido que recorrer el DOM con $('*').each().
 */
function parseAcumuladoFromHtml(html, label) {
    const idx = html.indexOf(label);
    if (idx === -1) return null;
    const snippet = html.slice(idx, idx + 300);
    const match = snippet.match(/\$\s*([\d.,]+)/);
    if (!match) return null;
    const raw = match[1].replace(/\./g, '').replace(/,/g, '.');
    const value = parseFloat(raw);
    return isNaN(value) ? null : value;
}

// Función para extraer acumulados del sitio oficial baloto.com
async function getAcumuladosOficiales() {
    if (_acumuladosCache && Date.now() < _acumuladosCacheExpiresAt) {
        return _acumuladosCache;
    }

    try {
        const response = await axios.get('https://www.baloto.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
        });

        const html = response.data;
        const acumulados = {};

        const baloto = parseAcumuladoFromHtml(html, 'ACUMULADO BALOTO');
        if (baloto !== null) acumulados.baloto = baloto;

        const revancha = parseAcumuladoFromHtml(html, 'ACUMULADO REVANCHA');
        if (revancha !== null) acumulados.revancha = revancha;

        const miloto = parseAcumuladoFromHtml(html, 'ACUMULADO MILOTO');
        if (miloto !== null) acumulados.miloto = miloto;

        const colorloto = parseAcumuladoFromHtml(html, 'ACUMULADO ColorLOTO');
        if (colorloto !== null) acumulados.colorloto = colorloto;

        // Solo cachear si obtuvimos al menos un valor real
        if (Object.keys(acumulados).length > 0) {
            _acumuladosCache = acumulados;
            _acumuladosCacheExpiresAt = Date.now() + ACUMULADOS_CACHE_TTL_MS;
        }
        return acumulados;
    } catch (error) {
        console.error('Error al obtener acumulados de baloto.com:', error.message);
        return null;
    }
}

module.exports = { getAcumuladosOficiales };
