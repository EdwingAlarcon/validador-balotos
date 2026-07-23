const db = require('./database');

const MIN_SORTEOS_FOR_STATISTICS = 20;
const COLORS = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

// ========================================
// CACHÉ DE FRECUENCIAS — TTL 5 minutos
// Evita re-escanear cientos de sorteos en cada generación
// ========================================
const _freqCache = new Map();
const FREQ_CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedFreq(key) {
    const entry = _freqCache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    return null;
}

function setCachedFreq(key, data) {
    _freqCache.set(key, { data, expiresAt: Date.now() + FREQ_CACHE_TTL_MS });
}

// ========================================
// WALKER'S ALIAS METHOD — O(n) setup, O(1) draw
// Elimina el array inflado proporcional a frecuencias
// ========================================
function buildAliasTable(values, weights) {
    const n = values.length;
    const total = weights.reduce((a, b) => a + b, 0);
    const prob = weights.map(w => (w * n) / total);
    const alias = new Array(n).fill(0);
    const small = [], large = [];
    prob.forEach((p, i) => (p < 1 ? small : large).push(i));
    while (small.length && large.length) {
        const l = small.pop();
        const g = large.pop();
        alias[l] = g;
        prob[g] = prob[g] + prob[l] - 1;
        (prob[g] < 1 ? small : large).push(g);
    }
    [...small, ...large].forEach(i => (prob[i] = 1));
    return { values, prob, alias };
}

function sampleAlias(table) {
    const i = Math.floor(Math.random() * table.prob.length);
    return table.values[Math.random() < table.prob[i] ? i : table.alias[i]];
}

// ========================================
// CONFIANZA ESTADÍSTICA (0–85%)
// A mayor historial, mayor confianza. Nunca 100%: la lotería es aleatoria.
// ========================================
function computeConfidence(totalSorteos) {
    if (totalSorteos < MIN_SORTEOS_FOR_STATISTICS) return 0;
    if (totalSorteos < 50) return 30;
    if (totalSorteos < 100) return 50;
    if (totalSorteos < 200) return 65;
    if (totalSorteos < 500) return 75;
    return 85;
}

// ========================================
// FRECUENCIA POR POSICIÓN (Baloto / Miloto)
// Los números históricos se guardan ordenados ASC, por lo que
// posición 0 = bola menor, posición 4 = bola mayor.
// Cada posición tiene su propia distribución.
// ========================================
function getPositionFrequency(game, maxNumber) {
    const cacheKey = `pos:${game}:${maxNumber}`;
    const cached = getCachedFreq(cacheKey);
    if (cached) return cached;

    const results = db.getAllResults(game, 1000);
    const positions = Array.from({ length: 5 }, () => {
        const freq = {};
        for (let n = 1; n <= maxNumber; n++) freq[n] = 0;
        return freq;
    });
    results.forEach(result => {
        result.numeros
            .split(',')
            .map(n => parseInt(n.trim()))
            .sort((a, b) => a - b)
            .forEach((num, pos) => {
                if (pos < 5 && num >= 1 && num <= maxNumber) positions[pos][num]++;
            });
    });
    setCachedFreq(cacheKey, positions);
    return positions;
}

// ========================================
// FRECUENCIA GLOBAL — usada por /api/statistics y endpoint legacy
// ========================================
function getNumberFrequency(game, limit = 1000) {
    const results = db.getAllResults(game, limit);
    const maxNumber = game === 'Miloto' ? 39 : 43;
    const frequency = {};
    for (let i = 1; i <= maxNumber; i++) frequency[i] = 0;
    results.forEach(result => {
        result.numeros
            .split(',')
            .map(n => parseInt(n.trim()))
            .forEach(num => {
                if (num >= 1 && num <= maxNumber) frequency[num]++;
            });
    });
    return frequency;
}

// ========================================
// FRECUENCIA SÚPER BALOTA
// ========================================
function getSuperBalotaFrequency(game = 'Baloto') {
    const cacheKey = `sb:${game}`;
    const cached = getCachedFreq(cacheKey);
    if (cached) return cached;

    const results = db.getAllResults(game, 1000);
    const frequency = {};
    for (let i = 1; i <= 16; i++) frequency[i] = 0;
    results.forEach(result => {
        const sb = parseInt(result.superBalota);
        if (sb >= 1 && sb <= 16) frequency[sb]++;
    });
    setCachedFreq(cacheKey, frequency);
    return frequency;
}

// ========================================
// FRECUENCIA POR COLOR — Colorloto
// Cada color tiene su propia distribución de números (1–7).
// ========================================
function getColorlotoColorFrequency() {
    const cacheKey = 'colorloto:colorfreq';
    const cached = getCachedFreq(cacheKey);
    if (cached) return cached;

    const results = db.getAllResults('Colorloto', 1000);
    const colorFreq = {};
    COLORS.forEach(c => {
        colorFreq[c] = {};
        for (let n = 1; n <= 7; n++) colorFreq[c][n] = 0;
    });
    results.forEach(result => {
        let pairs = [];
        try {
            pairs = result.colorNumberPairs ? JSON.parse(result.colorNumberPairs) : [];
        } catch (e) {
            pairs = [];
        }
        pairs.forEach(pair => {
            const color = typeof pair === 'string' ? pair.split('-')[0] : pair.color;
            const num = typeof pair === 'string' ? parseInt(pair.split('-')[1]) : parseInt(pair.number);
            if (colorFreq[color] && num >= 1 && num <= 7) colorFreq[color][num]++;
        });
    });
    setCachedFreq(cacheKey, colorFreq);
    return colorFreq;
}

// ========================================
// COBERTURA DE COLORES — Colorloto
// El tiquete siempre cubre los 6 colores distintos (uno c/u, sin repetir —
// así es la mecánica oficial). El sorteo, en cambio, son 6 bolas
// independientes que pueden repetir o saltarse colores. Esto limita en la
// práctica qué categorías de premio son alcanzables en cada sorteo real,
// sin importar qué números se hayan elegido.
// ========================================
function getColorlotoCoverageStats() {
    const cacheKey = 'colorloto:coverage';
    const cached = getCachedFreq(cacheKey);
    if (cached) return cached;

    const results = db.getAllResults('Colorloto', 1000);
    const total = results.length;
    const distribucionColoresDistintos = {};
    const ausencias = {};
    COLORS.forEach(c => (ausencias[c] = 0));

    results.forEach(result => {
        let pairs = [];
        try {
            pairs = result.colorNumberPairs ? JSON.parse(result.colorNumberPairs) : [];
        } catch (e) {
            pairs = [];
        }
        const presentes = new Set(pairs.map(p => (typeof p === 'string' ? p.split('-')[0] : p.color)));
        const distinct = presentes.size;
        distribucionColoresDistintos[distinct] = (distribucionColoresDistintos[distinct] || 0) + 1;
        COLORS.forEach(c => {
            if (!presentes.has(c)) ausencias[c]++;
        });
    });

    const pct = n => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

    const stats = {
        sorteosAnalizados: total,
        pctSeisColoresDistintos: pct(distribucionColoresDistintos[6] || 0),
        distribucionColoresDistintos,
        porColor: COLORS.map(color => ({
            color,
            vecesAusente: ausencias[color],
            pctAusente: pct(ausencias[color]),
        })),
    };
    setCachedFreq(cacheKey, stats);
    return stats;
}

// Mantener compatibilidad con endpoint legacy
function getColorlotoPairFrequency() {
    const colorFreq = getColorlotoColorFrequency();
    const pairFrequency = {};
    COLORS.forEach(c => {
        for (let n = 1; n <= 7; n++) pairFrequency[`${c}-${n}`] = colorFreq[c][n];
    });
    return pairFrequency;
}

// ========================================
// SORTEO CON CONCIENCIA DE POSICIÓN
// Cada posición usa su propia tabla alias. Garantiza sin repetidos.
// ========================================
function drawPositionAware(positionFreqs, count, maxNumber) {
    const tables = positionFreqs.map(freq => {
        const values = Object.keys(freq).map(Number);
        const weights = values.map(v => Math.max(freq[v], 1));
        return buildAliasTable(values, weights);
    });

    const selected = [];
    for (let pos = 0; pos < count; pos++) {
        let num;
        let attempts = 0;
        do {
            num = sampleAlias(tables[pos]);
            attempts++;
        } while (selected.includes(num) && attempts < 200);
        // Fallback: tomar el primer número libre si hubo colisión persistente
        if (selected.includes(num)) {
            for (let n = 1; n <= maxNumber; n++) {
                if (!selected.includes(n)) { num = n; break; }
            }
        }
        selected.push(num);
    }
    return selected.sort((a, b) => a - b);
}

// ========================================
// SORTEO SUPER BALOTA CON ALIAS
// ========================================
function drawSuperBalota(frequency) {
    const values = Object.keys(frequency).map(Number);
    const weights = values.map(v => Math.max(frequency[v], 1));
    return sampleAlias(buildAliasTable(values, weights));
}

// ========================================
// FALLBACK ALEATORIO PURO
// ========================================
function generateRandomNumbers(count, max) {
    const numbers = [];
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * max) + 1;
        if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers.sort((a, b) => a - b);
}

// ========================================
// GENERADOR INTELIGENTE DE BALOTO
// • 5 bolas con frecuencia por posición histórica
// • Súper Balota con su propia distribución
// ========================================
function generateIntelligentBaloto() {
    const totalSorteos = db.getTotalResults('Baloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;
    const confidence = computeConfidence(totalSorteos);

    let numbers, superBalota;
    if (useStatistics) {
        const posFreqs = getPositionFrequency('Baloto', 43);
        const sbFrequency = getSuperBalotaFrequency('Baloto');
        numbers = drawPositionAware(posFreqs, 5, 43);
        superBalota = drawSuperBalota(sbFrequency);
    } else {
        numbers = generateRandomNumbers(5, 43);
        superBalota = Math.floor(Math.random() * 16) + 1;
    }

    return { numbers, superBalota, method: useStatistics ? 'statistical' : 'random', totalSorteos, confidence };
}

// ========================================
// GENERADOR INTELIGENTE DE MILOTO
// • 5 bolas (1–39) con frecuencia por posición
// ========================================
function generateIntelligentMiloto() {
    const totalSorteos = db.getTotalResults('Miloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;
    const confidence = computeConfidence(totalSorteos);

    let numbers;
    if (useStatistics) {
        const posFreqs = getPositionFrequency('Miloto', 39);
        numbers = drawPositionAware(posFreqs, 5, 39);
    } else {
        numbers = generateRandomNumbers(5, 39);
    }

    return { numbers, method: useStatistics ? 'statistical' : 'random', totalSorteos, confidence };
}

// ========================================
// GENERADOR INTELIGENTE DE COLORLOTO
// • 6 parejas (color, número) muestreadas de la frecuencia histórica real de
//   cada combinación color+número.
// • El color SÍ puede repetirse (con distinto número) y el número SÍ puede
//   repetirse (con distinto color) — así es la mecánica real del juego
//   (confirmado en baloto.com/colorloto) y así es como salen los sorteos:
//   casi nunca cubren los 6 colores distintos. Solo se evita repetir la
//   pareja color+número exacta dos veces en el mismo tiquete.
// ========================================
function generateIntelligentColorloto() {
    const totalSorteos = db.getTotalResults('Colorloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;
    const confidence = computeConfidence(totalSorteos);
    const pairs = [];
    const seen = new Set();

    if (useStatistics) {
        const pairFreq = getColorlotoPairFrequency(); // { "amarillo-1": count, ... } — 42 combinaciones
        const keys = Object.keys(pairFreq);
        const weights = keys.map(k => Math.max(pairFreq[k], 1));
        const table = buildAliasTable(keys, weights);

        let attempts = 0;
        while (pairs.length < 6 && attempts < 500) {
            attempts++;
            const key = sampleAlias(table);
            if (seen.has(key)) continue;
            seen.add(key);
            const separatorIndex = key.lastIndexOf('-');
            pairs.push({ color: key.slice(0, separatorIndex), number: parseInt(key.slice(separatorIndex + 1), 10) });
        }
    } else {
        let attempts = 0;
        while (pairs.length < 6 && attempts < 500) {
            attempts++;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const number = Math.floor(Math.random() * 7) + 1;
            const key = `${color}-${number}`;
            if (seen.has(key)) continue;
            seen.add(key);
            pairs.push({ color, number });
        }
    }

    return { pairs, method: useStatistics ? 'statistical' : 'random', totalSorteos, confidence };
}

module.exports = {
    generateIntelligentBaloto,
    generateIntelligentMiloto,
    generateIntelligentColorloto,
    getNumberFrequency,
    getSuperBalotaFrequency,
    getColorlotoPairFrequency,
    getColorlotoCoverageStats,
    MIN_SORTEOS_FOR_STATISTICS,
};

