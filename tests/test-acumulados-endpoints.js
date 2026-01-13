const axios = require('axios');

async function testEndpoints() {
    console.log('🧪 Probando endpoints con acumulados...\n');

    try {
        console.log('1️⃣ Testing Baloto endpoint...');
        const balotoRes = await axios.get('http://localhost:3000/api/baloto');
        console.log('✅ Baloto response:');
        console.log(`   Números: ${balotoRes.data.numbers.join(', ')}`);
        console.log(`   Super Balota: ${balotoRes.data.superBalota}`);
        console.log(`   Acumulado: $${balotoRes.data.acumulado?.toLocaleString('es-CO') || 'No disponible'}`);
        console.log(
            `   Acumulado Revancha: $${balotoRes.data.acumuladoRevancha?.toLocaleString('es-CO') || 'No disponible'}`
        );
        console.log(`   Premios encontrados: ${balotoRes.data.premios?.length || 0}`);
        if (balotoRes.data.premios && balotoRes.data.premios.length > 0) {
            console.log('   Primeros 3 premios:');
            balotoRes.data.premios.slice(0, 3).forEach(p => {
                console.log(`     - ${p.categoria}: $${p.premio.toLocaleString('es-CO')}`);
            });
        }

        console.log('\n2️⃣ Testing Baloto Revancha endpoint...');
        const revanchaRes = await axios.get('http://localhost:3000/api/baloto-revancha');
        console.log('✅ Revancha response:');
        console.log(`   Números: ${revanchaRes.data.numbers.join(', ')}`);
        console.log(`   Super Balota: ${revanchaRes.data.superBalota}`);
        console.log(`   Acumulado: $${revanchaRes.data.acumulado?.toLocaleString('es-CO') || 'No disponible'}`);
        console.log(`   Premios encontrados: ${revanchaRes.data.premios?.length || 0}`);

        console.log('\n3️⃣ Testing Miloto endpoint...');
        const milotoRes = await axios.get('http://localhost:3000/api/miloto');
        console.log('✅ Miloto response:');
        console.log(`   Números: ${milotoRes.data.numbers.join(', ')}`);
        console.log(`   Acumulado: $${milotoRes.data.acumulado?.toLocaleString('es-CO') || 'No disponible'}`);

        console.log('\n4️⃣ Testing Colorloto endpoint...');
        const colorRes = await axios.get('http://localhost:3000/api/colorloto');
        console.log('✅ Colorloto response:');
        console.log(
            `   Combinaciones: ${colorRes.data.colorNumberPairs.map(p => `${p.color} ${p.number}`).join(', ')}`
        );
        console.log(`   Acumulado: $${colorRes.data.acumulado?.toLocaleString('es-CO') || 'No disponible'}`);

        console.log('\n✅ TODOS LOS TESTS PASARON!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Detalles:', error.response.data);
        }
    }
}

testEndpoints();
