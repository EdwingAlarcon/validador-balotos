const db = require('../src/services/database');

db.initDatabase();

console.log('=== BALOTO SORTEOS ===');
const baloto = db.getAllResults('Baloto', 10);
baloto.forEach(r => {
    console.log(`Sorteo ${r.sorteo} - ${r.fecha} - Números: ${r.numeros}`);
});

console.log('\n=== REVANCHA SORTEOS ===');
const revancha = db.getAllResults('Baloto Revancha', 10);
revancha.forEach(r => {
    console.log(`Sorteo ${r.sorteo} - ${r.fecha} - Números: ${r.numeros}`);
});

console.log('\n=== COMPARACIÓN ===');
console.log(`Total Baloto: ${baloto.length}`);
console.log(`Total Revancha: ${revancha.length}`);

// Verificar qué sorteos de Baloto tienen Revancha
console.log('\n=== SORTEOS BALOTO QUE TIENEN REVANCHA ===');
baloto.forEach(b => {
    const tieneRevancha = revancha.find(r => r.sorteo === b.sorteo);
    console.log(`Sorteo ${b.sorteo}: ${tieneRevancha ? '✓ SÍ' : '✗ NO'}`);
});
