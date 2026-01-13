const db = require('./database');

/**
 * Servicio de estadísticas y generación inteligente de números
 */

const MIN_SORTEOS_FOR_STATISTICS = 20;

/**
 * Obtiene estadísticas de frecuencia de números
 */
function getNumberFrequency(game, limit = 1000) {
    const results = db.getAllResults(game, limit);
    const frequency = {};
    let maxNumber = 43; // Por defecto Baloto

    if (game === 'Miloto') maxNumber = 39;

    // Inicializar frecuencias
    for (let i = 1; i <= maxNumber; i++) {
        frequency[i] = 0;
    }

    // Contar apariciones
    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= maxNumber) {
                frequency[num]++;
            }
        });
    });

    return frequency;
}

/**
 * Obtiene estadísticas de súper balota
 */
function getSuperBalotaFrequency(game = 'Baloto') {
    const results = db.getAllResults(game, 1000);
    const frequency = {};

    for (let i = 1; i <= 16; i++) {
        frequency[i] = 0;
    }

    results.forEach(result => {
        const sb = parseInt(result.superBalota);
        if (sb >= 1 && sb <= 16) {
            frequency[sb]++;
        }
    });

    return frequency;
}

/**
 * Obtiene estadísticas de pares color-número para Colorloto
 */
function getColorlotoPairFrequency() {
    const results = db.getAllResults('Colorloto', 1000);
    const pairFrequency = {};

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
            const pairKey = `${color}-${num}`;
            pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        });
    });

    return pairFrequency;
}

/**
 * Genera números usando distribución ponderada por frecuencia
 */
function generateWeightedNumbers(frequency, count, max) {
    const weightedPool = [];

    for (let num = 1; num <= max; num++) {
        const weight = frequency[num] || 1;
        for (let i = 0; i < weight; i++) {
            weightedPool.push(num);
        }
    }

    const selected = [];
    const poolCopy = [...weightedPool];

    while (selected.length < count && poolCopy.length > 0) {
        const randomIndex = Math.floor(Math.random() * poolCopy.length);
        const num = poolCopy[randomIndex];

        if (!selected.includes(num)) {
            selected.push(num);
        }

        poolCopy.splice(randomIndex, 1);
    }

    return selected.sort((a, b) => a - b);
}

/**
 * Genera súper balota ponderada
 */
function generateWeightedSuperBalota(frequency) {
    const weightedPool = [];

    for (let num = 1; num <= 16; num++) {
        const weight = frequency[num] || 1;
        for (let i = 0; i < weight; i++) {
            weightedPool.push(num);
        }
    }

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
}

/**
 * Genera números aleatorios puros (sin estadísticas)
 */
function generateRandomNumbers(count, max) {
    const numbers = [];
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * max) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers.sort((a, b) => a - b);
}

/**
 * GENERADOR INTELIGENTE DE BALOTO
 * Usa estadísticas si hay datos suficientes, aleatorio si no
 */
function generateIntelligentBaloto() {
    const totalSorteos = db.getTotalResults('Baloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;

    let numbers, superBalota;

    if (useStatistics) {
        // Usar estadísticas
        const frequency = getNumberFrequency('Baloto');
        const sbFrequency = getSuperBalotaFrequency('Baloto');

        numbers = generateWeightedNumbers(frequency, 5, 43);
        superBalota = generateWeightedSuperBalota(sbFrequency);
    } else {
        // Usar aleatorio puro
        numbers = generateRandomNumbers(5, 43);
        superBalota = Math.floor(Math.random() * 16) + 1;
    }

    return {
        numbers,
        superBalota,
        method: useStatistics ? 'statistical' : 'random',
        totalSorteos,
    };
}

/**
 * GENERADOR INTELIGENTE DE MILOTO
 */
function generateIntelligentMiloto() {
    const totalSorteos = db.getTotalResults('Miloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;

    let numbers;

    if (useStatistics) {
        const frequency = getNumberFrequency('Miloto');
        numbers = generateWeightedNumbers(frequency, 5, 39);
    } else {
        numbers = generateRandomNumbers(5, 39);
    }

    return {
        numbers,
        method: useStatistics ? 'statistical' : 'random',
        totalSorteos,
    };
}

/**
 * GENERADOR INTELIGENTE DE COLORLOTO
 */
function generateIntelligentColorloto() {
    const totalSorteos = db.getTotalResults('Colorloto');
    const useStatistics = totalSorteos >= MIN_SORTEOS_FOR_STATISTICS;

    const colors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
    let pairs = [];

    if (useStatistics) {
        // Usar frecuencias de pares
        const pairFrequency = getColorlotoPairFrequency();
        const weightedPool = [];

        colors.forEach(color => {
            for (let num = 1; num <= 7; num++) {
                const pairKey = `${color}-${num}`;
                const weight = pairFrequency[pairKey] || 1;

                for (let w = 0; w < weight; w++) {
                    weightedPool.push({ color, number: num });
                }
            }
        });

        const poolCopy = [...weightedPool];
        while (pairs.length < 6 && poolCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            const pair = poolCopy[randomIndex];
            const pairKey = `${pair.color}-${pair.number}`;

            if (!pairs.some(p => `${p.color}-${p.number}` === pairKey)) {
                pairs.push(pair);
            }

            poolCopy.splice(randomIndex, 1);
        }
    } else {
        // Aleatorio puro
        while (pairs.length < 6) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const number = Math.floor(Math.random() * 7) + 1;
            const pairKey = `${color}-${number}`;

            if (!pairs.some(p => `${p.color}-${p.number}` === pairKey)) {
                pairs.push({ color, number });
            }
        }
    }

    // Ordenar por color
    const colorOrder = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
    pairs.sort((a, b) => colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color));

    return {
        pairs,
        method: useStatistics ? 'statistical' : 'random',
        totalSorteos,
    };
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
