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

function computeParityDistribution(results) {
    let even = 0;
    let odd = 0;
    results.forEach(result => {
        parseNumeros(result).forEach(num => {
            if (num % 2 === 0) even++;
            else odd++;
        });
    });
    const total = even + odd;
    return { even, odd, evenRatio: total ? even / total : 0, oddRatio: total ? odd / total : 0 };
}

function computeRangeDistribution(results, maxNumber) {
    const third = maxNumber / 3;
    const dist = { low: 0, mid: 0, high: 0 };
    results.forEach(result => {
        parseNumeros(result).forEach(num => {
            if (num <= third) dist.low++;
            else if (num <= third * 2) dist.mid++;
            else dist.high++;
        });
    });
    return dist;
}

function computeSumStats(results) {
    const sums = results.map(result => parseNumeros(result).reduce((a, b) => a + b, 0));
    const n = sums.length;
    if (n === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, sampleSize: 0 };
    const mean = sums.reduce((a, b) => a + b, 0) / n;
    const sorted = [...sums].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
    const variance = sums.reduce((acc, s) => acc + (s - mean) ** 2, 0) / n;
    return { mean, median, stdDev: Math.sqrt(variance), min: sorted[0], max: sorted[n - 1], sampleSize: n };
}

function countConsecutivePairs(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    let count = 0;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) count++;
    }
    return count;
}

function averageConsecutivePairs(results) {
    if (results.length === 0) return 0;
    const total = results.reduce((acc, result) => acc + countConsecutivePairs(parseNumeros(result)), 0);
    return total / results.length;
}

function computeEndingDigitFrequency(results) {
    const freq = {};
    for (let d = 0; d <= 9; d++) freq[d] = 0;
    results.forEach(result => {
        parseNumeros(result).forEach(num => {
            freq[num % 10]++;
        });
    });
    return freq;
}

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function countPrimesInResults(results) {
    let count = 0;
    results.forEach(result => {
        parseNumeros(result).forEach(num => {
            if (isPrime(num)) count++;
        });
    });
    return count;
}

module.exports = {
    parseNumeros,
    computeFrequency,
    computeHotCold,
    computeGapsSinceLastAppearance,
    computeParityDistribution,
    computeRangeDistribution,
    computeSumStats,
    countConsecutivePairs,
    averageConsecutivePairs,
    computeEndingDigitFrequency,
    isPrime,
    countPrimesInResults,
};
