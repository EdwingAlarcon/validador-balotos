const db = require('../src/services/database');

db.initDatabase();

console.log('📊 Contenido de la Base de Datos:\n');
console.log('Baloto:', db.getTotalResults('Baloto'));
console.log('Baloto Revancha:', db.getTotalResults('Baloto Revancha'));
console.log('Miloto:', db.getTotalResults('Miloto'));
console.log('Colorloto:', db.getTotalResults('Colorloto'));

console.log('\n📋 Últimos 10 sorteos de Baloto:');
const balotoResults = db.getAllResults('Baloto', 10);
balotoResults.forEach(r => {
    console.log(`  Sorteo ${r.sorteo || 'N/A'}: ${r.numeros} [SB: ${r.superBalota}] - ${r.fecha}`);
});

console.log('\n📋 Últimos 10 sorteos de Miloto:');
const milotoResults = db.getAllResults('Miloto', 10);
milotoResults.forEach(r => {
    console.log(`  Sorteo ${r.sorteo || 'N/A'}: ${r.numeros} - ${r.fecha}`);
});
