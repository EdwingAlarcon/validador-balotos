// scripts/backfill-official.js
//
// Herramienta de mantenimiento manual — NO se ejecuta en el runtime del servidor.
// Rellena sorteos faltantes en la BD consultando baloto.com (fuente oficial)
// por número de sorteo, vía Firecrawl CLI (`firecrawl scrape`), ya que las
// páginas de detalle de baloto.com son renderizadas por JavaScript y no se
// pueden leer con axios+cheerio (ver auditoría de scraping, sección 2).
//
// Requiere: Firecrawl CLI instalado y autenticado (`firecrawl --status`).
// Uso: node scripts/backfill-official.js [--dry-run] [--game=Baloto]
//
// Es idempotente: usa db.insertResult (INSERT OR IGNORE con
// UNIQUE(game, sorteo)), así que re-ejecutarlo no duplica datos.

const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cheerio = require('cheerio');
const db = require('../src/services/database');

const DRY_RUN = process.argv.includes('--dry-run');
const GAME_FILTER = (process.argv.find(a => a.startsWith('--game=')) || '').split('=')[1];
const CONCURRENCY = 2; // límite del plan de Firecrawl en este entorno

const GAMES = {
    Baloto: {
        urlFor: sorteo => `https://baloto.com/resultados-baloto/${sorteo}`,
        format: 'markdown',
        parse: parseNumericGameMarkdown,
        hasSuperBalota: true,
    },
    'Baloto Revancha': {
        urlFor: sorteo => `https://baloto.com/resultados-revancha/${sorteo}`,
        format: 'markdown',
        parse: parseNumericGameMarkdown,
        hasSuperBalota: true,
    },
    Miloto: {
        urlFor: sorteo => `https://baloto.com/miloto/resultados-miloto/${sorteo}/`,
        format: 'markdown',
        parse: parseNumericGameMarkdown,
        hasSuperBalota: false,
    },
    Colorloto: {
        urlFor: sorteo => `https://baloto.com/colorloto/resultados/${sorteo}`,
        format: 'html',
        parse: parseColorlotoHtml,
        hasSuperBalota: false,
    },
};

function findGaps(game) {
    const rows = db
        .getAllResults(game, 500)
        .map(r => parseInt(r.sorteo, 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    if (rows.length === 0) return [];
    const present = new Set(rows);
    const missing = [];
    for (let s = rows[0]; s <= rows[rows.length - 1]; s++) {
        if (!present.has(s)) missing.push(s);
    }
    return missing;
}

function firecrawlScrape(url, format) {
    return new Promise((resolve, reject) => {
        const outFile = path.join(os.tmpdir(), `backfill-${Date.now()}-${Math.random().toString(36).slice(2)}.${format === 'html' ? 'html' : 'md'}`);
        const args = ['scrape', url, '-o', outFile, '--wait-for', '5000', '--max-age', '0'];
        if (format === 'html') args.push('-f', 'html');
        execFile('firecrawl', args, { timeout: 60000, shell: true }, (err) => {
            if (err) return reject(err);
            fs.readFile(outFile, 'utf8', (readErr, content) => {
                fs.unlink(outFile, () => {});
                if (readErr) return reject(readErr);
                resolve(content);
            });
        });
    });
}

// Extrae "SORTEO #123" / "SORTEO 2.679" -> número entero, día de la semana y
// fecha, y los números en orden de aparición (los últimos, antes de "TOTAL",
// son la superBalota si el juego la tiene).
function parseNumericGameMarkdown(content, expectedSorteo, hasSuperBalota) {
    // Normaliza negrita markdown de una vez — algunos juegos (Miloto) envuelven
    // la fecha en "**...**" y otros (Baloto/Revancha) no; operar siempre sobre
    // el texto ya despojado evita desalineación entre índices.
    const lines = content
        .split('\n')
        .map(l => l.trim().replace(/^\*\*|\*\*$/g, ''))
        .filter(Boolean);
    const sorteoIdx = lines.findIndex(l => /^SORTEO/i.test(l));
    if (sorteoIdx === -1) return null;

    const sorteoMatch = lines[sorteoIdx].match(/(\d[\d.]*)/);
    const sorteo = sorteoMatch ? parseInt(sorteoMatch[1].replace(/\./g, ''), 10) : null;
    if (sorteo !== expectedSorteo) return null; // 404 / redirección / contenido inesperado

    // Día de la semana (línea en negrita corta) + fecha "DD de MMMM de YYYY"
    let weekday = null;
    let fecha = null;
    for (let i = sorteoIdx + 1; i < Math.min(sorteoIdx + 4, lines.length); i++) {
        const line = lines[i];
        if (/^(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)$/i.test(line)) {
            weekday = line;
        } else if (/^\d{1,2} de [a-záéíóú]+ de \d{4}$/i.test(line)) {
            fecha = line;
            break;
        }
    }
    if (!fecha) return null;

    // Números: líneas puramente numéricas entre la fecha y el marcador "TOTAL"
    const dateLineIdx = lines.indexOf(fecha, sorteoIdx);
    const totalIdx = lines.findIndex((l, i) => i > dateLineIdx && /^TOTAL$/i.test(l));
    if (totalIdx === -1) return null;

    const numberLines = lines
        .slice(dateLineIdx + 1, totalIdx)
        .filter(l => /^\d{1,2}$/.test(l));

    const expectedCount = hasSuperBalota ? 6 : 5;
    if (numberLines.length < expectedCount) return null;
    const relevant = numberLines.slice(0, expectedCount);

    return {
        sorteo,
        fecha: weekday ? `${weekday} ${fecha}` : fecha,
        numeros: hasSuperBalota ? relevant.slice(0, 5) : relevant,
        superBalota: hasSuperBalota ? relevant[5] : null,
    };
}

function parseColorlotoHtml(html, expectedSorteo) {
    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const sorteoMatch = bodyText.match(/SORTEO\s*#?\s*(\d+)/i);
    const sorteo = sorteoMatch ? parseInt(sorteoMatch[1], 10) : null;
    if (sorteo !== expectedSorteo) return null;

    const fechaMatch = bodyText.match(/(\d{1,2} de [a-záéíóú]+ de \d{4})/i);
    const fecha = fechaMatch ? fechaMatch[1] : null;
    if (!fecha) return null;

    const pairs = [];
    $('.balota[class*="balota-"]').each((i, el) => {
        const classes = $(el).attr('class') || '';
        const colorMatch = classes.match(/balota-(yellow|blue|red|green|white|black)/);
        const number = parseInt($(el).text().trim(), 10);
        if (!colorMatch || isNaN(number)) return;
        const colorMap = { yellow: 'amarillo', blue: 'azul', red: 'rojo', green: 'verde', white: 'blanco', black: 'negro' };
        pairs.push({ color: colorMap[colorMatch[1]], number });
    });
    if (pairs.length !== 6) return null;

    return { sorteo, fecha, pairs };
}

async function backfillGame(game) {
    const cfg = GAMES[game];
    const missing = findGaps(game);
    if (missing.length === 0) {
        console.log(`[${game}] sin huecos.`);
        return { game, filled: 0, failed: 0, total: 0 };
    }

    console.log(`[${game}] ${missing.length} sorteos faltantes: ${missing.join(', ')}`);

    let filled = 0;
    let failed = 0;
    const queue = [...missing];

    async function worker() {
        while (queue.length > 0) {
            const sorteo = queue.shift();
            const url = cfg.urlFor(sorteo);
            try {
                const content = await firecrawlScrape(url, cfg.format);
                const parsed = cfg.parse(content, sorteo, cfg.hasSuperBalota);
                if (!parsed) {
                    console.log(`  ⚠️  [${game} #${sorteo}] no se pudo parsear (posible 404 o layout inesperado) — ${url}`);
                    failed++;
                    continue;
                }
                if (DRY_RUN) {
                    console.log(`  🔎 [${game} #${sorteo}] (dry-run) ${JSON.stringify(parsed)}`);
                    filled++;
                    continue;
                }
                const inserted =
                    game === 'Colorloto'
                        ? db.insertResult(game, parsed.sorteo, parsed.fecha, parsed.pairs.map(p => `${p.color}-${p.number}`), null, parsed.pairs)
                        : db.insertResult(game, parsed.sorteo, parsed.fecha, parsed.numeros, parsed.superBalota);
                if (inserted) {
                    console.log(`  ✅ [${game} #${sorteo}] ${parsed.fecha}`);
                    filled++;
                } else {
                    console.log(`  ⏭️  [${game} #${sorteo}] ya existía (ignorado)`);
                }
            } catch (err) {
                console.log(`  ❌ [${game} #${sorteo}] error: ${err.message}`);
                failed++;
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return { game, filled, failed, total: missing.length };
}

async function main() {
    db.initDatabase();
    const games = GAME_FILTER ? [GAME_FILTER] : Object.keys(GAMES);
    const results = [];
    for (const game of games) {
        results.push(await backfillGame(game));
    }

    console.log('\n=== RESUMEN BACKFILL ===');
    results.forEach(r => console.log(`${r.game}: ${r.filled}/${r.total} rellenados, ${r.failed} fallidos`));
    db.closeDatabase();
}

main().catch(err => {
    console.error('Error fatal en backfill:', err);
    process.exit(1);
});
