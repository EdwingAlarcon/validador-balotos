// src/services/reportBuilder.js
const db = require('./database');
const { LOTTERY_RULES, VERIFIED_AT, SOURCES } = require('./lotteryRules');
const { getDescriptiveStats } = require('./statisticsEngine');
const {
    buildNumericPortfolio,
    buildColorlotoPortfolio,
    annotatePortfolioScores,
    randomControlPortfolio,
    comparePortfolios,
    budgetScenarios,
} = require('./portfolioOptimizer');
const { getColorlotoCoverageStats } = require('./intelligentGenerator');

const RESPONSIBLE_GAMING_NOTICE =
    'Juega con responsabilidad: destina únicamente dinero que estés dispuesto a perder por completo. ' +
    'La lotería no es una inversión y mantiene un valor esperado negativo para el jugador. ' +
    'Si sientes que no puedes controlar cuánto apuestas, busca ayuda profesional.';

function buildDataQualitySection(game) {
    const results = db.getAllResults(game, 10000);
    const fechas = results.map(r => r.fecha).sort();
    return {
        sorteosAnalizados: results.length,
        periodo: results.length > 0 ? { desde: fechas[0], hasta: fechas[fechas.length - 1] } : null,
        fuente: 'data/historical.db (poblada desde resultadobaloto.com / baloto.com)',
        fechaActualizacionDatos: new Date().toISOString().slice(0, 10),
        nota: 'Los registros se insertan con restricción UNIQUE(game, sorteo, fecha); no hay duplicados en la base.',
    };
}

function buildGameCombinations(portfolio, isColorloto) {
    return portfolio.map(combo => {
        if (isColorloto) {
            const numbers = combo.pairs.map(p => p.number);
            return {
                estrategia: combo.strategy,
                pares: combo.pairs,
                puntajeEstrategico: combo.strategicScore,
                puntajePopularidad: combo.popularityScore,
                sumaNumeros: numbers.reduce((a, b) => a + b, 0),
                maxCompartidosConOtraApuesta: combo.maxSharedWithAnother,
            };
        }
        const evens = combo.numbers.filter(n => n % 2 === 0).length;
        return {
            estrategia: combo.strategy,
            numeros: combo.numbers,
            superBalota: combo.superBalota ?? null,
            puntajeEstrategico: combo.strategicScore,
            puntajePopularidad: combo.popularityScore,
            sumaNumeros: combo.numbers.reduce((a, b) => a + b, 0),
            pares: evens,
            impares: combo.numbers.length - evens,
            maxCompartidosConOtraApuesta: combo.maxSharedWithAnother,
        };
    });
}

function topFive(combinations) {
    return [...combinations].sort((a, b) => b.puntajeEstrategico - a.puntajeEstrategico).slice(0, 5);
}

function buildNumericGameReport(game) {
    const rules = LOTTERY_RULES[game];
    const portfolio = buildNumericPortfolio(game, rules);
    annotatePortfolioScores(portfolio, false, rules.mainNumbers.max);
    const control = randomControlPortfolio(20, rules.mainNumbers.count, rules.mainNumbers.max, 99);
    const combinaciones = buildGameCombinations(portfolio, false);
    return {
        reglas: rules,
        calidadDatos: buildDataQualitySection(game),
        estadisticaDescriptiva: getDescriptiveStats(game),
        combinaciones,
        top5: topFive(combinaciones),
        presupuestos: budgetScenarios(rules.price),
        comparacionControlAleatorio: comparePortfolios(portfolio.map(c => c.numbers), control, rules.mainNumbers.max),
    };
}

function buildFullReport() {
    const balotoReport = buildNumericGameReport('Baloto');
    const milotoReport = buildNumericGameReport('Miloto');

    const revanchaRules = LOTTERY_RULES['Baloto Revancha'];
    const revanchaReport = {
        reglas: revanchaRules,
        nota:
            'Baloto Revancha se juega con los mismos 5 números y la misma Superbalota del tiquete de Baloto ' +
            '(no se eligen por separado). Pagando $3.000 adicionales, esa combinación entra también al sorteo ' +
            'de Revancha, que es un sorteo independiente con su propio historial.',
        calidadDatos: buildDataQualitySection('Baloto Revancha'),
        estadisticaDescriptiva: getDescriptiveStats('Baloto'),
        combinacionesReutilizadasDeBaloto: balotoReport.combinaciones,
        presupuestos: budgetScenarios(revanchaRules.price),
    };

    const colorlotoRules = LOTTERY_RULES.Colorloto;
    const colorlotoPortfolio = buildColorlotoPortfolio();
    annotatePortfolioScores(colorlotoPortfolio, true);
    const colorlotoCombinations = buildGameCombinations(colorlotoPortfolio, true);
    const colorlotoReport = {
        reglas: colorlotoRules,
        calidadDatos: buildDataQualitySection('Colorloto'),
        coberturaColores: getColorlotoCoverageStats(),
        combinaciones: colorlotoCombinations,
        top5: topFive(colorlotoCombinations),
        presupuestos: budgetScenarios(colorlotoRules.price),
    };

    return {
        resumenEjecutivo:
            'Portafolio estratégicamente diversificado para Baloto, Revancha, Miloto y Colorloto. ' +
            'No predice números ganadores: cada combinación válida tiene la misma probabilidad matemática ' +
            'de ser sorteada. El objetivo es reducir la redundancia entre apuestas y la probabilidad estimada ' +
            'de compartir el premio con otros jugadores, no aumentar la probabilidad de ganar.',
        reglasVerificadas: { verifiedAt: VERIFIED_AT, sources: SOURCES, reglas: LOTTERY_RULES },
        fuentesConsultadas: SOURCES,
        juegos: {
            Baloto: balotoReport,
            'Baloto Revancha': revanchaReport,
            Miloto: milotoReport,
            Colorloto: colorlotoReport,
        },
        limitaciones: [
            'No se implementaron pruebas de autocorrelación temporal ni corrección por comparaciones múltiples.',
            'No se ejecutaron simulaciones Monte Carlo, algoritmos genéticos ni modelos de machine learning: la ' +
                'optimización de portafolio usa búsqueda heurística greedy sobre cobertura marginal y popularidad estimada.',
            'La popularidad estimada es una heurística basada en patrones conocidos, no un dato real de apuestas vendidas.',
            `Los precios y reglas se verificaron el ${VERIFIED_AT} contra baloto.com; pueden cambiar sin previo aviso.`,
        ],
        recomendacionFinal:
            'La estrategia híbrida (D) es la recomendación principal: combina baja popularidad estimada con alta ' +
            'cobertura y baja redundancia. Ninguna combinación de este reporte es "más probable" de salir que otra.',
        advertenciaJuegoResponsable: RESPONSIBLE_GAMING_NOTICE,
    };
}

module.exports = { buildFullReport };
