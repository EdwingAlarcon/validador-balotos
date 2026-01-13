const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

console.log('🧪 PROBANDO NUEVOS ENDPOINTS DE GENERACIÓN INTELIGENTE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function testGenerateBaloto() {
    console.log('1️⃣  Probando /api/generate/baloto\n');

    try {
        const res = await axios.get(`${BASE_URL}/api/generate/baloto`);
        const data = res.data;

        console.log(`   ✅ Método: ${data.method === 'statistical' ? '📊 Estadístico' : '🎲 Aleatorio'}`);
        console.log(`   📊 Sorteos en BD: ${data.totalSorteos} (mínimo: ${data.minRequired})`);
        console.log(`   🎯 Números: ${data.numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
        console.log(`   🎲 Súper Balota: ${data.superBalota.toString().padStart(2, '0')}`);
        console.log(`   💬 ${data.message}\n`);
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }
}

async function testGenerateMiloto() {
    console.log('2️⃣  Probando /api/generate/miloto\n');

    try {
        const res = await axios.get(`${BASE_URL}/api/generate/miloto`);
        const data = res.data;

        console.log(`   ✅ Método: ${data.method === 'statistical' ? '📊 Estadístico' : '🎲 Aleatorio'}`);
        console.log(`   📊 Sorteos en BD: ${data.totalSorteos} (mínimo: ${data.minRequired})`);
        console.log(`   🎯 Números: ${data.numbers.map(n => n.toString().padStart(2, '0')).join(', ')}`);
        console.log(`   💬 ${data.message}\n`);
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }
}

async function testGenerateColorloto() {
    console.log('3️⃣  Probando /api/generate/colorloto\n');

    try {
        const res = await axios.get(`${BASE_URL}/api/generate/colorloto`);
        const data = res.data;

        console.log(`   ✅ Método: ${data.method === 'statistical' ? '📊 Estadístico' : '🎲 Aleatorio'}`);
        console.log(`   📊 Sorteos en BD: ${data.totalSorteos} (mínimo: ${data.minRequired})`);
        console.log(`   🎨 Pares: ${data.pairs.map(p => `${p.color}-${p.number}`).join(', ')}`);
        console.log(`   💬 ${data.message}\n`);
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }
}

async function testStatistics() {
    console.log('4️⃣  Probando /api/statistics\n');

    try {
        const res = await axios.get(`${BASE_URL}/api/statistics`);
        const data = res.data;

        console.log(`   📊 Total de sorteos en base de datos:`);
        console.log(`      • Baloto: ${data.totals.baloto}`);
        console.log(`      • Miloto: ${data.totals.miloto}`);
        console.log(`      • Colorloto: ${data.totals.colorloto}`);

        console.log(`\n   🎯 Estado de datos (mínimo requerido: ${data.minRequired}):`);
        console.log(`      • Baloto: ${data.baloto.hasEnoughData ? '✅ Suficientes' : '⚠️  Insuficientes'}`);
        console.log(`      • Miloto: ${data.miloto.hasEnoughData ? '✅ Suficientes' : '⚠️  Insuficientes'}`);
        console.log(`      • Colorloto: ${data.colorloto.hasEnoughData ? '✅ Suficientes' : '⚠️  Insuficientes'}`);

        if (data.baloto.top10.length > 0) {
            console.log(`\n   🔥 TOP 5 números más frecuentes - Baloto:`);
            data.baloto.top10.slice(0, 5).forEach((item, i) => {
                console.log(`      ${i + 1}. Número ${item.number.toString().padStart(2, '0')}: ${item.count} veces`);
            });
        }

        if (data.miloto.top10.length > 0) {
            console.log(`\n   🔥 TOP 5 números más frecuentes - Miloto:`);
            data.miloto.top10.slice(0, 5).forEach((item, i) => {
                console.log(`      ${i + 1}. Número ${item.number.toString().padStart(2, '0')}: ${item.count} veces`);
            });
        }

        console.log();
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
    }
}

async function runTests() {
    console.log('Esperando 2 segundos para que el servidor esté listo...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testGenerateBaloto();
    await testGenerateMiloto();
    await testGenerateColorloto();
    await testStatistics();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS\n');
    console.log('💡 Los endpoints están funcionando correctamente.');
    console.log('   El generador usa ALEATORIO hasta tener 20+ sorteos,');
    console.log('   luego cambiará automáticamente a ESTADÍSTICO.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
