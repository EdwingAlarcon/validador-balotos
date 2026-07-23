// src/services/firecrawlClient.js
//
// Cliente delgado para la API REST de Firecrawl (POST /v2/scrape). Se usa
// para leer baloto.com, cuyas páginas de resultados son renderizadas por
// JavaScript y no se pueden leer con axios+cheerio (ver auditoría de
// scraping). Requiere FIRECRAWL_API_KEY en el entorno — si no está
// configurada, isConfigured() devuelve false y el llamador debe usar la
// fuente de respaldo (resultadobaloto.com) en su lugar.
//
// No se registran ni exponen aquí el valor de la API key en logs.

const axios = require('axios');

const FIRECRAWL_API_URL = process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev';
const FIRECRAWL_TIMEOUT_MS = 20000;

function isConfigured() {
    return Boolean(process.env.FIRECRAWL_API_KEY);
}

async function scrape(url, { formats = ['markdown'], waitFor = 4000 } = {}) {
    if (!isConfigured()) {
        throw new Error('FIRECRAWL_API_KEY no configurada');
    }

    const response = await axios.post(
        `${FIRECRAWL_API_URL}/v2/scrape`,
        { url, formats, waitFor, maxAge: 0 },
        {
            headers: {
                Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: FIRECRAWL_TIMEOUT_MS,
        }
    );

    if (!response.data || response.data.success !== true || !response.data.data) {
        throw new Error('Firecrawl no devolvió un resultado exitoso');
    }

    return response.data.data;
}

module.exports = { scrape, isConfigured };
