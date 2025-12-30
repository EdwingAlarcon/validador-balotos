const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, config) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Probando: ${name}`);
    console.log('='.repeat(60));
    
    try {
        const startTime = Date.now();
        const response = await axios(config);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Respuesta exitosa (${duration}ms)`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`📦 Datos recibidos:`);
        console.log(JSON.stringify(response.data, null, 2));
        
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Datos:`, error.response.data);
        }
        return false;
    }
}

async function runTests() {
    console.log('\n🚀 Iniciando pruebas de endpoints...\n');
    
    const tests = [
        {
            name: 'Baloto API (Oficial)',
            config: {
                method: 'POST',
                url: `${BASE_URL}/api/baloto`,
                headers: { 'Content-Type': 'application/json' },
                data: {}
            }
        },
        {
            name: 'Miloto Scraping',
            config: {
                method: 'GET',
                url: `${BASE_URL}/api/miloto`
            }
        },
        {
            name: 'Colorloto Scraping',
            config: {
                method: 'GET',
                url: `${BASE_URL}/api/colorloto`
            }
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testEndpoint(test.name, test.config);
        results.push({ name: test.name, success: result });
    }
    
    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.success ? 'ÉXITO' : 'FALLO'}`);
    });
    
    const allPassed = results.every(r => r.success);
    console.log(`\n${allPassed ? '🎉 TODAS LAS PRUEBAS PASARON' : '⚠️ ALGUNAS PRUEBAS FALLARON'}\n`);
}

runTests();
