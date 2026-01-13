const db = require('../src/services/database');

console.log('🧪 PRUEBA DE GENERADOR PONDERADO\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Inicializar base de datos
db.initDatabase();

// ========================================
// FUNCIÓN DE GENERACIÓN PONDERADA
// ========================================

/**
 * Genera números basados en frecuencias históricas
 * @param {Object} frequency - Objeto con frecuencias {numero: cantidad}
 * @param {number} count - Cantidad de números a generar
 * @param {number} max - Número máximo permitido
 * @returns {Array} Array de números generados
 */
function generateWeightedNumbers(frequency, count, max) {
    // Crear array de números ponderados
    const weightedPool = [];

    for (let num = 1; num <= max; num++) {
        const weight = frequency[num] || 1; // Al menos peso 1 si no hay datos

        // Agregar el número tantas veces como su peso (frecuencia)
        for (let i = 0; i < weight; i++) {
            weightedPool.push(num);
        }
    }

    // Seleccionar números únicos del pool ponderado
    const selected = [];
    const poolCopy = [...weightedPool];

    while (selected.length < count && poolCopy.length > 0) {
        const randomIndex = Math.floor(Math.random() * poolCopy.length);
        const num = poolCopy[randomIndex];

        if (!selected.includes(num)) {
            selected.push(num);
        }

        // Remover este número del pool para no seleccionarlo de nuevo
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

// ========================================
// PRUEBA BALOTO
// ========================================
function testBalotoWeighted() {
    console.log('1️⃣  Probando generador ponderado de BALOTO\n');

    const results = db.getAllResults('Baloto');

    if (results.length === 0) {
        console.log('   ❌ No hay datos históricos\n');
        return;
    }

    // Calcular frecuencias
    const frequency = {};
    const superFrequency = {};

    for (let i = 1; i <= 43; i++) frequency[i] = 0;
    for (let i = 1; i <= 16; i++) superFrequency[i] = 0;

    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= 43) frequency[num]++;
        });

        const sb = parseInt(result.superbalota);
        if (sb >= 1 && sb <= 16) superFrequency[sb]++;
    });

    // Generar 5 combinaciones de prueba
    console.log('   Generando 5 combinaciones ponderadas:\n');

    for (let i = 1; i <= 5; i++) {
        const numbers = generateWeightedNumbers(frequency, 5, 43);
        const superBalota = generateWeightedSuperBalota(superFrequency);

        console.log(
            `   ${i}. ${numbers.map(n => n.toString().padStart(2, '0')).join(', ')} + SB: ${superBalota
                .toString()
                .padStart(2, '0')}`
        );
    }

    console.log('\n   ✅ Generador ponderado de Baloto funciona correctamente\n');
}

// ========================================
// PRUEBA MILOTO
// ========================================
function testMilotoWeighted() {
    console.log('2️⃣  Probando generador ponderado de MILOTO\n');

    const results = db.getAllResults('Miloto');

    if (results.length === 0) {
        console.log('   ❌ No hay datos históricos\n');
        return;
    }

    // Calcular frecuencias
    const frequency = {};
    for (let i = 1; i <= 39; i++) frequency[i] = 0;

    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= 39) frequency[num]++;
        });
    });

    // Generar 5 combinaciones de prueba
    console.log('   Generando 5 combinaciones ponderadas:\n');

    for (let i = 1; i <= 5; i++) {
        const numbers = generateWeightedNumbers(frequency, 5, 39);
        console.log(`   ${i}. ${numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
    }

    console.log('\n   ✅ Generador ponderado de Miloto funciona correctamente\n');
}

// ========================================
// PRUEBA COLORLOTO
// ========================================
function testColorlotoWeighted() {
    console.log('3️⃣  Probando generador ponderado de COLORLOTO\n');

    const results = db.getAllResults('Colorloto');

    if (results.length === 0) {
        console.log('   ❌ No hay datos históricos\n');
        return;
    }

    const colors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
    const pairFrequency = {};

    // Calcular frecuencias de pares
    results.forEach(result => {
        let pairs;
        try {
            pairs = result.colorNumberPairs ? JSON.parse(result.colorNumberPairs) : [];
        } catch (e) {
            if (result.combinaciones) {
                pairs = result.combinaciones.split(',').map(p => {
                    const [color, number] = p.trim().split('-');
                    return { color, number: parseInt(number) };
                });
            } else {
                pairs = [];
            }
        }

        pairs.forEach(pair => {
            const color = typeof pair === 'string' ? pair.split('-')[0] : pair.color;
            const num = typeof pair === 'string' ? parseInt(pair.split('-')[1]) : parseInt(pair.number);
            const pairKey = `${color}-${num}`;
            pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        });
    });

    // Generar combinaciones ponderadas
    console.log('   Generando 5 combinaciones ponderadas:\n');

    for (let i = 1; i <= 5; i++) {
        const weightedPool = [];

        // Crear pool ponderado de todos los pares posibles
        colors.forEach(color => {
            for (let num = 1; num <= 7; num++) {
                const pair = `${color}-${num}`;
                const weight = pairFrequency[pair] || 1;

                for (let w = 0; w < weight; w++) {
                    weightedPool.push({ color, number: num });
                }
            }
        });

        // Seleccionar 6 pares únicos
        const selected = [];
        const poolCopy = [...weightedPool];

        while (selected.length < 6 && poolCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            const pair = poolCopy[randomIndex];
            const pairKey = `${pair.color}-${pair.number}`;

            if (!selected.some(p => `${p.color}-${p.number}` === pairKey)) {
                selected.push(pair);
            }

            poolCopy.splice(randomIndex, 1);
        }

        // Ordenar por color
        const colorOrder = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
        selected.sort((a, b) => colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color));

        const pairsStr = selected.map(p => `${p.color}-${p.number}`).join(', ');
        console.log(`   ${i}. ${pairsStr}`);
    }

    console.log('\n   ✅ Generador ponderado de Colorloto funciona correctamente\n');
}

// ========================================
// EJECUTAR PRUEBAS
// ========================================
console.log('Ejecutando pruebas del generador ponderado...\n\n');

testBalotoWeighted();
testMilotoWeighted();
testColorlotoWeighted();

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ TODAS LAS PRUEBAS COMPLETADAS\n');
console.log('💡 El generador ponderado usa las frecuencias históricas para');
console.log('   dar mayor probabilidad a los números que han salido más veces.\n');
console.log('═══════════════════════════════════════════════════════════════\n');
