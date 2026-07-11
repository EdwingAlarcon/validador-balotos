const VERIFIED_AT = '2026-07-11';

const SOURCES = [
    { title: 'Baloto - Cómo jugar', url: 'https://baloto.com/como-jugar' },
    { title: 'Baloto - Inicio', url: 'https://baloto.com/' },
    {
        title: 'Baloto anuncia modificaciones en precio, frecuencia de sorteos y acumulados',
        url: 'https://www.dataifx.com/post/baloto-anuncia-modificaciones-en-precio-frecuencia-de-sorteos-y-acumulados',
    },
];

const LOTTERY_RULES = {
    Baloto: {
        mainNumbers: { count: 5, min: 1, max: 43 },
        superBalota: { min: 1, max: 16 },
        price: 6000,
        drawDays: ['Lunes', 'Miércoles', 'Sábado'],
    },
    'Baloto Revancha': {
        mainNumbers: { count: 5, min: 1, max: 43 },
        superBalota: { min: 1, max: 16 },
        price: 3000,
        sharesNumbersWith: 'Baloto',
        drawDays: ['Lunes', 'Miércoles', 'Sábado'],
    },
    Miloto: {
        mainNumbers: { count: 5, min: 1, max: 39 },
        superBalota: null,
        price: 4000,
        drawDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'],
    },
    Colorloto: {
        colors: ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'],
        numberRange: { min: 1, max: 7 },
        price: 5000,
        drawDays: ['Lunes', 'Jueves'],
    },
};

module.exports = { LOTTERY_RULES, VERIFIED_AT, SOURCES };
