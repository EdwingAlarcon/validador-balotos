const db = require('./database');

const MIN_SORTEOS_FOR_STATISTICS = 20;
const COLORS = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

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
    const results = db.getAllResults(game, 1000);
    const frequency = {};
    for (let i = 1; i <= 16; i++) frequency[i] = 0;
    results.forEach(result => {
        const sb = parseInt(result.superBalota);
        if (sb >= 1 && sb <= 16) frequency[sb]++;
    });
    return frequency;
}

// ========================================
// FRECUENCIA POR COLOR — Colorloto
// Cada color tiene su propia distribución de números (1–7).
// ========================================
function getColorlotoColorFrequency() {
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
    return colorFreq;
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
// • Cada color (6) elige su número (1–7) de forma independiente
// • Distribución histórica por color, no por par global
// ========================================
function generateIntelligentColorloto() {
    const totalSorteos = db.getTotalResults('Colorloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;
    const confidence = computeConfidence(totalSorteos);
    const pairs = [];

    if (useStatistics) {
        const colorFreq = getColorlotoColorFrequency();
        COLORS.forEach(color => {
            const nums = Object.keys(colorFreq[color]).map(Number);
            const weights = nums.map(n => Math.max(colorFreq[color][n], 1));
            const number = sampleAlias(buildAliasTable(nums, weights));
            pairs.push({ color, number });
        });
    } else {
        COLORS.forEach(color => {
            pairs.push({ color, number: Math.floor(Math.random() * 7) + 1 });
        });
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
    MIN_SORTEOS_FOR_STATISTICS,
};

