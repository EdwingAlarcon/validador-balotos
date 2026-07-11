function parseNumeros(result) {
    return result.numeros.split(',').map(n => parseInt(n.trim(), 10));
}

function computeFrequency(results, maxNumber) {
    const freq = {};
    for (let n = 1; n <= maxNumber; n++) freq[n] = 0;
    results.forEach(result => {
        parseNumeros(result).forEach(num => {
            if (num >= 1 && num <= maxNumber) freq[num]++;
        });
    });
    return freq;
}

function computeHotCold(frequency) {
    const entries = Object.entries(frequency).map(([number, count]) => ({ number: parseInt(number, 10), count }));
    const sorted = [...entries].sort((a, b) => b.count - a.count);
    return { hot: sorted.slice(0, 10), cold: sorted.slice(-10).reverse() };
}

// results debe venir ordenado por sorteo DESC (más reciente primero), como retorna db.getAllResults
function computeGapsSinceLastAppearance(results, maxNumber) {
    const gaps = {};
    for (let n = 1; n <= maxNumber; n++) gaps[n] = null;
    results.forEach((result, index) => {
        parseNumeros(result).forEach(num => {
            if (num >= 1 && num <= maxNumber && gaps[num] === null) {
                gaps[num] = index;
            }
        });
    });
    return gaps;
}

module.exports = {
    parseNumeros,
    computeFrequency,
    computeHotCold,
    computeGapsSinceLastAppearance,
};
