// src/services/officialScraper.js
//
// Parsers puros para las páginas de listado de resultados de baloto.com
// (fuente oficial). Reciben el markdown/HTML ya obtenido (vía Firecrawl, que
// sí ejecuta el JavaScript que baloto.com necesita para renderizar) y
// devuelven los sorteos en la misma forma que los parsers de
// resultadobaloto.com en initialScraping.js, para que ambas fuentes sean
// intercambiables para quien las consume.
//
// No hace peticiones de red por sí mismo — ver src/services/firecrawlClient.js
// para eso.

const cheerio = require('cheerio');

const OFFICIAL_URLS = {
    balotoListing: 'https://baloto.com/resultados',
    milotoListing: 'https://baloto.com/miloto/resultados/',
    colorlotoListing: 'https://baloto.com/colorloto/resultados',
};

// Tabla de baloto.com/resultados: cada fila trae Baloto y Revancha
// intercalados, distinguibles por la URL de "Ver detalle"
// (resultados-baloto/N vs resultados-revancha/N).
function parseBalotoListingMarkdown(markdown) {
    const rowRegex =
        /\|\s*!\[\]\([^)]*\)\s*\|\s*([^|]+?)\s*\|\s*([\d\s-]+?)\s*\|\s*\[Ver detalle\]\(https?:\/\/[^)]*\/(resultados-baloto|resultados-revancha)\/(\d+)\)\s*\|/g;

    const baloto = [];
    const revancha = [];
    let match;
    while ((match = rowRegex.exec(markdown)) !== null) {
        const [, fecha, numerosRaw, kind, sorteoStr] = match;
        const numeros = numerosRaw
            .split('-')
            .map(n => n.trim())
            .filter(Boolean);
        if (numeros.length !== 6) continue; // 5 números + superBalota

        const row = {
            sorteo: parseInt(sorteoStr, 10),
            fecha: fecha.trim(),
            numeros: numeros.slice(0, 5),
            superBalota: numeros[5],
        };
        if (kind === 'resultados-baloto') baloto.push(row);
        else revancha.push(row);
    }
    return { baloto, revancha };
}

// Tabla de baloto.com/miloto/resultados/: fecha, números (sin superBalota),
// link a resultados-miloto/N.
function parseMilotoListingMarkdown(markdown) {
    const rowRegex =
        /\|\s*([^|]+?)\s*\|\s*([\d\s\\-]+?)\s*\|\s*\[Ver detalle\]\(https?:\/\/[^)]*\/miloto\/resultados-miloto\/(\d+)\/?\)\s*\|/g;

    const results = [];
    let match;
    while ((match = rowRegex.exec(markdown)) !== null) {
        const [, fecha, numerosRaw, sorteoStr] = match;
        const numeros = numerosRaw
            .replace(/\\/g, '')
            .split('-')
            .map(n => n.trim())
            .filter(Boolean);
        if (numeros.length !== 5) continue;

        results.push({ sorteo: parseInt(sorteoStr, 10), fecha: fecha.trim(), numeros });
    }
    return results;
}

// Tabla de baloto.com/colorloto/resultados: cada fila tiene 6 divs
// .balota-bg.balota-{color} con el número dentro.
function parseColorlotoListingHtml(html) {
    const $ = cheerio.load(html);
    const results = [];

    $('table.table-historic-colorloto tbody tr').each((i, row) => {
        const fecha = $(row).find('td').first().text().trim();
        if (!fecha) return;

        const detailHref = $(row).find('a.btn-detail-colorloto').attr('href') || '';
        const sorteoMatch = detailHref.match(/\/colorloto\/resultados\/(\d+)/);
        if (!sorteoMatch) return;

        const colorMap = {
            yellow: 'amarillo',
            blue: 'azul',
            red: 'rojo',
            green: 'verde',
            white: 'blanco',
            black: 'negro',
        };

        const pairs = [];
        $(row)
            .find('.balota-bg')
            .each((j, el) => {
                const classes = $(el).attr('class') || '';
                const colorMatch = classes.match(/balota-(yellow|blue|red|green|white|black)/);
                const number = parseInt($(el).text().trim(), 10);
                if (!colorMatch || isNaN(number)) return;
                pairs.push({ color: colorMap[colorMatch[1]], number });
            });

        if (pairs.length === 6) {
            results.push({ sorteo: parseInt(sorteoMatch[1], 10), fecha, pairs });
        }
    });

    return results;
}

module.exports = {
    OFFICIAL_URLS,
    parseBalotoListingMarkdown,
    parseMilotoListingMarkdown,
    parseColorlotoListingHtml,
};
