function sumOfBottomN(n) {
    return (n * (n + 1)) / 2;
}

function sumOfTopN(maxNumber, n) {
    let total = 0;
    for (let i = 0; i < n; i++) total += maxNumber - i;
    return total;
}

function scorePopularity(numbers, maxNumber) {
    const sorted = [...numbers].sort((a, b) => a - b);
    let score = 0;

    // 1) Todos los números caen en 1-31 (fechas de calendario/nacimiento)
    if (sorted.every(n => n <= 31)) score += 25;

    // 2) Secuencia aritmética (incluye escaleras y series como 2-4-6-8-10)
    const diffs = sorted.slice(1).map((n, i) => n - sorted[i]);
    const isArithmetic = diffs.length > 0 && diffs.every(d => d === diffs[0]);
    if (isArithmetic) score += 30;

    // 3) Todos consecutivos (caso más reconocible de secuencia aritmética)
    if (diffs.length > 0 && diffs.every(d => d === 1)) score += 15;

    // 4) Todo par o todo impar
    if (sorted.every(n => n % 2 === 0) || sorted.every(n => n % 2 === 1)) score += 15;

    // 5) Terminaciones idénticas en todos los números
    const endings = new Set(sorted.map(n => n % 10));
    if (endings.size === 1) score += 10;

    // 6) Múltiplos evidentes de 5
    if (sorted.every(n => n % 5 === 0)) score += 10;

    // 7) Suma muy baja frente al rango posible (sesgo hacia números bajos)
    const maxPossibleSum = sumOfTopN(maxNumber, sorted.length);
    const minPossibleSum = sumOfBottomN(sorted.length);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const normalizedSum = (sum - minPossibleSum) / (maxPossibleSum - minPossibleSum);
    if (normalizedSum < 0.2) score += 15;

    return Math.min(100, score);
}

module.exports = { scorePopularity, sumOfBottomN, sumOfTopN };
