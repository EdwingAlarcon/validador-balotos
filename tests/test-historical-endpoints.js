const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testHistoricalEndpoints() {
    console.log('🧪 Probando endpoints de sorteos históricos\n');

    try {
        // 1. Listar sorteos históricos de Baloto
        console.log('1️⃣ GET /api/history/Baloto?limit=3');
        const balotoHistory = await axios.get(`${BASE_URL}/api/history/Baloto?limit=3`);
        console.log('   ✅ Sorteos encontrados:', balotoHistory.data.total);
        balotoHistory.data.sorteos.forEach(s => {
            console.log(`      Sorteo ${s.sorteo}: ${s.numeros.join(', ')} [SB: ${s.superBalota}] - ${s.fecha}`);
        });

        // 2. Obtener sorteo específico
        if (balotoHistory.data.sorteos.length > 0) {
            const sorteoId = balotoHistory.data.sorteos[0].sorteo;
            console.log(`\n2️⃣ GET /api/history/Baloto/${sorteoId}`);
            const specificSorteo = await axios.get(`${BASE_URL}/api/history/Baloto/${sorteoId}`);
            console.log('   ✅ Sorteo obtenido:', specificSorteo.data.sorteo);
        }

        // 3. Validar contra sorteo histórico
        console.log('\n3️⃣ POST /api/validate-historical');
        const validationData = {
            game: 'Baloto',
            sorteoId: balotoHistory.data.sorteos[0].sorteo,
            userNumbers: [1, 7, 11, 19, 42],
            superBalota: 10,
        };
        const validation = await axios.post(`${BASE_URL}/api/validate-historical`, validationData);
        console.log('   ✅ Validación:', validation.data.validation);

        // 4. Listar sorteos de Miloto
        console.log('\n4️⃣ GET /api/history/Miloto?limit=3');
        const milotoHistory = await axios.get(`${BASE_URL}/api/history/Miloto?limit=3`);
        console.log('   ✅ Sorteos encontrados:', milotoHistory.data.total);
        milotoHistory.data.sorteos.forEach(s => {
            console.log(`      Sorteo ${s.sorteo}: ${s.numeros.join(', ')} - ${s.fecha}`);
        });

        // 5. Listar sorteos de Colorloto
        console.log('\n5️⃣ GET /api/history/Colorloto?limit=3');
        const colorlotoHistory = await axios.get(`${BASE_URL}/api/history/Colorloto?limit=3`);
        console.log('   ✅ Sorteos encontrados:', colorlotoHistory.data.total);
        if (colorlotoHistory.data.sorteos.length > 0) {
            colorlotoHistory.data.sorteos.forEach(s => {
                console.log(
                    `      Sorteo ${s.sorteo}: ${s.colorNumberPairs?.map(p => `${p.color}:${p.number}`).join(', ')} - ${s.fecha}`
                );
            });
        }

        console.log('\n✅ Todos los endpoints funcionan correctamente');
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testHistoricalEndpoints();
