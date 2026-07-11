// Generador congruencial lineal (Lehmer/Park-Miller) — determinístico, suficiente para
// muestreo sin necesidad de criptografía. No usar para nada sensible a seguridad.
const db = require('./database');
const { scorePopularity, scoreColorlotoPopularity, COLOR_ORDER } = require('./popularityScorer');

function createSeededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function randomCombo(count, maxNumber, rng) {
    const set = new Set();
    while (set.size < count) {
        set.add(Math.floor(rng() * maxNumber) + 1);
    }
    return Array.from(set).sort((a, b) => a - b);
}

function comboKey(combo) {
    return combo.join('-');
}

function sharedCount(a, b) {
    const setB = new Set(b);
    return a.filter(n => setB.has(n)).length;
}

function hammingDistance(a, b) {
    return a.length + b.length - 2 * sharedCount(a, b);
}

function jaccardIndex(a, b) {
    const union = new Set([...a, ...b]);
    if (union.size === 0) return 0;
    return sharedCount(a, b) / union.size;
}

function marginalCoverage(existingCombos, candidate) {
    const covered = new Set(existingCombos.flat());
    return candidate.filter(n => !covered.has(n)).length;
}

function coverageOf(combos) {
    return Array.from(new Set(combos.flat())).sort((a, b) => a - b);
}

function averageRedundancy(combos) {
    let totalShared = 0;
    let pairs = 0;
    for (let i = 0; i < combos.length; i++) {
        for (let j = i + 1; j < combos.length; j++) {
            totalShared += sharedCount(combos[i], combos[j]);
            pairs++;
        }
    }
    return pairs === 0 ? 0 : totalShared / pairs;
}

function isParityBalanced(numbers) {
    const evens = numbers.filter(n => n % 2 === 0).length;
    const ratio = evens / numbers.length;
    return ratio >= 0.3 && ratio <= 0.7;
}

function isRangeBalanced(numbers, maxNumber) {
    const third = maxNumber / 3;
    const buckets = { low: 0, mid: 0, high: 0 };
    numbers.forEach(n => {
        if (n <= third) buckets.low++;
        else if (n <= third * 2) buckets.mid++;
        else buckets.high++;
    });
    const maxBucket = Math.max(buckets.low, buckets.mid, buckets.high);
    return maxBucket / numbers.length <= 0.6;
}

function pickWeighted(valuesWithWeights, rng) {
    const total = valuesWithWeights.reduce((sum, [, weight]) => sum + weight, 0);
    let r = rng() * total;
    for (const [value, weight] of valuesWithWeights) {
        r -= weight;
        if (r <= 0) return value;
    }
    return valuesWithWeights[valuesWithWeights.length - 1][0];
}

const MAX_CANDIDATE_ATTEMPTS = 500;

function generateCombo(strategy, count, maxNumber, rng, existingCombos) {
    let best = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < MAX_CANDIDATE_ATTEMPTS; attempt++) {
        const candidate = randomCombo(count, maxNumber, rng);
        const popularity = scorePopularity(candidate, maxNumber);

        if (strategy === 'B' && popularity > 20) continue;
        if (strategy === 'D' && popularity > 40) continue;
        if (strategy === 'A' && !isParityBalanced(candidate)) continue;

        const marginal = marginalCoverage(existingCombos, candidate);
        const rankScore = strategy === 'C' || strategy === 'D' ? marginal : 0;

        if (best === null || rankScore > bestScore) {
            best = candidate;
            bestScore = rankScore;
        }
        if (strategy === 'A' || strategy === 'B') break; // primer candidato que cumple es suficiente
    }
    return best || randomCombo(count, maxNumber, rng);
}

function attachSuperBalotas(portfolio, game, rng) {
    const { LOTTERY_RULES } = require('./lotteryRules');
    const rules = LOTTERY_RULES[game];
    if (!rules.superBalota) return portfolio; // Miloto no tiene superbalota
    const results = db.getAllResults(game, 1000);
    const freq = {};
    for (let n = rules.superBalota.min; n <= rules.superBalota.max; n++) freq[n] = 1; // suavizado Laplace
    results.forEach(r => {
        const sb = parseInt(r.superBalota, 10);
        if (sb >= rules.superBalota.min && sb <= rules.superBalota.max) freq[sb]++;
    });
    const weighted = Object.entries(freq).map(([n, w]) => [parseInt(n, 10), w]);
    portfolio.forEach(combo => {
        combo.superBalota = pickWeighted(weighted, rng);
    });
    return portfolio;
}

function buildNumericPortfolio(game, rules, seed = 42) {
    const rng = createSeededRandom(seed);
    const maxNumber = rules.mainNumbers.max;
    const count = rules.mainNumbers.count;
    const strategies = ['A', 'B', 'C', 'D'];
    const combosPerStrategy = 5;
    const seenKeys = new Set();
    const portfolio = [];

    strategies.forEach(strategy => {
        for (let i = 0; i < combosPerStrategy; i++) {
            const existing = portfolio.map(c => c.numbers);
            let combo;
            let tries = 0;
            do {
                combo = generateCombo(strategy, count, maxNumber, rng, existing);
                tries++;
            } while (seenKeys.has(comboKey(combo)) && tries < 50);
            seenKeys.add(comboKey(combo));
            portfolio.push({
                strategy,
                numbers: combo,
                popularityScore: scorePopularity(combo, maxNumber),
                marginalCoverageAtInsertion: marginalCoverage(existing, combo),
            });
        }
    });

    return attachSuperBalotas(portfolio, game, rng);
}

function randomColorloto(rng) {
    return COLOR_ORDER.map(color => ({ color, number: Math.floor(rng() * 7) + 1 }));
}

function colorlotoComboKey(pairs) {
    return pairs.map(p => `${p.color}:${p.number}`).join(',');
}

function marginalCoverageColorloto(existingPairsList, candidatePairs) {
    const coveredKeys = new Set(existingPairsList.flat().map(p => `${p.color}:${p.number}`));
    return candidatePairs.filter(p => !coveredKeys.has(`${p.color}:${p.number}`)).length;
}

function generateColorlotoCombo(strategy, rng, existingPairsList) {
    let best = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < MAX_CANDIDATE_ATTEMPTS; attempt++) {
        const candidate = randomColorloto(rng);
        const popularity = scoreColorlotoPopularity(candidate);

        if (strategy === 'B' && popularity > 20) continue;
        if (strategy === 'D' && popularity > 40) continue;
        if (strategy === 'A' && !isParityBalanced(candidate.map(p => p.number))) continue;

        const marginal = marginalCoverageColorloto(existingPairsList, candidate);
        const rankScore = strategy === 'C' || strategy === 'D' ? marginal : 0;

        if (best === null || rankScore > bestScore) {
            best = candidate;
            bestScore = rankScore;
        }
        if (strategy === 'A' || strategy === 'B') break;
    }
    return best || randomColorloto(rng);
}

function buildColorlotoPortfolio(seed = 42) {
    const rng = createSeededRandom(seed);
    const strategies = ['A', 'B', 'C', 'D'];
    const combosPerStrategy = 5;
    const seenKeys = new Set();
    const portfolio = [];

    strategies.forEach(strategy => {
        for (let i = 0; i < combosPerStrategy; i++) {
            const existing = portfolio.map(c => c.pairs);
            let combo;
            let tries = 0;
            do {
                combo = generateColorlotoCombo(strategy, rng, existing);
                tries++;
            } while (seenKeys.has(colorlotoComboKey(combo)) && tries < 50);
            seenKeys.add(colorlotoComboKey(combo));
            portfolio.push({
                strategy,
                pairs: combo,
                popularityScore: scoreColorlotoPopularity(combo),
                marginalCoverageAtInsertion: marginalCoverageColorloto(existing, combo),
            });
        }
    });

    return portfolio;
}

// Pesos: 0.30 popularidad baja + 0.25 cobertura marginal + 0.20 baja redundancia + 0.25 equilibrio
function strategicScore({
    popularityScore,
    marginalCoverage,
    maxMarginalCoverage,
    sharedWithOthersAvg,
    comboLength,
    parityBalanceOk,
    rangeBalanceOk,
}) {
    const popularityComponent = (100 - popularityScore) * 0.3;
    const coverageComponent = (maxMarginalCoverage > 0 ? marginalCoverage / maxMarginalCoverage : 0) * 100 * 0.25;
    const redundancyRatio = Math.min(100, (sharedWithOthersAvg / comboLength) * 100);
    const redundancyComponent = (100 - redundancyRatio) * 0.2;
    const balanceComponent = ((parityBalanceOk ? 50 : 0) + (rangeBalanceOk ? 50 : 0)) * 0.25;
    return Math.round(popularityComponent + coverageComponent + redundancyComponent + balanceComponent);
}

function annotatePortfolioScores(portfolio, isColorloto, maxNumber = 43) {
    const maxMarginal = Math.max(...portfolio.map(c => c.marginalCoverageAtInsertion), 1);
    portfolio.forEach((combo, idx) => {
        const numbers = isColorloto ? combo.pairs.map(p => p.number) : combo.numbers;
        const others = portfolio.filter((_, j) => j !== idx);

        let sharedValues;
        if (isColorloto) {
            sharedValues = others.map(o => {
                const oNumbers = o.pairs.map(p => p.number);
                return numbers.filter((n, i) => n === oNumbers[i]).length;
            });
        } else {
            sharedValues = others.map(o => sharedCount(numbers, o.numbers));
        }

        const sharedAvg = sharedValues.reduce((a, b) => a + b, 0) / sharedValues.length;
        combo.strategicScore = strategicScore({
            popularityScore: combo.popularityScore,
            marginalCoverage: combo.marginalCoverageAtInsertion,
            maxMarginalCoverage: maxMarginal,
            sharedWithOthersAvg: sharedAvg,
            comboLength: numbers.length,
            parityBalanceOk: isParityBalanced(numbers),
            rangeBalanceOk: isColorloto ? true : isRangeBalanced(numbers, maxNumber),
        });
        combo.maxSharedWithAnother = Math.max(...sharedValues);
    });
    return portfolio;
}

function budgetScenarios(price) {
    const scenarios = {
        basico: { apuestas: 5 },
        moderado: { apuestas: 12 },
        amplio: { apuestas: 20 },
    };
    Object.values(scenarios).forEach(scenario => {
        scenario.costoUnitario = price;
        scenario.costoTotal = price * scenario.apuestas;
    });
    return scenarios;
}

function randomControlPortfolio(count, comboLength, maxNumber, seed) {
    const rng = createSeededRandom(seed);
    const seen = new Set();
    const portfolio = [];
    while (portfolio.length < count) {
        const combo = randomCombo(comboLength, maxNumber, rng);
        const key = comboKey(combo);
        if (seen.has(key)) continue;
        seen.add(key);
        portfolio.push(combo);
    }
    return portfolio;
}

function comparePortfolios(optimizedCombos, controlCombos, maxNumber) {
    return {
        optimized: {
            coverage: coverageOf(optimizedCombos).length,
            coverageRatio: coverageOf(optimizedCombos).length / maxNumber,
            averageRedundancy: averageRedundancy(optimizedCombos),
        },
        control: {
            coverage: coverageOf(controlCombos).length,
            coverageRatio: coverageOf(controlCombos).length / maxNumber,
            averageRedundancy: averageRedundancy(controlCombos),
        },
    };
}

module.exports = {
    createSeededRandom,
    randomCombo,
    comboKey,
    sharedCount,
    hammingDistance,
    jaccardIndex,
    marginalCoverage,
    coverageOf,
    averageRedundancy,
    isParityBalanced,
    isRangeBalanced,
    pickWeighted,
    generateCombo,
    attachSuperBalotas,
    buildNumericPortfolio,
    randomColorloto,
    colorlotoComboKey,
    marginalCoverageColorloto,
    generateColorlotoCombo,
    buildColorlotoPortfolio,
    strategicScore,
    annotatePortfolioScores,
    budgetScenarios,
    randomControlPortfolio,
    comparePortfolios,
};
