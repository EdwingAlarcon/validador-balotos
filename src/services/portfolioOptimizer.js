// Generador congruencial lineal (Lehmer/Park-Miller) — determinístico, suficiente para
// muestreo sin necesidad de criptografía. No usar para nada sensible a seguridad.
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
};
