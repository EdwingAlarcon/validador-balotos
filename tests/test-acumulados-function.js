const { getAcumuladosOficiales } = require('../src/services/acumuladosOficiales');

async function test() {
    console.log('🧪 Probando función de acumulados oficiales...\n');

    const acumulados = await getAcumuladosOficiales();

    if (acumulados) {
        console.log('✅ Acumulados obtenidos:');
        console.log(`   Baloto: $${acumulados.baloto?.toLocaleString('es-CO') || 'No disponible'} millones`);
        console.log(`   Revancha: $${acumulados.revancha?.toLocaleString('es-CO') || 'No disponible'} millones`);
        console.log(`   Miloto: $${acumulados.miloto?.toLocaleString('es-CO') || 'No disponible'} millones`);
        console.log(`   Colorloto: $${acumulados.colorloto?.toLocaleString('es-CO') || 'No disponible'} millones`);

        console.log('\n📊 Valores exactos:');
        console.log(`   Baloto: ${acumulados.baloto}`);
        console.log(`   Revancha: ${acumulados.revancha}`);
        console.log(`   Miloto: ${acumulados.miloto} ${acumulados.miloto === 550 ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
        console.log(`   Colorloto: ${acumulados.colorloto}`);
    } else {
        console.log('❌ No se pudieron obtener acumulados');
    }
}

test();
