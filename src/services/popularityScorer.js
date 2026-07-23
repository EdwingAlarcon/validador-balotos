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

// Nota: Colorloto permite repetir color (con distinto número) o repetir
// número (con distinto color) — la única regla es no repetir la pareja
// color+número exacta (confirmado en baloto.com/colorloto: "Puedes jugar con
// colores repetidos, pero no con el mismo número. O puedes jugar con números
// repetidos, pero no con el mismo color."). Por eso esta función no asume un
// color fijo por posición.
function scoreColorlotoPopularity(pairs) {
    const numbers = pairs.map(p => p.number);
    let score = 0;

    // Todos los números iguales
    if (new Set(numbers).size === 1) score += 30;

    // Secuencia ascendente consecutiva en el orden en que se juega el
    // tiquete (patrón popular tipo 1-2-3-4-5-6, sin importar qué color se
    // asignó en cada posición)
    const isAscendingSequence = numbers.every((n, i) => i === 0 || n === numbers[i - 1] + 1);
    if (isAscendingSequence) score += 30;

    // Todos los números <=4 (sesgo hacia números bajos)
    if (numbers.every(n => n <= 4)) score += 20;

    // Todo par o todo impar
    if (numbers.every(n => n % 2 === 0) || numbers.every(n => n % 2 === 1)) score += 15;

    // Un mismo número repetido en al menos la mitad de las parejas
    const maxRepeat = Math.max(...Array.from(new Set(numbers)).map(n => numbers.filter(x => x === n).length));
    if (maxRepeat >= 3) score += 15;

    return Math.min(100, score);
}

module.exports = { scorePopularity, sumOfBottomN, sumOfTopN, scoreColorlotoPopularity };
