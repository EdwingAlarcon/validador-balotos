const axios = require('axios');

async function testAllEndpoints() {
    console.log('🧪 Probando todos los endpoints con acumulados oficiales...\n');

    try {
        // Esperar un momento para que el servidor se inicie completamente
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('1️⃣ Probando Miloto...');
        const milotoRes = await axios.get('http://localhost:3000/api/miloto');
        console.log(`   Números: ${milotoRes.data.numbers.join(', ')}`);
        console.log(`   Acumulado: $${milotoRes.data.acumulado?.toLocaleString('es-CO')}`);
        console.log(`   Valor esperado: $550,000,000`);
        console.log(`   ${milotoRes.data.acumulado === 550000000 ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

        console.log('\n2️⃣ Probando Baloto...');
        const balotoRes = await axios.get('http://localhost:3000/api/baloto');
        console.log(`   Números: ${balotoRes.data.numbers.join(', ')}`);
        console.log(`   Acumulado Baloto: $${balotoRes.data.acumulado?.toLocaleString('es-CO')}`);
        console.log(`   Acumulado Revancha: $${balotoRes.data.acumuladoRevancha?.toLocaleString('es-CO')}`);

        console.log('\n3️⃣ Probando Colorloto...');
        const colorRes = await axios.get('http://localhost:3000/api/colorloto');
        console.log(
            `   Combinaciones: ${colorRes.data.colorNumberPairs.map(p => `${p.color} ${p.number}`).join(', ')}`
        );
        console.log(`   Acumulado: $${colorRes.data.acumulado?.toLocaleString('es-CO')}`);

        console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Detalles:', error.response.data);
        }
    }

    process.exit(0);
}

testAllEndpoints();
