// tests/unit/test-firecrawlClient.js
const assert = require('assert');

const originalKey = process.env.FIRECRAWL_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

// Requerir después de borrar la env var: isConfigured() lee process.env en
// cada llamada, no la cachea al cargar el módulo.
const { isConfigured, scrape } = require('../../src/services/firecrawlClient');

assert.strictEqual(isConfigured(), false, 'sin FIRECRAWL_API_KEY debe reportar no configurado');

scrape('https://example.com')
    .then(() => {
        throw new Error('scrape() debía rechazar sin API key configurada');
    })
    .catch(err => {
        assert.ok(/FIRECRAWL_API_KEY/.test(err.message), `mensaje de error debe mencionar la variable faltante: ${err.message}`);
        console.log('test-firecrawlClient: OK');
    })
    .finally(() => {
        if (originalKey) process.env.FIRECRAWL_API_KEY = originalKey;
    });
