/**
 * Scraper histórico completo desde baloto.com
 * Fuentes: /resultados (Baloto+Revancha), /miloto/resultados, /colorloto/resultados
 * Paginación: ?page=N  |  ~117 páginas Baloto, 55 Miloto, 19 Colorloto
 *
 * Uso: node scripts/scrape-baloto-com.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../src/services/database');

db.initDatabase();

const BASE = 'https://www.baloto.com';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};
const DELAY_MS = 800; // cortesía al servidor

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function parseNumbers(raw) {
    return raw
        .replace(/<[^>]+>/g, ' ')
        .split(/[\s\-–]+/)
        .map(s => s.trim())
        .filter(s => /^\d+$/.test(s))
        .map(Number);
}

async function fetchPage(url) {
    try {
        const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        return res.data;
    } catch (err) {
        console.error(`  ❌ ${url}: ${err.message}`);
        return null;
    }
}

// Última página disponible
async function getMaxPage(baseUrl) {
    const html = await fetchPage(baseUrl);
    if (!html) return 1;
    const nums = [...html.matchAll(/page=(\d+)/g)].map(m => parseInt(m[1]));
    return nums.length ? Math.max(...nums) : 1;
}

// ────────────────────────────────────────────────────────────────
// BALOTO + REVANCHA  (/resultados?page=N)
// ────────────────────────────────────────────────────────────────
// Cada página tiene filas alternas: Baloto, Revancha, Baloto, Revancha…
// El tipo se detecta por el img src (baloto-kind / revancha-kind).
// El sorteo# está en el href del enlace "Ver detalle".

async function scrapeBalotoPage(page) {
    const url = `${BASE}/resultados?page=${page}`;
    const html = await fetchPage(url);
    if (!html) return { baloto: 0, revancha: 0 };

    const $ = cheerio.load(html);
    let baloto = 0, revancha = 0;

    $('#results-table tbody tr').each((_, row) => {
        const $row = $(row);

        // Tipo de juego
        const imgSrc = $row.find('td:first-child img').attr('src') || '';
        const isRevancha = imgSrc.includes('revancha-kind');

        // Fecha
        const fecha = $row.find('.creation-date-results').first().text().trim();
        if (!fecha) return;

        // Números (el último es SB para Baloto/Revancha)
        const rawNums = $row.find('td:nth-child(3)').html() || '';
        const nums = parseNumbers(rawNums);
        if (nums.length < 6) return;

        const numeros = nums.slice(0, 5);
        const superBalota = nums[5];

        // Sorteo# desde href
        const href = $row.find('a').attr('href') || '';
        const sorteoMatch = href.match(/\/(\d+)\/?$/);
        if (!sorteoMatch) return;
        const sorteo = parseInt(sorteoMatch[1]);

        const game = isRevancha ? 'Baloto Revancha' : 'Baloto';
        const inserted = db.insertResult(game, sorteo, fecha, numeros, superBalota);
        if (inserted) {
            if (isRevancha) revancha++;
            else baloto++;
        }
    });

    return { baloto, revancha };
}

// ────────────────────────────────────────────────────────────────
// MILOTO  (/miloto/resultados?page=N)
// ────────────────────────────────────────────────────────────────

async function scrapeMilotoPage(page) {
    const url = `${BASE}/miloto/resultados?page=${page}`;
    const html = await fetchPage(url);
    if (!html) return 0;

    const $ = cheerio.load(html);
    let count = 0;

    $('table.table-points-miloto tbody tr, table tbody tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        if (cells.length < 2) return;

        const fecha = $(cells[0]).text().trim();
        if (!fecha || !/\d{4}/.test(fecha)) return;

        const rawNums = $(cells[1]).html() || '';
        const numeros = parseNumbers(rawNums);
        if (numeros.length < 5) return;

        const href = $row.find('a').attr('href') || '';
        const sorteoMatch = href.match(/\/(\d+)\/?$/);
        if (!sorteoMatch) return;
        const sorteo = parseInt(sorteoMatch[1]);

        if (db.insertResult('Miloto', sorteo, fecha, numeros.slice(0, 5))) count++;
    });

    return count;
}

// ────────────────────────────────────────────────────────────────
// COLORLOTO  (/colorloto/resultados?page=N)
// ────────────────────────────────────────────────────────────────
// CSS class → color name
const CSS_COLOR_MAP = {
    'balota-yellow': 'amarillo',
    'balota-green':  'verde',
    'balota-white':  'blanco',
    'balota-black':  'negro',
    'balota-red':    'rojo',
    'balota-blue':   'azul',
};

async function scrapeColorlotoPage(page) {
    const url = `${BASE}/colorloto/resultados?page=${page}`;
    const html = await fetchPage(url);
    if (!html) return 0;

    const $ = cheerio.load(html);
    let count = 0;

    $('table tbody tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        if (cells.length < 2) return;

        const fecha = $(cells[0]).text().trim();
        if (!fecha || !/\d{4}/.test(fecha)) return;

        const pairs = [];
        $(cells[1]).find('.balota-bg').each((_, el) => {
            const classes = ($(el).attr('class') || '').split(/\s+/);
            const colorClass = classes.find(c => CSS_COLOR_MAP[c]);
            const number = parseInt($(el).text().trim());
            if (colorClass && !isNaN(number)) {
                pairs.push({ color: CSS_COLOR_MAP[colorClass], number });
            }
        });

        if (pairs.length < 6) return;

        const href = $row.find('a').attr('href') || '';
        const sorteoMatch = href.match(/\/(\d+)\/?$/);
        const sorteo = sorteoMatch ? parseInt(sorteoMatch[1]) : null;

        const numeros = pairs.map(p => `${p.color}-${p.number}`);
        if (db.insertResult('Colorloto', sorteo, fecha, numeros, null, pairs)) count++;
    });

    return count;
}

// ────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────

(async () => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📥 SCRAPING HISTÓRICO COMPLETO DESDE baloto.com');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ── Baloto + Revancha ──────────────────────────────────────
    console.log('1️⃣  Scrapeando Baloto + Revancha...');
    const maxBaloto = await getMaxPage(`${BASE}/resultados`);
    console.log(`   Páginas encontradas: ${maxBaloto}\n`);

    let totalBaloto = 0, totalRevancha = 0;
    for (let p = 1; p <= maxBaloto; p++) {
        const { baloto, revancha } = await scrapeBalotoPage(p);
        totalBaloto += baloto;
        totalRevancha += revancha;
        if (baloto + revancha > 0) process.stdout.write(`   Pág ${p}/${maxBaloto}: +${baloto} Baloto +${revancha} Revancha\n`);
        else process.stdout.write(`   Pág ${p}/${maxBaloto}: (sin nuevos)\r`);
        await sleep(DELAY_MS);
    }
    console.log(`\n   ✅ Baloto nuevos: ${totalBaloto}  |  Revancha nuevos: ${totalRevancha}\n`);

    // ── Miloto ────────────────────────────────────────────────
    console.log('2️⃣  Scrapeando Miloto...');
    const maxMiloto = await getMaxPage(`${BASE}/miloto/resultados`);
    console.log(`   Páginas encontradas: ${maxMiloto}\n`);

    let totalMiloto = 0;
    for (let p = 1; p <= maxMiloto; p++) {
        const n = await scrapeMilotoPage(p);
        totalMiloto += n;
        if (n > 0) process.stdout.write(`   Pág ${p}/${maxMiloto}: +${n} Miloto\n`);
        else process.stdout.write(`   Pág ${p}/${maxMiloto}: (sin nuevos)\r`);
        await sleep(DELAY_MS);
    }
    console.log(`\n   ✅ Miloto nuevos: ${totalMiloto}\n`);

    // ── Colorloto ─────────────────────────────────────────────
    console.log('3️⃣  Scrapeando Colorloto...');
    const maxColorloto = await getMaxPage(`${BASE}/colorloto/resultados`);
    console.log(`   Páginas encontradas: ${maxColorloto}\n`);

    let totalColorloto = 0;
    for (let p = 1; p <= maxColorloto; p++) {
        const n = await scrapeColorlotoPage(p);
        totalColorloto += n;
        if (n > 0) process.stdout.write(`   Pág ${p}/${maxColorloto}: +${n} Colorloto\n`);
        else process.stdout.write(`   Pág ${p}/${maxColorloto}: (sin nuevos)\r`);
        await sleep(DELAY_MS);
    }
    console.log(`\n   ✅ Colorloto nuevos: ${totalColorloto}\n`);

    // ── Resumen ───────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ESTADO FINAL DE LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   Baloto:          ${db.getTotalResults('Baloto')} registros`);
    console.log(`   Baloto Revancha: ${db.getTotalResults('Baloto Revancha')} registros`);
    console.log(`   Miloto:          ${db.getTotalResults('Miloto')} registros`);
    console.log(`   Colorloto:       ${db.getTotalResults('Colorloto')} registros`);
    console.log(`   ─────────────────────────────`);
    console.log(`   TOTAL:           ${db.getTotalResults()} registros\n`);

    const MIN = 20;
    ['Baloto','Miloto','Colorloto'].forEach(g => {
        const n = db.getTotalResults(g);
        console.log(`   ${n >= MIN ? '✅' : '⚠️ '} ${g}: ${n} sorteos${n < MIN ? ` (faltan ${MIN - n})` : ''}`);
    });

    db.closeDatabase();
    console.log('\n🎉 Scraping histórico completado.\n');
})();
