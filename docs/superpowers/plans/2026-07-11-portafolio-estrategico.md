# Portafolio Estratégico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un endpoint `GET /api/portfolio` y una pestaña "Portafolio Estratégico" que generan, para Baloto, Baloto Revancha, Miloto y Colorloto, un reporte con 20 combinaciones por juego (4 estrategias × 5), estadística descriptiva real, popularidad estimada, puntaje estratégico, escenarios de presupuesto y comparación contra un portafolio aleatorio de control — todo calculado en JS de forma determinística contra `data/historical.db`, sin llamadas a IA en runtime.

**Architecture:** Cinco módulos nuevos en `src/services/` (`lotteryRules.js`, `statisticsEngine.js`, `popularityScorer.js`, `portfolioOptimizer.js`, `reportBuilder.js`), un endpoint nuevo en `src/server.js`, y una pestaña nueva en el frontend (`public/index.html` + `public/js/app.js`) que consume ese endpoint. El generador rápido existente (`intelligentGenerator.js`) no se modifica.

**Tech Stack:** Node.js/Express, better-sqlite3 (ya en uso), sin dependencias nuevas. PRNG determinístico (LCG) y pruebas estadísticas (chi-cuadrado, rachas) implementadas a mano en JS puro. Tests con el módulo `assert` nativo de Node (el repo no usa Jest/Mocha; sigue el patrón de script plano de `tests/test-endpoints.js`).

## Global Constraints

- Reglas y precios verificados en baloto.com el 2026-07-11 (ver tabla abajo); no inventar rangos ni precios.
- Baloto Revancha usa los MISMOS 5 números y la MISMA Superbalota del tiquete de Baloto — no generar combinaciones independientes para Revancha.
- Sin llamadas a modelos de IA en runtime; todo el reporte se calcula en código.
- Declarar explícitamente en el reporte las pruebas/técnicas NO implementadas (autocorrelación, corrección por comparaciones múltiples, Monte Carlo real, algoritmos genéticos, ML) — no simular que se ejecutaron.
- Estilo de código: 4 espacios, comillas simples, 120 caracteres de ancho, comas finales en posiciones ES5, LF (`.prettierrc.js`).
- Respuestas de API siguen el patrón existente `{ success: true, ... }` / `{ success: false, error }` con status 500 en catch (ver `src/server.js`).
- No modificar `intelligentGenerator.js` ni los endpoints `/api/generate/*` existentes.

Tabla de reglas verificadas (fuente: baloto.com/como-jugar, baloto.com, dataifx.com — 2026-07-11):

| Juego | Números | Superbalota | Precio | Días |
|---|---|---|---|---|
| Baloto | 5 de 1–43 | 1 de 1–16 | $6.000 | Lun/Mié/Sáb |
| Baloto Revancha | mismos números y superbalota de Baloto | comparte la de Baloto | +$3.000 add-on | mismo sorteo, tabla independiente |
| Miloto | 5 de 1–39 | no aplica | $4.000 | Lun/Mar/Jue/Vie |
| Colorloto | 6 pares color-número (1–7) | no aplica | $5.000 | Lun/Jue |

---

### Task 1: `lotteryRules.js` — reglas y precios verificados

**Files:**
- Create: `src/services/lotteryRules.js`
- Test: `tests/unit/test-lotteryRules.js`

**Interfaces:**
- Produces: `LOTTERY_RULES` (objeto), `VERIFIED_AT` (string `'2026-07-11'`), `SOURCES` (array de `{title, url}`)

- [ ] **Step 1: Escribir el módulo**

```js
// src/services/lotteryRules.js
const VERIFIED_AT = '2026-07-11';

const SOURCES = [
    { title: 'Baloto - Cómo jugar', url: 'https://baloto.com/como-jugar' },
    { title: 'Baloto - Inicio', url: 'https://baloto.com/' },
    {
        title: 'Baloto anuncia modificaciones en precio, frecuencia de sorteos y acumulados',
        url: 'https://www.dataifx.com/post/baloto-anuncia-modificaciones-en-precio-frecuencia-de-sorteos-y-acumulados',
    },
];

const LOTTERY_RULES = {
    Baloto: {
        mainNumbers: { count: 5, min: 1, max: 43 },
        superBalota: { min: 1, max: 16 },
        price: 6000,
        drawDays: ['Lunes', 'Miércoles', 'Sábado'],
    },
    'Baloto Revancha': {
        mainNumbers: { count: 5, min: 1, max: 43 },
        superBalota: { min: 1, max: 16 },
        price: 3000,
        sharesNumbersWith: 'Baloto',
        drawDays: ['Lunes', 'Miércoles', 'Sábado'],
    },
    Miloto: {
        mainNumbers: { count: 5, min: 1, max: 39 },
        superBalota: null,
        price: 4000,
        drawDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'],
    },
    Colorloto: {
        colors: ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'],
        numberRange: { min: 1, max: 7 },
        price: 5000,
        drawDays: ['Lunes', 'Jueves'],
    },
};

module.exports = { LOTTERY_RULES, VERIFIED_AT, SOURCES };
```

- [ ] **Step 2: Escribir el test**

```js
// tests/unit/test-lotteryRules.js
const assert = require('assert');
const { LOTTERY_RULES, VERIFIED_AT, SOURCES } = require('../../src/services/lotteryRules');

assert.strictEqual(LOTTERY_RULES.Baloto.mainNumbers.max, 43);
assert.strictEqual(LOTTERY_RULES.Baloto.superBalota.max, 16);
assert.strictEqual(LOTTERY_RULES['Baloto Revancha'].sharesNumbersWith, 'Baloto');
assert.strictEqual(LOTTERY_RULES.Miloto.superBalota, null);
assert.strictEqual(LOTTERY_RULES.Colorloto.colors.length, 6);
assert.strictEqual(VERIFIED_AT, '2026-07-11');
assert.ok(SOURCES.length >= 1);

console.log('test-lotteryRules: OK');
```

- [ ] **Step 3: Ejecutar el test**

Run: `node tests/unit/test-lotteryRules.js`
Expected: imprime `test-lotteryRules: OK` sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/services/lotteryRules.js tests/unit/test-lotteryRules.js
git commit -m "feat: agregar reglas y precios verificados de loterías Colombia"
```

---

### Task 2: `statisticsEngine.js` — frecuencia, calientes/fríos, brechas

**Files:**
- Create: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-frequency.js`

**Interfaces:**
- Consumes: filas de `db.getAllResults(game, limit)` con forma `{ numeros: 'n1,n2,...', ... }`, ordenadas por `sorteo DESC` (más reciente primero) — ver `src/services/database.js:81-95`.
- Produces: `computeFrequency(results, maxNumber)` → `{ [numero]: count }`; `computeHotCold(frequency)` → `{ hot: [{number,count}], cold: [{number,count}] }`; `computeGapsSinceLastAppearance(results, maxNumber)` → `{ [numero]: sorteosDesdeUltimaAparicion|null }`.

- [ ] **Step 1: Escribir el test (falla primero)**

```js
// tests/unit/test-statisticsEngine-frequency.js
const assert = require('assert');
const { computeFrequency, computeHotCold, computeGapsSinceLastAppearance } = require('../../src/services/statisticsEngine');

const results = [
    { numeros: '1,2,3,4,5' },  // más reciente (índice 0)
    { numeros: '1,10,20,30,40' },
    { numeros: '6,7,8,9,10' },
];

const freq = computeFrequency(results, 43);
assert.strictEqual(freq[1], 2);
assert.strictEqual(freq[10], 2);
assert.strictEqual(freq[43], 0);

const { hot, cold } = computeHotCold(freq);
assert.strictEqual(hot[0].count, 2);
assert.ok(cold[cold.length - 1].count <= hot[0].count);

const gaps = computeGapsSinceLastAppearance(results, 43);
assert.strictEqual(gaps[1], 0); // salió en el sorteo más reciente (índice 0)
assert.strictEqual(gaps[6], 2); // solo aparece en el 3er sorteo (índice 2)
assert.strictEqual(gaps[43], null); // nunca apareció

console.log('test-statisticsEngine-frequency: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-frequency.js`
Expected: FAIL — `Cannot find module '../../src/services/statisticsEngine'`

- [ ] **Step 3: Implementar**

```js
// src/services/statisticsEngine.js
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
```

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-frequency.js`
Expected: imprime `test-statisticsEngine-frequency: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-frequency.js
git commit -m "feat: frecuencia, calientes/fríos y brechas en statisticsEngine"
```

---

### Task 3: `statisticsEngine.js` — paridad, rango bajo/medio/alto, suma

**Files:**
- Modify: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-distribution.js`

**Interfaces:**
- Consumes: `parseNumeros(result)` de Task 2.
- Produces: `computeParityDistribution(results)` → `{ even, odd, evenRatio, oddRatio }`; `computeRangeDistribution(results, maxNumber)` → `{ low, mid, high }`; `computeSumStats(results)` → `{ mean, median, stdDev, min, max, sampleSize }`.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-statisticsEngine-distribution.js
const assert = require('assert');
const { computeParityDistribution, computeRangeDistribution, computeSumStats } = require('../../src/services/statisticsEngine');

const results = [
    { numeros: '1,2,3,4,5' },   // suma 15
    { numeros: '10,20,30,40,43' }, // suma 143
];

const parity = computeParityDistribution(results);
assert.strictEqual(parity.even + parity.odd, 10);
assert.strictEqual(parity.even, 6); // pares: 2,4,10,20,30,40 = 6; impares: 1,3,5,43 = 4
assert.strictEqual(parity.odd, 4);

const range = computeRangeDistribution(results, 43);
assert.strictEqual(range.low + range.mid + range.high, 10);

const sumStats = computeSumStats(results);
assert.strictEqual(sumStats.mean, 79);
assert.strictEqual(sumStats.min, 15);
assert.strictEqual(sumStats.max, 143);
assert.strictEqual(sumStats.sampleSize, 2);

console.log('test-statisticsEngine-distribution: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-distribution.js`
Expected: FAIL — las funciones no existen todavía.

- [ ] **Step 3: Implementar (agregar al final de `statisticsEngine.js`, antes del `module.exports`)**

```js
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
```

Y actualizar el `module.exports` para incluir `computeParityDistribution, computeRangeDistribution, computeSumStats`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-distribution.js`
Expected: imprime `test-statisticsEngine-distribution: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-distribution.js
git commit -m "feat: paridad, distribución de rango y estadísticas de suma"
```

---

### Task 4: `statisticsEngine.js` — consecutivos, terminaciones, primos

**Files:**
- Modify: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-patterns.js`

**Interfaces:**
- Produces: `countConsecutivePairs(numbers)` → int; `averageConsecutivePairs(results)` → float; `computeEndingDigitFrequency(results)` → `{0..9: count}`; `isPrime(n)` → bool; `countPrimesInResults(results)` → int.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-statisticsEngine-patterns.js
const assert = require('assert');
const {
    countConsecutivePairs,
    averageConsecutivePairs,
    computeEndingDigitFrequency,
    isPrime,
    countPrimesInResults,
} = require('../../src/services/statisticsEngine');

assert.strictEqual(countConsecutivePairs([1, 2, 3, 10, 20]), 2); // (1,2) y (2,3)
assert.strictEqual(countConsecutivePairs([1, 5, 10, 15, 20]), 0);

const results = [{ numeros: '1,2,3,10,20' }, { numeros: '5,10,15,20,25' }];
assert.strictEqual(averageConsecutivePairs(results), 1); // (2 + 0) / 2

const endings = computeEndingDigitFrequency(results);
// array1 [1,2,3,10,20] -> terminaciones 1,2,3,0,0 ; array2 [5,10,15,20,25] -> terminaciones 5,0,5,0,5
assert.strictEqual(endings[0], 4); // 10,20 (array1) + 10,20 (array2) = 4
assert.strictEqual(endings[5], 3); // 5,15,25 (array2)

assert.strictEqual(isPrime(2), true);
assert.strictEqual(isPrime(1), false);
assert.strictEqual(isPrime(43), true);
assert.strictEqual(countPrimesInResults(results), 3); // 2,3,5 -> primos entre 1,2,3,10,20,5,10,15,20,25

console.log('test-statisticsEngine-patterns: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-patterns.js`
Expected: FAIL — funciones no definidas.

- [ ] **Step 3: Implementar (agregar antes de `module.exports`)**

```js
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
```

Actualizar `module.exports` agregando estas cinco funciones.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-patterns.js`
Expected: imprime `test-statisticsEngine-patterns: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-patterns.js
git commit -m "feat: consecutivos, terminaciones y primos en statisticsEngine"
```

---

### Task 5: `statisticsEngine.js` — prueba chi-cuadrado de uniformidad

**Files:**
- Modify: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-chisquare.js`

**Interfaces:**
- Produces: `chiSquareUniformity(frequency, totalDraws, valuesPerDraw)` → `{ chiSquare, degreesOfFreedom, pValueApprox, likelyUniform }`; `chiSquarePValueApprox(chiSquare, df)` → float; `normalCdf(z)` → float.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-statisticsEngine-chisquare.js
const assert = require('assert');
const { chiSquareUniformity, normalCdf } = require('../../src/services/statisticsEngine');

// Distribución perfectamente uniforme -> chiSquare = 0 -> pValue cercano a 1
const uniformFreq = { 1: 10, 2: 10, 3: 10, 4: 10 };
const uniformResult = chiSquareUniformity(uniformFreq, 40, 1);
assert.strictEqual(uniformResult.chiSquare, 0);
assert.ok(uniformResult.pValueApprox > 0.9);
assert.strictEqual(uniformResult.likelyUniform, true);

// Distribución muy sesgada -> chiSquare grande -> pValue cercano a 0
const skewedFreq = { 1: 100, 2: 1, 3: 1, 4: 1 };
const skewedResult = chiSquareUniformity(skewedFreq, 103, 1);
assert.ok(skewedResult.chiSquare > 50);
assert.ok(skewedResult.pValueApprox < 0.05);
assert.strictEqual(skewedResult.likelyUniform, false);

assert.ok(normalCdf(0) > 0.49 && normalCdf(0) < 0.51);
assert.ok(normalCdf(3) > 0.99);

console.log('test-statisticsEngine-chisquare: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-chisquare.js`
Expected: FAIL — `chiSquareUniformity` no está definida.

- [ ] **Step 3: Implementar (agregar antes de `module.exports`)**

```js
// Aproximación de Abramowitz-Stegun para la CDF normal estándar
function normalCdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z > 0) prob = 1 - prob;
    return prob;
}

// Aproximación de Wilson-Hilferty: transforma chi-cuadrado a normal estándar
function chiSquarePValueApprox(chiSquare, df) {
    if (df <= 0) return 1;
    const z = (Math.pow(chiSquare / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
    return 1 - normalCdf(z);
}

function chiSquareUniformity(frequency, totalDraws, valuesPerDraw) {
    const numbers = Object.keys(frequency);
    const k = numbers.length;
    const totalObservations = totalDraws * valuesPerDraw;
    const expected = totalObservations / k;
    if (expected === 0) {
        return { chiSquare: 0, degreesOfFreedom: k - 1, pValueApprox: 1, likelyUniform: true };
    }
    const chiSquare = numbers.reduce((acc, num) => {
        const observed = frequency[num];
        return acc + Math.pow(observed - expected, 2) / expected;
    }, 0);
    const degreesOfFreedom = k - 1;
    const pValueApprox = chiSquarePValueApprox(chiSquare, degreesOfFreedom);
    return { chiSquare, degreesOfFreedom, pValueApprox, likelyUniform: pValueApprox > 0.05 };
}
```

Actualizar `module.exports` agregando `chiSquareUniformity, chiSquarePValueApprox, normalCdf`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-chisquare.js`
Expected: imprime `test-statisticsEngine-chisquare: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-chisquare.js
git commit -m "feat: prueba chi-cuadrado de uniformidad en statisticsEngine"
```

---

### Task 6: `statisticsEngine.js` — prueba de rachas

**Files:**
- Modify: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-runs.js`

**Interfaces:**
- Produces: `runsTest(binarySequence)` → `{ runs, expectedRuns, stdDev, zScore, likelyRandom, note? }`.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-statisticsEngine-runs.js
const assert = require('assert');
const { runsTest } = require('../../src/services/statisticsEngine');

// Secuencia perfectamente alternada: máximo número de rachas posible
const alternating = [0, 1, 0, 1, 0, 1, 0, 1];
const altResult = runsTest(alternating);
assert.strictEqual(altResult.runs, 8);

// Secuencia sin alternancia (todo igual) -> prueba no aplicable
const constant = [0, 0, 0, 0];
const constResult = runsTest(constant);
assert.strictEqual(constResult.likelyRandom, false);
assert.ok(constResult.note);

// Secuencia con dos bloques -> 2 rachas
const twoBlocks = [0, 0, 0, 1, 1, 1];
const blocksResult = runsTest(twoBlocks);
assert.strictEqual(blocksResult.runs, 2);

console.log('test-statisticsEngine-runs: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-runs.js`
Expected: FAIL — `runsTest` no está definida.

- [ ] **Step 3: Implementar (agregar antes de `module.exports`)**

```js
function runsTest(binarySequence) {
    const n = binarySequence.length;
    const n1 = binarySequence.filter(b => b === 1).length;
    const n0 = n - n1;
    if (n0 === 0 || n1 === 0) {
        return { runs: 0, expectedRuns: 0, stdDev: 0, zScore: 0, likelyRandom: false, note: 'Secuencia sin variación: la prueba de rachas no aplica.' };
    }
    let runs = 1;
    for (let i = 1; i < n; i++) {
        if (binarySequence[i] !== binarySequence[i - 1]) runs++;
    }
    const expectedRuns = (2 * n0 * n1) / n + 1;
    const variance = (2 * n0 * n1 * (2 * n0 * n1 - n)) / (n * n * (n - 1));
    const stdDev = Math.sqrt(Math.max(variance, 0));
    const zScore = stdDev === 0 ? 0 : (runs - expectedRuns) / stdDev;
    return { runs, expectedRuns, stdDev, zScore, likelyRandom: Math.abs(zScore) < 1.96 };
}
```

Actualizar `module.exports` agregando `runsTest`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-runs.js`
Expected: imprime `test-statisticsEngine-runs: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-runs.js
git commit -m "feat: prueba de rachas en statisticsEngine"
```

---

### Task 7: `statisticsEngine.js` — orquestador `getDescriptiveStats(game)`

**Files:**
- Modify: `src/services/statisticsEngine.js`
- Test: `tests/unit/test-statisticsEngine-descriptive.js`

**Interfaces:**
- Consumes: `db.getAllResults(game, limit)` de `src/services/database.js`; `LOTTERY_RULES` de `src/services/lotteryRules.js` (Task 1); todas las funciones de Tasks 2–6.
- Produces: `getDescriptiveStats(game)` → objeto con `totalSorteos, frequency, hot, cold, gapsSinceLastAppearance, parity, rangeDistribution, sumStats, averageConsecutivePairs, endingDigitFrequency, primesCount, chiSquare, runsTest`. Solo soporta juegos con `mainNumbers` en `LOTTERY_RULES` (Baloto, Miloto; Revancha reutiliza las de Baloto en `reportBuilder.js`, no llama esta función con `'Baloto Revancha'`).

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-statisticsEngine-descriptive.js
const assert = require('assert');
const db = require('../../src/services/database');
const { getDescriptiveStats } = require('../../src/services/statisticsEngine');

db.initDatabase();

const stats = getDescriptiveStats('Baloto');
assert.strictEqual(stats.totalSorteos, db.getTotalResults('Baloto'));
assert.ok(stats.frequency);
assert.ok(Array.isArray(stats.hot));
assert.ok(Array.isArray(stats.cold));
assert.ok(stats.parity);
assert.ok(stats.rangeDistribution);
assert.ok(stats.sumStats);
assert.strictEqual(typeof stats.averageConsecutivePairs, 'number');
assert.ok(stats.endingDigitFrequency);
assert.strictEqual(typeof stats.primesCount, 'number');
assert.ok(stats.chiSquare);
assert.ok(stats.runsTest);

assert.throws(() => getDescriptiveStats('Colorloto'), /no soporta/);

console.log('test-statisticsEngine-descriptive: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-statisticsEngine-descriptive.js`
Expected: FAIL — `getDescriptiveStats` no está definida.

- [ ] **Step 3: Implementar (agregar al inicio del archivo el require, y la función antes de `module.exports`)**

Agregar al principio de `src/services/statisticsEngine.js`:

```js
const db = require('./database');
const { LOTTERY_RULES } = require('./lotteryRules');
```

Agregar antes de `module.exports`:

```js
function getDescriptiveStats(game) {
    const rules = LOTTERY_RULES[game];
    if (!rules || !rules.mainNumbers) {
        throw new Error(`getDescriptiveStats no soporta el juego "${game}"`);
    }
    const maxNumber = rules.mainNumbers.max;
    const results = db.getAllResults(game, 1000);
    const frequency = computeFrequency(results, maxNumber);
    const { hot, cold } = computeHotCold(frequency);

    const chronological = [...results].reverse();
    const parityOfSumSequence = chronological.map(result => {
        const sum = parseNumeros(result).reduce((a, b) => a + b, 0);
        return sum % 2 === 0 ? 0 : 1;
    });

    return {
        totalSorteos: results.length,
        frequency,
        hot,
        cold,
        gapsSinceLastAppearance: computeGapsSinceLastAppearance(results, maxNumber),
        parity: computeParityDistribution(results),
        rangeDistribution: computeRangeDistribution(results, maxNumber),
        sumStats: computeSumStats(results),
        averageConsecutivePairs: averageConsecutivePairs(results),
        endingDigitFrequency: computeEndingDigitFrequency(results),
        primesCount: countPrimesInResults(results),
        chiSquare: chiSquareUniformity(frequency, results.length, rules.mainNumbers.count),
        runsTest: runsTest(parityOfSumSequence),
    };
}
```

Actualizar `module.exports` agregando `getDescriptiveStats`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-statisticsEngine-descriptive.js`
Expected: imprime `test-statisticsEngine-descriptive: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/statisticsEngine.js tests/unit/test-statisticsEngine-descriptive.js
git commit -m "feat: orquestador getDescriptiveStats en statisticsEngine"
```

---

### Task 8: `popularityScorer.js` — popularidad estimada Baloto/Revancha/Miloto

**Files:**
- Create: `src/services/popularityScorer.js`
- Test: `tests/unit/test-popularityScorer.js`

**Interfaces:**
- Produces: `scorePopularity(numbers, maxNumber)` → int 0–100; `sumOfBottomN(n)` → int; `sumOfTopN(maxNumber, n)` → int.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-popularityScorer.js
const assert = require('assert');
const { scorePopularity } = require('../../src/services/popularityScorer');

// Patrón clásico y muy reconocible: debe dar score alto
const classic = scorePopularity([1, 2, 3, 4, 5], 43);
assert.ok(classic >= 70, `esperado >=70, obtuvo ${classic}`);

// Combinación dispersa, sin patrones: debe dar score bajo
const dispersed = scorePopularity([3, 17, 24, 31, 42], 43);
assert.ok(dispersed <= 20, `esperado <=20, obtuvo ${dispersed}`);

// El score nunca debe superar 100
const allChecks = scorePopularity([5, 10, 15, 20, 25], 43); // múltiplos de 5, todos <=31
assert.ok(allChecks <= 100);

console.log('test-popularityScorer: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-popularityScorer.js`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

```js
// src/services/popularityScorer.js
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
```

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-popularityScorer.js`
Expected: imprime `test-popularityScorer: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/popularityScorer.js tests/unit/test-popularityScorer.js
git commit -m "feat: heurística de popularidad estimada para combinaciones numéricas"
```

---

### Task 9: `popularityScorer.js` — popularidad estimada Colorloto

**Files:**
- Modify: `src/services/popularityScorer.js`
- Test: `tests/unit/test-popularityScorer-colorloto.js`

**Interfaces:**
- Consumes: `pairs` = array de `{ color, number }` (6 elementos, `number` 1–7).
- Produces: `scoreColorlotoPopularity(pairs)` → int 0–100; exporta `COLOR_ORDER`.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-popularityScorer-colorloto.js
const assert = require('assert');
const { scoreColorlotoPopularity, COLOR_ORDER } = require('../../src/services/popularityScorer');

// Secuencia ascendente en el orden del volante: patrón muy reconocible
const ascending = COLOR_ORDER.map((color, i) => ({ color, number: i + 1 }));
const ascendingScore = scoreColorlotoPopularity(ascending);
assert.ok(ascendingScore >= 50, `esperado >=50, obtuvo ${ascendingScore}`);

// Números dispersos sin patrón
const dispersed = [
    { color: 'amarillo', number: 3 },
    { color: 'azul', number: 7 },
    { color: 'rojo', number: 1 },
    { color: 'verde', number: 5 },
    { color: 'blanco', number: 2 },
    { color: 'negro', number: 6 },
];
const dispersedScore = scoreColorlotoPopularity(dispersed);
assert.ok(dispersedScore <= 20, `esperado <=20, obtuvo ${dispersedScore}`);

console.log('test-popularityScorer-colorloto: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-popularityScorer-colorloto.js`
Expected: FAIL — `scoreColorlotoPopularity` no está definida.

- [ ] **Step 3: Implementar (agregar a `popularityScorer.js`)**

```js
const COLOR_ORDER = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

function scoreColorlotoPopularity(pairs) {
    const numbers = pairs.map(p => p.number);
    let score = 0;

    // Todos los números iguales
    if (new Set(numbers).size === 1) score += 30;

    // Secuencia ascendente en el orden de colores del volante (1,2,3,4,5,6)
    const inTicketOrder = COLOR_ORDER.map(color => pairs.find(p => p.color === color).number);
    const isAscendingTicketOrder = inTicketOrder.every((n, i) => i === 0 || n === inTicketOrder[i - 1] + 1);
    if (isAscendingTicketOrder) score += 30;

    // Todos los números <=4 (sesgo hacia números bajos)
    if (numbers.every(n => n <= 4)) score += 20;

    // Todo par o todo impar
    if (numbers.every(n => n % 2 === 0) || numbers.every(n => n % 2 === 1)) score += 15;

    // Un mismo número repetido en al menos la mitad de los colores
    const maxRepeat = Math.max(...Array.from(new Set(numbers)).map(n => numbers.filter(x => x === n).length));
    if (maxRepeat >= 3) score += 15;

    return Math.min(100, score);
}
```

Actualizar `module.exports` de `popularityScorer.js` a:

```js
module.exports = { scorePopularity, sumOfBottomN, sumOfTopN, scoreColorlotoPopularity, COLOR_ORDER };
```

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-popularityScorer-colorloto.js`
Expected: imprime `test-popularityScorer-colorloto: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/popularityScorer.js tests/unit/test-popularityScorer-colorloto.js
git commit -m "feat: heurística de popularidad estimada para Colorloto"
```

---

### Task 10: `portfolioOptimizer.js` — PRNG determinístico y métricas de distancia/cobertura

**Files:**
- Create: `src/services/portfolioOptimizer.js`
- Test: `tests/unit/test-portfolioOptimizer-primitives.js`

**Interfaces:**
- Produces: `createSeededRandom(seed)` → función `() => float en [0,1)`; `randomCombo(count, maxNumber, rng)` → `number[]` ordenado; `comboKey(combo)` → string; `sharedCount(a, b)` → int; `hammingDistance(a, b)` → int; `jaccardIndex(a, b)` → float; `marginalCoverage(existingCombos, candidate)` → int; `coverageOf(combos)` → `number[]`; `averageRedundancy(combos)` → float.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-portfolioOptimizer-primitives.js
const assert = require('assert');
const {
    createSeededRandom,
    randomCombo,
    comboKey,
    sharedCount,
    hammingDistance,
    jaccardIndex,
    marginalCoverage,
    coverageOf,
    averageRedundancy,
} = require('../../src/services/portfolioOptimizer');

// Determinismo: misma semilla -> misma secuencia
const rngA = createSeededRandom(42);
const rngB = createSeededRandom(42);
assert.strictEqual(rngA(), rngB());

const combo = randomCombo(5, 43, createSeededRandom(1));
assert.strictEqual(combo.length, 5);
assert.strictEqual(new Set(combo).size, 5); // sin repetidos
assert.deepStrictEqual(combo, [...combo].sort((a, b) => a - b)); // ordenado

assert.strictEqual(comboKey([1, 2, 3]), '1-2-3');
assert.strictEqual(sharedCount([1, 2, 3], [2, 3, 4]), 2);
assert.strictEqual(hammingDistance([1, 2, 3], [2, 3, 4]), 2); // 3+3-2*2
assert.strictEqual(jaccardIndex([1, 2, 3], [2, 3, 4]), 0.5); // 2 compartidos / 4 en unión

assert.strictEqual(marginalCoverage([[1, 2, 3]], [3, 4, 5]), 2); // 4 y 5 son nuevos

assert.deepStrictEqual(coverageOf([[1, 2], [2, 3]]), [1, 2, 3]);

const redundancy = averageRedundancy([[1, 2, 3], [1, 2, 4], [5, 6, 7]]);
assert.ok(redundancy >= 0);

console.log('test-portfolioOptimizer-primitives: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-portfolioOptimizer-primitives.js`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

```js
// src/services/portfolioOptimizer.js

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
```

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-portfolioOptimizer-primitives.js`
Expected: imprime `test-portfolioOptimizer-primitives: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/portfolioOptimizer.js tests/unit/test-portfolioOptimizer-primitives.js
git commit -m "feat: PRNG determinístico y métricas de distancia/cobertura"
```

---

### Task 11: `portfolioOptimizer.js` — balance, `generateCombo` y portafolio numérico (Baloto/Miloto)

**Files:**
- Modify: `src/services/portfolioOptimizer.js`
- Test: `tests/unit/test-portfolioOptimizer-numeric.js`

**Interfaces:**
- Consumes: `scorePopularity` de `popularityScorer.js` (Task 8); `LOTTERY_RULES` de `lotteryRules.js` (Task 1); `db.getAllResults` de `database.js`; primitivas de Task 10.
- Produces: `isParityBalanced(numbers)` → bool; `isRangeBalanced(numbers, maxNumber)` → bool; `pickWeighted(valuesWithWeights, rng)` → value; `generateCombo(strategy, count, maxNumber, rng, existingCombos)` → `number[]`; `attachSuperBalotas(portfolio, game, rng)` → portfolio (muta y retorna); `buildNumericPortfolio(game, rules, seed=42)` → `Array<{strategy, numbers, popularityScore, marginalCoverageAtInsertion, superBalota}>` de longitud 20.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-portfolioOptimizer-numeric.js
const assert = require('assert');
const db = require('../../src/services/database');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const {
    isParityBalanced,
    isRangeBalanced,
    generateCombo,
    buildNumericPortfolio,
    createSeededRandom,
} = require('../../src/services/portfolioOptimizer');

db.initDatabase();

assert.strictEqual(isParityBalanced([2, 4, 6, 8, 10]), false); // 100% pares, fuera de 30-70%
assert.strictEqual(isParityBalanced([1, 2, 3, 4, 6]), true); // 2 impares, 3 pares -> 60% pares

assert.strictEqual(isRangeBalanced([1, 2, 3, 4, 5], 43), false); // todo en el tercio bajo
assert.strictEqual(isRangeBalanced([3, 17, 24, 31, 42], 43), true); // repartido

const rng = createSeededRandom(7);
const comboB = generateCombo('B', 5, 43, rng, []);
assert.strictEqual(comboB.length, 5);

const portfolio = buildNumericPortfolio('Baloto', LOTTERY_RULES.Baloto, 42);
assert.strictEqual(portfolio.length, 20);
portfolio.forEach(combo => {
    assert.strictEqual(combo.numbers.length, 5);
    assert.ok(combo.numbers.every(n => n >= 1 && n <= 43));
    assert.ok(combo.superBalota >= 1 && combo.superBalota <= 16);
    assert.ok(['A', 'B', 'C', 'D'].includes(combo.strategy));
});
// Sin combinaciones duplicadas dentro del portafolio
const keys = new Set(portfolio.map(c => c.numbers.join('-')));
assert.strictEqual(keys.size, 20);

console.log('test-portfolioOptimizer-numeric: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-portfolioOptimizer-numeric.js`
Expected: FAIL — funciones no definidas.

- [ ] **Step 3: Implementar (agregar a `portfolioOptimizer.js`)**

Agregar al inicio del archivo (después del comentario del LCG, junto a los demás requires):

```js
const db = require('./database');
const { scorePopularity } = require('./popularityScorer');
```

Agregar antes de `module.exports`:

```js
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
```

Actualizar `module.exports` de `portfolioOptimizer.js` agregando `isParityBalanced, isRangeBalanced,
pickWeighted, generateCombo, attachSuperBalotas, buildNumericPortfolio`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-portfolioOptimizer-numeric.js`
Expected: imprime `test-portfolioOptimizer-numeric: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/portfolioOptimizer.js tests/unit/test-portfolioOptimizer-numeric.js
git commit -m "feat: generación de portafolio numérico (Baloto/Miloto) con 4 estrategias"
```

---

### Task 12: `portfolioOptimizer.js` — portafolio Colorloto

**Files:**
- Modify: `src/services/portfolioOptimizer.js`
- Test: `tests/unit/test-portfolioOptimizer-colorloto.js`

**Interfaces:**
- Consumes: `scoreColorlotoPopularity`, `COLOR_ORDER` de `popularityScorer.js` (Task 9); `isParityBalanced`, `createSeededRandom` de Task 10/11.
- Produces: `randomColorloto(rng)` → `Array<{color, number}>` (6 elementos); `colorlotoComboKey(pairs)` → string; `marginalCoverageColorloto(existingPairsList, candidatePairs)` → int; `generateColorlotoCombo(strategy, rng, existingPairsList)` → pairs; `buildColorlotoPortfolio(seed=42)` → `Array<{strategy, pairs, popularityScore, marginalCoverageAtInsertion}>` de longitud 20.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-portfolioOptimizer-colorloto.js
const assert = require('assert');
const { buildColorlotoPortfolio, randomColorloto, createSeededRandom, colorlotoComboKey } = require('../../src/services/portfolioOptimizer');

const pairs = randomColorloto(createSeededRandom(3));
assert.strictEqual(pairs.length, 6);
assert.ok(pairs.every(p => p.number >= 1 && p.number <= 7));
const colors = pairs.map(p => p.color);
assert.strictEqual(new Set(colors).size, 6); // los 6 colores presentes una vez cada uno

const portfolio = buildColorlotoPortfolio(42);
assert.strictEqual(portfolio.length, 20);
portfolio.forEach(combo => {
    assert.strictEqual(combo.pairs.length, 6);
    assert.ok(['A', 'B', 'C', 'D'].includes(combo.strategy));
});
const keys = new Set(portfolio.map(c => colorlotoComboKey(c.pairs)));
assert.strictEqual(keys.size, 20);

console.log('test-portfolioOptimizer-colorloto: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-portfolioOptimizer-colorloto.js`
Expected: FAIL — funciones no definidas.

- [ ] **Step 3: Implementar (agregar a `portfolioOptimizer.js`)**

Agregar al require existente de `popularityScorer`:

```js
const { scorePopularity, scoreColorlotoPopularity, COLOR_ORDER } = require('./popularityScorer');
```

Agregar antes de `module.exports`:

```js
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
```

Actualizar `module.exports` agregando `randomColorloto, colorlotoComboKey, marginalCoverageColorloto,
generateColorlotoCombo, buildColorlotoPortfolio`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-portfolioOptimizer-colorloto.js`
Expected: imprime `test-portfolioOptimizer-colorloto: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/portfolioOptimizer.js tests/unit/test-portfolioOptimizer-colorloto.js
git commit -m "feat: generación de portafolio Colorloto con 4 estrategias"
```

---

### Task 13: `portfolioOptimizer.js` — puntaje estratégico

**Files:**
- Modify: `src/services/portfolioOptimizer.js`
- Test: `tests/unit/test-portfolioOptimizer-score.js`

**Interfaces:**
- Consumes: `sharedCount`, `isParityBalanced`, `isRangeBalanced` (Tasks 10–11); resultado de `buildNumericPortfolio`/`buildColorlotoPortfolio` (Tasks 11–12).
- Produces: `strategicScore({ popularityScore, marginalCoverage, maxMarginalCoverage, sharedWithOthersAvg, comboLength, parityBalanceOk, rangeBalanceOk })` → int 0–100; `annotatePortfolioScores(portfolio, isColorloto)` → portfolio mutado con `strategicScore` y `maxSharedWithAnother` en cada combinación.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-portfolioOptimizer-score.js
const assert = require('assert');
const { strategicScore, buildNumericPortfolio, annotatePortfolioScores } = require('../../src/services/portfolioOptimizer');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const db = require('../../src/services/database');

db.initDatabase();

// Combinación de baja popularidad y buena cobertura debe puntuar más alto que una mala en todo
const goodScore = strategicScore({
    popularityScore: 0,
    marginalCoverage: 5,
    maxMarginalCoverage: 5,
    sharedWithOthersAvg: 0,
    comboLength: 5,
    parityBalanceOk: true,
    rangeBalanceOk: true,
});
const badScore = strategicScore({
    popularityScore: 100,
    marginalCoverage: 0,
    maxMarginalCoverage: 5,
    sharedWithOthersAvg: 5,
    comboLength: 5,
    parityBalanceOk: false,
    rangeBalanceOk: false,
});
assert.ok(goodScore > badScore);
assert.strictEqual(goodScore, 100);
assert.ok(goodScore <= 100 && badScore >= 0);

const portfolio = buildNumericPortfolio('Baloto', LOTTERY_RULES.Baloto, 42);
annotatePortfolioScores(portfolio, false);
portfolio.forEach(combo => {
    assert.ok(combo.strategicScore >= 0 && combo.strategicScore <= 100);
    assert.ok(combo.maxSharedWithAnother >= 0 && combo.maxSharedWithAnother <= 5);
});

console.log('test-portfolioOptimizer-score: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-portfolioOptimizer-score.js`
Expected: FAIL — funciones no definidas.

- [ ] **Step 3: Implementar (agregar a `portfolioOptimizer.js`, antes de `module.exports`)**

```js
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

function annotatePortfolioScores(portfolio, isColorloto) {
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
            rangeBalanceOk: isColorloto ? true : isRangeBalanced(numbers, 43),
        });
        combo.maxSharedWithAnother = Math.max(...sharedValues);
    });
    return portfolio;
}
```

Nota: `isRangeBalanced(numbers, 43)` asume Baloto/Revancha; para Miloto el llamador real
(`reportBuilder.js`, Task 15) debe pasar el `maxNumber` correcto — este detalle se corrige en el
Task 15 pasando `maxNumber` como parámetro adicional. Por ahora, para que el test de este task
pase con Baloto (maxNumber=43), dejar el valor fijo `43` es válido; el Task 15 lo generaliza.

Actualizar `module.exports` agregando `strategicScore, annotatePortfolioScores`.

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-portfolioOptimizer-score.js`
Expected: imprime `test-portfolioOptimizer-score: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/portfolioOptimizer.js tests/unit/test-portfolioOptimizer-score.js
git commit -m "feat: puntaje estratégico 0-100 por combinación"
```

---

### Task 14: `portfolioOptimizer.js` — generalizar `annotatePortfolioScores` a `maxNumber` variable, presupuestos y control aleatorio

**Files:**
- Modify: `src/services/portfolioOptimizer.js`
- Test: `tests/unit/test-portfolioOptimizer-budget.js`

**Interfaces:**
- Produces: `annotatePortfolioScores(portfolio, isColorloto, maxNumber=43)` (firma actualizada); `budgetScenarios(price)` → `{ basico, moderado, amplio }` cada uno con `{ apuestas, costoUnitario, costoTotal }`; `randomControlPortfolio(count, comboLength, maxNumber, seed)` → `number[][]`; `comparePortfolios(optimizedCombos, controlCombos, maxNumber)` → `{ optimized: {coverage, coverageRatio, averageRedundancy}, control: {...} }`.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-portfolioOptimizer-budget.js
const assert = require('assert');
const {
    budgetScenarios,
    randomControlPortfolio,
    comparePortfolios,
    buildNumericPortfolio,
    annotatePortfolioScores,
} = require('../../src/services/portfolioOptimizer');
const { LOTTERY_RULES } = require('../../src/services/lotteryRules');
const db = require('../../src/services/database');

db.initDatabase();

const scenarios = budgetScenarios(6000);
assert.strictEqual(scenarios.basico.apuestas, 5);
assert.strictEqual(scenarios.basico.costoTotal, 30000);
assert.strictEqual(scenarios.moderado.apuestas, 12);
assert.strictEqual(scenarios.amplio.apuestas, 20);
assert.strictEqual(scenarios.amplio.costoTotal, 120000);

const control = randomControlPortfolio(20, 5, 43, 99);
assert.strictEqual(control.length, 20);
assert.ok(control.every(combo => combo.length === 5));

const portfolio = buildNumericPortfolio('Miloto', LOTTERY_RULES.Miloto, 42);
annotatePortfolioScores(portfolio, false, 39);
const comparison = comparePortfolios(portfolio.map(c => c.numbers), control, 39);
assert.ok(comparison.optimized.coverage >= 0);
assert.ok(comparison.control.coverage >= 0);
assert.strictEqual(typeof comparison.optimized.averageRedundancy, 'number');

console.log('test-portfolioOptimizer-budget: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-portfolioOptimizer-budget.js`
Expected: FAIL — funciones no definidas o firma incompatible.

- [ ] **Step 3: Implementar**

Reemplazar la firma y el cuerpo de `annotatePortfolioScores` (definida en Task 13) para aceptar `maxNumber`:

```js
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
```

Agregar antes de `module.exports`:

```js
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
```

Actualizar `module.exports` agregando `budgetScenarios, randomControlPortfolio, comparePortfolios`
(el export de `annotatePortfolioScores` ya existe desde Task 13, mantiene el mismo nombre).

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-portfolioOptimizer-budget.js`
Expected: imprime `test-portfolioOptimizer-budget: OK`

- [ ] **Step 5: Ejecutar TODOS los tests unitarios de `portfolioOptimizer.js` hasta ahora para confirmar que nada se rompió**

Run:
```bash
node tests/unit/test-portfolioOptimizer-primitives.js
node tests/unit/test-portfolioOptimizer-numeric.js
node tests/unit/test-portfolioOptimizer-colorloto.js
node tests/unit/test-portfolioOptimizer-score.js
node tests/unit/test-portfolioOptimizer-budget.js
```
Expected: los 5 imprimen `OK`.

- [ ] **Step 6: Commit**

```bash
git add src/services/portfolioOptimizer.js tests/unit/test-portfolioOptimizer-budget.js
git commit -m "feat: escenarios de presupuesto y portafolio de control aleatorio"
```

---

### Task 15: `reportBuilder.js` — ensamblar el reporte completo

**Files:**
- Create: `src/services/reportBuilder.js`
- Test: `tests/unit/test-reportBuilder.js`

**Interfaces:**
- Consumes: todo lo anterior (`lotteryRules.js`, `statisticsEngine.js`, `popularityScorer.js`, `portfolioOptimizer.js`) y `db.getAllResults` de `database.js`.
- Produces: `buildFullReport()` → objeto con las claves: `resumenEjecutivo, reglasVerificadas, fuentesConsultadas, juegos, limitaciones, recomendacionFinal, advertenciaJuegoResponsable`. `juegos` tiene las claves `Baloto, 'Baloto Revancha', Miloto, Colorloto`.

- [ ] **Step 1: Escribir el test**

```js
// tests/unit/test-reportBuilder.js
const assert = require('assert');
const db = require('../../src/services/database');
const { buildFullReport } = require('../../src/services/reportBuilder');

db.initDatabase();

const report = buildFullReport();

assert.ok(typeof report.resumenEjecutivo === 'string' && report.resumenEjecutivo.length > 0);
assert.ok(report.reglasVerificadas.verifiedAt);
assert.ok(Array.isArray(report.fuentesConsultadas) && report.fuentesConsultadas.length > 0);
assert.ok(Array.isArray(report.limitaciones) && report.limitaciones.length > 0);
assert.ok(typeof report.advertenciaJuegoResponsable === 'string');

['Baloto', 'Baloto Revancha', 'Miloto', 'Colorloto'].forEach(game => {
    assert.ok(report.juegos[game], `falta el juego ${game}`);
});

assert.strictEqual(report.juegos.Baloto.combinaciones.length, 20);
assert.strictEqual(report.juegos.Miloto.combinaciones.length, 20);
assert.strictEqual(report.juegos.Colorloto.combinaciones.length, 20);
assert.strictEqual(report.juegos['Baloto Revancha'].combinacionesReutilizadasDeBaloto.length, 20);
assert.ok(report.juegos['Baloto Revancha'].nota.includes('mismos'));

assert.strictEqual(report.juegos.Baloto.top5.length, 5);
assert.strictEqual(report.juegos.Colorloto.top5.length, 5);

console.log('test-reportBuilder: OK');
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `node tests/unit/test-reportBuilder.js`
Expected: FAIL — módulo no existe.

- [ ] **Step 3: Implementar**

```js
// src/services/reportBuilder.js
const db = require('./database');
const { LOTTERY_RULES, VERIFIED_AT, SOURCES } = require('./lotteryRules');
const { getDescriptiveStats } = require('./statisticsEngine');
const {
    buildNumericPortfolio,
    buildColorlotoPortfolio,
    annotatePortfolioScores,
    randomControlPortfolio,
    comparePortfolios,
    budgetScenarios,
} = require('./portfolioOptimizer');

const RESPONSIBLE_GAMING_NOTICE =
    'Juega con responsabilidad: destina únicamente dinero que estés dispuesto a perder por completo. ' +
    'La lotería no es una inversión y mantiene un valor esperado negativo para el jugador. ' +
    'Si sientes que no puedes controlar cuánto apuestas, busca ayuda profesional.';

function buildDataQualitySection(game) {
    const results = db.getAllResults(game, 10000);
    const fechas = results.map(r => r.fecha).sort();
    return {
        sorteosAnalizados: results.length,
        periodo: results.length > 0 ? { desde: fechas[0], hasta: fechas[fechas.length - 1] } : null,
        fuente: 'data/historical.db (poblada desde resultadobaloto.com / baloto.com)',
        fechaActualizacionDatos: new Date().toISOString().slice(0, 10),
        nota: 'Los registros se insertan con restricción UNIQUE(game, sorteo, fecha); no hay duplicados en la base.',
    };
}

function buildGameCombinations(portfolio, isColorloto) {
    return portfolio.map(combo => {
        if (isColorloto) {
            const numbers = combo.pairs.map(p => p.number);
            return {
                estrategia: combo.strategy,
                pares: combo.pairs,
                puntajeEstrategico: combo.strategicScore,
                puntajePopularidad: combo.popularityScore,
                sumaNumeros: numbers.reduce((a, b) => a + b, 0),
                maxCompartidosConOtraApuesta: combo.maxSharedWithAnother,
            };
        }
        const evens = combo.numbers.filter(n => n % 2 === 0).length;
        return {
            estrategia: combo.strategy,
            numeros: combo.numbers,
            superBalota: combo.superBalota ?? null,
            puntajeEstrategico: combo.strategicScore,
            puntajePopularidad: combo.popularityScore,
            sumaNumeros: combo.numbers.reduce((a, b) => a + b, 0),
            pares: evens,
            impares: combo.numbers.length - evens,
            maxCompartidosConOtraApuesta: combo.maxSharedWithAnother,
        };
    });
}

function topFive(combinations) {
    return [...combinations].sort((a, b) => b.puntajeEstrategico - a.puntajeEstrategico).slice(0, 5);
}

function buildNumericGameReport(game) {
    const rules = LOTTERY_RULES[game];
    const portfolio = buildNumericPortfolio(game, rules);
    annotatePortfolioScores(portfolio, false, rules.mainNumbers.max);
    const control = randomControlPortfolio(20, rules.mainNumbers.count, rules.mainNumbers.max, 99);
    const combinaciones = buildGameCombinations(portfolio, false);
    return {
        reglas: rules,
        calidadDatos: buildDataQualitySection(game),
        estadisticaDescriptiva: getDescriptiveStats(game),
        combinaciones,
        top5: topFive(combinaciones),
        presupuestos: budgetScenarios(rules.price),
        comparacionControlAleatorio: comparePortfolios(portfolio.map(c => c.numbers), control, rules.mainNumbers.max),
        _portfolio: portfolio,
    };
}

function buildFullReport() {
    const balotoReport = buildNumericGameReport('Baloto');
    const milotoReport = buildNumericGameReport('Miloto');

    const revanchaRules = LOTTERY_RULES['Baloto Revancha'];
    const revanchaReport = {
        reglas: revanchaRules,
        nota:
            'Baloto Revancha se juega con los mismos 5 números y la misma Superbalota del tiquete de Baloto ' +
            '(no se eligen por separado). Pagando $3.000 adicionales, esa combinación entra también al sorteo ' +
            'de Revancha, que es un sorteo independiente con su propio historial.',
        calidadDatos: buildDataQualitySection('Baloto Revancha'),
        estadisticaDescriptiva: getDescriptiveStats('Baloto'),
        combinacionesReutilizadasDeBaloto: balotoReport.combinaciones,
        presupuestos: budgetScenarios(revanchaRules.price),
    };

    const colorlotoRules = LOTTERY_RULES.Colorloto;
    const colorlotoPortfolio = buildColorlotoPortfolio();
    annotatePortfolioScores(colorlotoPortfolio, true);
    const colorlotoCombinations = buildGameCombinations(colorlotoPortfolio, true);
    const colorlotoReport = {
        reglas: colorlotoRules,
        calidadDatos: buildDataQualitySection('Colorloto'),
        combinaciones: colorlotoCombinations,
        top5: topFive(colorlotoCombinations),
        presupuestos: budgetScenarios(colorlotoRules.price),
    };

    delete balotoReport._portfolio;
    delete milotoReport._portfolio;

    return {
        resumenEjecutivo:
            'Portafolio estratégicamente diversificado para Baloto, Revancha, Miloto y Colorloto. ' +
            'No predice números ganadores: cada combinación válida tiene la misma probabilidad matemática ' +
            'de ser sorteada. El objetivo es reducir la redundancia entre apuestas y la probabilidad estimada ' +
            'de compartir el premio con otros jugadores, no aumentar la probabilidad de ganar.',
        reglasVerificadas: { verifiedAt: VERIFIED_AT, sources: SOURCES, reglas: LOTTERY_RULES },
        fuentesConsultadas: SOURCES,
        juegos: {
            Baloto: balotoReport,
            'Baloto Revancha': revanchaReport,
            Miloto: milotoReport,
            Colorloto: colorlotoReport,
        },
        limitaciones: [
            'No se implementaron pruebas de autocorrelación temporal ni corrección por comparaciones múltiples.',
            'No se ejecutaron simulaciones Monte Carlo, algoritmos genéticos ni modelos de machine learning: la ' +
                'optimización de portafolio usa búsqueda heurística greedy sobre cobertura marginal y popularidad estimada.',
            'La popularidad estimada es una heurística basada en patrones conocidos, no un dato real de apuestas vendidas.',
            `Los precios y reglas se verificaron el ${VERIFIED_AT} contra baloto.com; pueden cambiar sin previo aviso.`,
        ],
        recomendacionFinal:
            'La estrategia híbrida (D) es la recomendación principal: combina baja popularidad estimada con alta ' +
            'cobertura y baja redundancia. Ninguna combinación de este reporte es "más probable" de salir que otra.',
        advertenciaJuegoResponsable: RESPONSIBLE_GAMING_NOTICE,
    };
}

module.exports = { buildFullReport };
```

- [ ] **Step 4: Ejecutar el test de nuevo**

Run: `node tests/unit/test-reportBuilder.js`
Expected: imprime `test-reportBuilder: OK`

- [ ] **Step 5: Commit**

```bash
git add src/services/reportBuilder.js tests/unit/test-reportBuilder.js
git commit -m "feat: ensamblar reporte completo de portafolio estratégico"
```

---

### Task 16: Endpoint `GET /api/portfolio`

**Files:**
- Modify: `src/server.js`
- Modify: `tests/test-endpoints.js`

**Interfaces:**
- Consumes: `buildFullReport()` de `reportBuilder.js` (Task 15).
- Produces: `GET /api/portfolio` → `{ success: true, report }` o `{ success: false, error }` con status 500.

- [ ] **Step 1: Agregar el require al inicio de `src/server.js`** (junto a los demás requires de servicios, línea 17)

```js
const { buildFullReport } = require('./services/reportBuilder');
```

- [ ] **Step 2: Agregar el endpoint** (después del endpoint `/api/statistics`, antes de la sección `ENDPOINTS DE HISTORIAL DE SORTEOS`, alrededor de la línea 782 actual)

```js
// Endpoint de portafolio estratégico (Baloto, Revancha, Miloto, Colorloto)
app.get('/api/portfolio', scrapingLimiter, (req, res) => {
    try {
        const report = buildFullReport();
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

- [ ] **Step 3: Agregar el caso de prueba a `tests/test-endpoints.js`** — agregar al array `tests` (después del objeto de "Colorloto Scraping", antes del cierre `];`)

```js
        {
            name: 'Portafolio Estratégico',
            config: {
                method: 'GET',
                url: `${BASE_URL}/api/portfolio`
            }
        }
```

- [ ] **Step 4: Levantar el servidor y correr el test de integración**

Run: `npm start` (en una terminal aparte, dejar corriendo)
Run: `npm test`
Expected: en la salida, el bloque "Portafolio Estratégico" imprime `✅ Respuesta exitosa` y
`📦 Datos recibidos` con un JSON que incluye `report.juegos.Baloto.combinaciones` (20 elementos).
Si falla por rate limit (30 req/10min ya consumidas por pruebas previas), esperar o reiniciar el
servidor antes de reintentar.

- [ ] **Step 5: Commit**

```bash
git add src/server.js tests/test-endpoints.js
git commit -m "feat: endpoint GET /api/portfolio"
```

---

### Task 17: Frontend — pestaña "Portafolio Estratégico"

**Files:**
- Modify: `public/index.html`
- Modify: `public/js/app.js`
- Modify: `public/css/styles.css` (verificar ruta exacta del CSS antes de editar — buscar el `<link>` en `index.html`)

**Interfaces:**
- Consumes: `GET /api/portfolio` (Task 16) vía `fetch(`${LOCAL_SERVER_URL}/api/portfolio`)`, mismo patrón que `loadStatisticsData()` en `public/js/app.js:2267-2320`.

- [ ] **Step 1: Agregar el botón de pestaña en `public/index.html`** (junto a los demás `tab-button`, línea 38-42)

```html
<button class="tab-button" data-tab="portafolio">🎯 Portafolio Estratégico</button>
```

- [ ] **Step 2: Agregar el contenedor de la pestaña en `public/index.html`** (después del `<div id="estadisticas" class="tab-content">...</div>`, antes de `<footer>`, alrededor de la línea 454)

```html
<div id="portafolio" class="tab-content">
    <div class="section">
        <h2>🎯 Portafolio Estratégico</h2>
        <p class="description">
            Combinaciones diversificadas para Baloto, Revancha, Miloto y Colorloto. No predicen números
            ganadores: buscan reducir redundancia y la probabilidad estimada de compartir el premio.
        </p>
        <div class="api-buttons">
            <button class="btn-api" onclick="loadPortfolioReport(event)">🔄 Generar Reporte</button>
        </div>
        <div id="portfolio-container">
            <p class="helper-text">Haz clic en &quot;Generar Reporte&quot; para calcular el portafolio</p>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Registrar la carga de la pestaña en `public/js/app.js`** — modificar el bloque de Task tab-switching (líneas 126-129) para incluir el nuevo caso:

```js
            // Cargar estadísticas al entrar a la pestaña
            if (tabName === 'estadisticas') {
                loadStatisticsData();
            }
            if (tabName === 'portafolio') {
                loadPortfolioReport();
            }
```

- [ ] **Step 4: Agregar la función `loadPortfolioReport` en `public/js/app.js`** (al final del archivo, después de `loadStatisticsData`)

```js
// ========================================
// PORTAFOLIO ESTRATÉGICO
// ========================================

async function loadPortfolioReport(event) {
    if (event && event.target) event.target.disabled = true;
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    container.innerHTML = '<p class="helper-text">Calculando portafolio...</p>';

    try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/portfolio`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error');

        const report = data.report;

        function renderCombinationsTable(combinations, isColorloto) {
            const rows = combinations
                .map(c => {
                    const numerosStr = isColorloto
                        ? c.pares.map(p => `${p.color}-${p.number}`).join(', ')
                        : `${c.numeros.join(', ')}${c.superBalota != null ? ' | SB: ' + c.superBalota : ''}`;
                    return `<tr>
                        <td>${c.estrategia}</td>
                        <td>${numerosStr}</td>
                        <td>${c.puntajeEstrategico}</td>
                        <td>${c.puntajePopularidad}</td>
                        <td>${c.sumaNumeros}</td>
                    </tr>`;
                })
                .join('');
            return `<table class="portfolio-table">
                <thead><tr><th>Estrategia</th><th>Combinación</th><th>Punt. Estratégico</th><th>Popularidad</th><th>Suma</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
        }

        function renderGameSection(name, gameData, isColorloto) {
            const combinaciones = gameData.combinaciones || gameData.combinacionesReutilizadasDeBaloto || [];
            return `<div class="portfolio-game-section">
                <h3>${name}</h3>
                ${gameData.nota ? `<p class="helper-text">${gameData.nota}</p>` : ''}
                ${renderCombinationsTable(combinaciones, isColorloto)}
            </div>`;
        }

        container.innerHTML = `
            <p class="helper-text">${report.resumenEjecutivo}</p>
            ${renderGameSection('Baloto', report.juegos.Baloto, false)}
            ${renderGameSection('Baloto Revancha', report.juegos['Baloto Revancha'], false)}
            ${renderGameSection('Miloto', report.juegos.Miloto, false)}
            ${renderGameSection('Colorloto', report.juegos.Colorloto, true)}
            <div class="portfolio-game-section">
                <h3>Advertencia de juego responsable</h3>
                <p class="helper-text">${report.advertenciaJuegoResponsable}</p>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="helper-text">Error al calcular el portafolio: ${e.message}</p>`;
    } finally {
        if (event && event.target) event.target.disabled = false;
    }
}
```

- [ ] **Step 5: Agregar estilos mínimos para la tabla** — localizar el archivo CSS enlazado en `<head>` de `public/index.html` (buscar `<link rel="stylesheet"`) y agregar al final de ese archivo:

```css
.portfolio-game-section {
    margin-top: 24px;
}

.portfolio-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 0.9rem;
}

.portfolio-table th,
.portfolio-table td {
    border: 1px solid var(--border-color, #ccc);
    padding: 6px 10px;
    text-align: left;
}

.portfolio-table th {
    background: var(--bg-secondary, #f0f0f0);
}
```

Si `--border-color` o `--bg-secondary` no existen como variables CSS en el archivo, usar los
mismos nombres de variables que ya usen las reglas `.stat-card` o `.stats-bars` cercanas en el
mismo archivo, para mantener consistencia visual con el resto de la app.

- [ ] **Step 6: Verificación manual en navegador**

Run: `npm run dev`
Abrir `http://localhost:3000`, hacer clic en la pestaña "🎯 Portafolio Estratégico", clic en
"Generar Reporte" y confirmar que se renderizan las 4 secciones de juego con tablas de 20 filas
(Revancha reutiliza las de Baloto) y el texto de advertencia de juego responsable. Revisar la
consola del navegador en busca de errores.

- [ ] **Step 7: Commit**

```bash
git add public/index.html public/js/app.js public/css/styles.css
git commit -m "feat: pestaña de Portafolio Estratégico en el frontend"
```

---

### Task 18: Verificación final end-to-end

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Correr todos los tests unitarios en secuencia**

Run:
```bash
for f in tests/unit/test-*.js; do echo "== $f =="; node "$f" || exit 1; done
```
(en PowerShell: `Get-ChildItem tests/unit/test-*.js | ForEach-Object { node $_.FullName }`)

Expected: todos imprimen `OK`, ninguno lanza excepción sin capturar.

- [ ] **Step 2: Correr la suite de integración existente**

Run: `npm start` (terminal aparte), luego `npm test`
Expected: todos los endpoints, incluido `/api/portfolio`, responden `✅ ÉXITO` en el resumen final.

- [ ] **Step 3: Revisión manual de contenido del reporte**

Con el servidor corriendo, ejecutar:
```bash
curl -s http://localhost:3000/api/portfolio | node -e "const d=JSON.parse(require('fs').readFileSync(0)); console.log(Object.keys(d.report)); console.log(d.report.juegos.Baloto.combinaciones.length); console.log(d.report.juegos.Baloto.top5[0]);"
```
Expected: imprime las claves del reporte, `20`, y una combinación top con `puntajeEstrategico` alto
y `puntajePopularidad` bajo.

- [ ] **Step 4: Confirmar que el generador rápido existente sigue funcionando (no regresión)**

Run: `curl -s http://localhost:3000/api/generate/baloto`
Expected: responde `{"success":true,...}` igual que antes de este plan.
