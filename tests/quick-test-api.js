const http = require('http');

function testEndpoint(path) {
    return new Promise(resolve => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
        };

        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Parse error', data });
                }
            });
        });

        req.on('error', e => {
            resolve({ error: e.message });
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Probando nuevos endpoints...\n');

    // Esperar a que el servidor esté listo
    await new Promise(r => setTimeout(r, 1000));

    console.log('1. Probando /api/statistics');
    const stats = await testEndpoint('/api/statistics');
    if (stats.error) {
        console.log('   ❌ Error:', stats.error);
    } else {
        console.log('   ✅ Sorteos:', stats);
    }

    console.log('\n2. Probando /api/generate/baloto');
    const baloto = await testEndpoint('/api/generate/baloto');
    if (baloto.error) {
        console.log('   ❌ Error:', baloto.error);
    } else {
        console.log('   ✅ Números:', baloto.numbers?.join(', '));
        console.log('   ✅ SB:', baloto.superBalota);
        console.log('   ✅ Modo:', baloto.mode);
    }

    console.log('\n3. Probando /api/generate/miloto');
    const miloto = await testEndpoint('/api/generate/miloto');
    if (miloto.error) {
        console.log('   ❌ Error:', miloto.error);
    } else {
        console.log('   ✅ Números:', miloto.numbers?.join(', '));
        console.log('   ✅ Modo:', miloto.mode);
    }

    console.log('\n4. Probando /api/generate/colorloto');
    const colorloto = await testEndpoint('/api/generate/colorloto');
    if (colorloto.error) {
        console.log('   ❌ Error:', colorloto.error);
    } else {
        console.log('   ✅ Pares:', colorloto.colorNumberPairs?.map(p => `${p.color}-${p.number}`).join(', '));
        console.log('   ✅ Modo:', colorloto.mode);
    }

    console.log('\n✅ Pruebas completadas\n');
    process.exit(0);
}

runTests();
