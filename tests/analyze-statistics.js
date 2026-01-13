const db = require('../src/services/database');

console.log('📊 ANÁLISIS ESTADÍSTICO DE DATOS HISTÓRICOS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Inicializar base de datos
db.initDatabase();

// ========================================
// ANÁLISIS BALOTO
// ========================================
function analyzeBaloto() {
    console.log('1️⃣  BALOTO - Análisis de Frecuencias\n');

    const results = db.getAllResults('Baloto');
    console.log(`   Total de sorteos: ${results.length}\n`);

    if (results.length === 0) {
        console.log('   ⚠️  No hay datos suficientes para análisis\n');
        return null;
    }

    // Frecuencia de números principales (1-43)
    const frequency = {};
    for (let i = 1; i <= 43; i++) {
        frequency[i] = 0;
    }

    // Frecuencia de súper balota (1-16)
    const superFrequency = {};
    for (let i = 1; i <= 16; i++) {
        superFrequency[i] = 0;
    }

    // Contar frecuencias
    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= 43) {
                frequency[num]++;
            }
        });

        const sb = parseInt(result.superbalota);
        if (sb >= 1 && sb <= 16) {
            superFrequency[sb]++;
        }
    });

    // Ordenar por frecuencia
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const sortedSuper = Object.entries(superFrequency).sort((a, b) => b[1] - a[1]);

    console.log('   📈 TOP 10 Números Más Frecuentes:');
    sorted.slice(0, 10).forEach(([num, count], index) => {
        const percentage = ((count / results.length) * 100).toFixed(1);
        console.log(`      ${index + 1}. Número ${num.padStart(2, '0')}: ${count} veces (${percentage}%)`);
    });

    console.log('\n   📉 TOP 10 Números Menos Frecuentes:');
    sorted
        .slice(-10)
        .reverse()
        .forEach(([num, count], index) => {
            const percentage = ((count / results.length) * 100).toFixed(1);
            console.log(`      ${index + 1}. Número ${num.padStart(2, '0')}: ${count} veces (${percentage}%)`);
        });

    console.log('\n   🎲 TOP 5 Súper Balotas Más Frecuentes:');
    sortedSuper.slice(0, 5).forEach(([num, count], index) => {
        const percentage = ((count / results.length) * 100).toFixed(1);
        console.log(`      ${index + 1}. SB ${num.padStart(2, '0')}: ${count} veces (${percentage}%)`);
    });

    // Análisis de rangos
    console.log('\n   📊 Distribución por Rangos:');
    const ranges = {
        '1-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-43': 0,
    };

    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= 10) ranges['1-10']++;
            else if (num >= 11 && num <= 20) ranges['11-20']++;
            else if (num >= 21 && num <= 30) ranges['21-30']++;
            else if (num >= 31 && num <= 43) ranges['31-43']++;
        });
    });

    const totalNumbers = results.length * 5;
    Object.entries(ranges).forEach(([range, count]) => {
        const percentage = ((count / totalNumbers) * 100).toFixed(1);
        console.log(`      Rango ${range}: ${count} números (${percentage}%)`);
    });

    console.log('\n');
    return { frequency, superFrequency, totalSorteos: results.length };
}

// ========================================
// ANÁLISIS MILOTO
// ========================================
function analyzeMiloto() {
    console.log('2️⃣  MILOTO - Análisis de Frecuencias\n');

    const results = db.getAllResults('Miloto');
    console.log(`   Total de sorteos: ${results.length}\n`);

    if (results.length === 0) {
        console.log('   ⚠️  No hay datos suficientes para análisis\n');
        return null;
    }

    // Frecuencia de números (1-39)
    const frequency = {};
    for (let i = 1; i <= 39; i++) {
        frequency[i] = 0;
    }

    // Contar frecuencias
    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num >= 1 && num <= 39) {
                frequency[num]++;
            }
        });
    });

    // Ordenar por frecuencia
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);

    console.log('   📈 TOP 10 Números Más Frecuentes:');
    sorted.slice(0, 10).forEach(([num, count], index) => {
        const percentage = ((count / results.length) * 100).toFixed(1);
        console.log(`      ${index + 1}. Número ${num.padStart(2, '0')}: ${count} veces (${percentage}%)`);
    });

    console.log('\n   📉 TOP 10 Números Menos Frecuentes:');
    sorted
        .slice(-10)
        .reverse()
        .forEach(([num, count], index) => {
            const percentage = ((count / results.length) * 100).toFixed(1);
            console.log(`      ${index + 1}. Número ${num.padStart(2, '0')}: ${count} veces (${percentage}%)`);
        });

    // Análisis de pares/impares
    let pares = 0,
        impares = 0;
    results.forEach(result => {
        const numbers = result.numeros.split(',').map(n => parseInt(n.trim()));
        numbers.forEach(num => {
            if (num % 2 === 0) pares++;
            else impares++;
        });
    });

    const totalNumbers = results.length * 5;
    console.log('\n   🔢 Distribución Pares/Impares:');
    console.log(`      Pares: ${pares} (${((pares / totalNumbers) * 100).toFixed(1)}%)`);
    console.log(`      Impares: ${impares} (${((impares / totalNumbers) * 100).toFixed(1)}%)`);

    console.log('\n');
    return { frequency, totalSorteos: results.length };
}

// ========================================
// ANÁLISIS COLORLOTO
// ========================================
function analyzeColorloto() {
    console.log('3️⃣  COLORLOTO - Análisis de Frecuencias\n');

    const results = db.getAllResults('Colorloto');
    console.log(`   Total de sorteos: ${results.length}\n`);

    if (results.length === 0) {
        console.log('   ⚠️  No hay datos suficientes para análisis\n');
        return null;
    }

    const colors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
    const colorFrequency = {};
    const numberFrequency = {};
    const pairFrequency = {};

    colors.forEach(color => {
        colorFrequency[color] = 0;
    });

    for (let i = 1; i <= 7; i++) {
        numberFrequency[i] = 0;
    }

    // Contar frecuencias
    results.forEach(result => {
        let pairs;
        try {
            // Intentar parsear JSON si existe
            pairs = result.colorNumberPairs ? JSON.parse(result.colorNumberPairs) : [];
        } catch (e) {
            // Si falla, intentar como string separado por comas
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

            if (colors.includes(color)) {
                colorFrequency[color]++;
            }

            if (num >= 1 && num <= 7) {
                numberFrequency[num]++;
            }

            const pairKey = `${color}-${num}`;
            pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        });
    });

    console.log('   🎨 Frecuencia por Color:');
    const sortedColors = Object.entries(colorFrequency).sort((a, b) => b[1] - a[1]);
    sortedColors.forEach(([color, count]) => {
        const percentage = ((count / results.length) * 100).toFixed(1);
        console.log(`      ${color.padEnd(10)}: ${count} veces (${percentage}%)`);
    });

    console.log('\n   🔢 Frecuencia por Número:');
    Object.entries(numberFrequency).forEach(([num, count]) => {
        const percentage = ((count / (results.length * 6)) * 100).toFixed(1);
        console.log(`      Número ${num}: ${count} veces (${percentage}%)`);
    });

    console.log('\n   🎯 TOP 10 Pares Más Frecuentes:');
    const sortedPairs = Object.entries(pairFrequency).sort((a, b) => b[1] - a[1]);
    sortedPairs.slice(0, 10).forEach(([pair, count], index) => {
        console.log(`      ${index + 1}. ${pair}: ${count} veces`);
    });

    console.log('\n');
    return { colorFrequency, numberFrequency, pairFrequency, totalSorteos: results.length };
}

// ========================================
// EJECUTAR ANÁLISIS
// ========================================
console.log('Iniciando análisis...\n\n');

const balotoStats = analyzeBaloto();
const milotoStats = analyzeMiloto();
const colorlotoStats = analyzeColorloto();

console.log('═══════════════════════════════════════════════════════════════');
console.log('📋 RESUMEN GENERAL\n');

if (balotoStats) {
    console.log(`✅ Baloto: ${balotoStats.totalSorteos} sorteos analizados`);
}
if (milotoStats) {
    console.log(`✅ Miloto: ${milotoStats.totalSorteos} sorteos analizados`);
}
if (colorlotoStats) {
    console.log(`✅ Colorloto: ${colorlotoStats.totalSorteos} sorteos analizados`);
}

console.log('\n');

// Evaluar si hay datos suficientes
const minSorteos = 20; // Mínimo recomendado para análisis estadístico confiable
let sufficient = true;

if (!balotoStats || balotoStats.totalSorteos < minSorteos) {
    console.log(`⚠️  Baloto: Se recomienda al menos ${minSorteos} sorteos (actual: ${balotoStats?.totalSorteos || 0})`);
    sufficient = false;
}
if (!milotoStats || milotoStats.totalSorteos < minSorteos) {
    console.log(`⚠️  Miloto: Se recomienda al menos ${minSorteos} sorteos (actual: ${milotoStats?.totalSorteos || 0})`);
    sufficient = false;
}
if (!colorlotoStats || colorlotoStats.totalSorteos < minSorteos) {
    console.log(
        `⚠️  Colorloto: Se recomienda al menos ${minSorteos} sorteos (actual: ${colorlotoStats?.totalSorteos || 0})`
    );
    sufficient = false;
}

if (sufficient) {
    console.log('✅ Hay datos suficientes para implementar generador estadístico');
} else {
    console.log('\n💡 Recomendación: Ejecutar más scraping para obtener datos históricos adicionales');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
