// API Configuration
const LOCAL_SERVER_URL = window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : window.location.origin;

// ========================================
// TOAST NOTIFICATION SYSTEM
// ========================================
const Toast = {
    show(message, type = 'info', duration = 4000, title = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠',
        };

        const titles = {
            success: title || 'Éxito',
            error: title || 'Error',
            info: title || 'Información',
            warning: title || 'Advertencia',
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    success(message, duration, title) {
        return this.show(message, 'success', duration, title);
    },

    error(message, duration, title) {
        return this.show(message, 'error', duration, title);
    },

    info(message, duration, title) {
        return this.show(message, 'info', duration, title);
    },

    warning(message, duration, title) {
        return this.show(message, 'warning', duration, title);
    },
};

// ========================================
// LOADING STATE HELPERS
// ========================================
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ========================================
// INITIALIZATION - DOM CONTENT LOADED
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Aplicación cargada correctamente');

    // Detectar si se está usando file:// en lugar de http://
    if (window.location.protocol === 'file:') {
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff4444;
            color: white;
            padding: 20px;
            text-align: center;
            font-weight: bold;
            z-index: 10000;
            font-size: 16px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        warningDiv.innerHTML = `
            ⚠️ ADVERTENCIA: Estás abriendo el archivo directamente. Las funciones de carga automática NO funcionarán.<br>
            ✅ SOLUCIÓN: Ejecuta "npm start" en una terminal y abre <strong>http://localhost:3000</strong>
            <button onclick="this.parentElement.remove()" style="margin-left: 15px; padding: 5px 15px; background: white; color: #ff4444; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cerrar</button>
        `;
        document.body.insertBefore(warningDiv, document.body.firstChild);
        console.error('⚠️ Aplicación abierta incorrectamente. Usa http://localhost:3000 en su lugar.');
    }

    // Tab functionality
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            console.log('Tab clicked:', tabName);

            // Remove active class from all tabs and buttons
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Cargar estadísticas al entrar a la pestaña
            if (tabName === 'estadisticas') {
                loadStatisticsData();
            }
            if (tabName === 'portafolio') {
                loadPortfolioReport();
            }

            // Guardar tab activo en localStorage
            localStorage.setItem('validador-balotos:activeTab', tabName);

            // Auto-enfocar el primer input de la pestaña activa
            setTimeout(() => {
                const activeTab = document.getElementById(tabName);
                const firstInput = activeTab?.querySelector('.number-input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        });
    });

    // Restaurar tab activo al cargar
    const savedTab = localStorage.getItem('validador-balotos:activeTab');
    if (savedTab) {
        const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }

    // Atajos de teclado globales
    document.addEventListener('keydown', e => {
        // ESC: Cerrar modal
        if (e.key === 'Escape') {
            closeHistoryModal({ target: { classList: { contains: () => true } } });
        }

        // Ctrl+H: Abrir historial
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            openHistoryModal();
        }

        // Ctrl+D: Toggle dark mode
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            document.getElementById('themeToggle')?.click();
        }

        // Ctrl+L: Limpiar inputs
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearUserInputsWithConfirm();
        }
    });

    // Inicializar badge del historial
    updateHistoryBadge();

    // Inicializar modo oscuro
    initDarkMode();

    console.log('✅ Todos los event listeners registrados');
});

// Prize tables based on Colombian lottery rules
// Prize tables based on Colombian lottery rules - Actualizados 2026
// Fuente: Wikipedia Baloto (actualizado junio 2025) y baloto.com
const balotoPrizes = {
    '5+1': {
        category: 'Premio Mayor (5 números + Súper Balota)',
        prize: 4000000000,
        key: 'baloto_ganadores1_valor',
        isJackpot: true,
    },
    '5+0': { category: '5 números', prize: 33886364, key: 'baloto_ganadores2_valor' },
    '4+1': { category: '4 números + Súper Balota', prize: 2063667, key: 'baloto_ganadores3_valor' },
    '4+0': { category: '4 números', prize: 137752, key: 'baloto_ganadores4_valor' },
    '3+1': { category: '3 números + Súper Balota', prize: 47547, key: 'baloto_ganadores5_valor' },
    '3+0': { category: '3 números', prize: 10397, key: 'baloto_ganadores6_valor' },
    '2+1': { category: '2 números + Súper Balota', prize: 10337, key: 'baloto_ganadores7_valor' },
    '1+1': { category: '1 número + Súper Balota (Reembolso)', prize: 5700, isRefund: true },
    '0+1': { category: 'Solo Súper Balota (Reembolso)', prize: 5700, isRefund: true },
};

// Baloto Revancha - Acumulado inicial $1.000 millones, costo $2.100
const balotoRevanchaPrizes = {
    '5+1': { category: 'Premio Mayor (5 números + Súper Balota)', prize: 1000000000, isJackpot: true },
    '5+0': { category: '5 números', prize: 0, isVariable: true },
    '4+1': { category: '4 números + Súper Balota', prize: 0, isVariable: true },
    '4+0': { category: '4 números', prize: 0, isVariable: true },
    '3+1': { category: '3 números + Súper Balota', prize: 0, isVariable: true },
    '3+0': { category: '3 números', prize: 0, isVariable: true },
    '2+1': { category: '2 números + Súper Balota', prize: 0, isVariable: true },
    '1+1': { category: '1 número + Súper Balota (Reembolso)', prize: 2100, isRefund: true },
    '0+1': { category: 'Solo Súper Balota (Reembolso)', prize: 2100, isRefund: true },
};

// MiLoto - Acumulado inicial $120 millones, costo $4.000
const milotoPrizes = {
    5: { category: '5 números (Premio Mayor)', prize: 120000000, isJackpot: true },
    4: { category: '4 números', prize: 0, isVariable: true },
    3: { category: '3 números', prize: 0, isVariable: true },
    2: { category: '2 números (Reembolso)', prize: 4000, isRefund: true },
};

// ColorLoto - Premios variables según ganadores
const colorlotoPrizes = {
    6: { category: '6 combinaciones exactas', prize: 10000000 },
    5: { category: '5 combinaciones exactas', prize: 1000000 },
    4: { category: '4 combinaciones exactas', prize: 100000 },
    3: { category: '3 combinaciones exactas', prize: 10000 },
    2: { category: '2 combinaciones exactas', prize: 5000 },
};

// Variables globales para acumulados y premios reales
let balotoData = {
    acumulado: null,
    acumuladoRevancha: null,
    premios: [],
};

let milotoData = {
    acumulado: null,
};

let colorlotoData = {
    acumulado: null,
};

// ========================================
// HELPER FUNCTIONS FOR RESULT DISPLAY
// ========================================

function fillResultBalls(displayId, numbers, superBalota = null, startDelay = 0) {
    const ballsDisplay = document.getElementById(displayId);
    if (!ballsDisplay) return;
    const balls = ballsDisplay.querySelectorAll('.result-ball');
    numbers.forEach((num, index) => {
        if (!balls[index]) return;
        balls[index].textContent = num.toString().padStart(2, '0');
        balls[index].classList.remove('empty');
        setTimeout(() => {
            balls[index].classList.add('loaded');
            setTimeout(() => balls[index].classList.remove('loaded'), 500);
        }, startDelay + index * 100);
    });
    if (superBalota !== null && balls[numbers.length]) {
        const ball = balls[numbers.length];
        ball.textContent = superBalota.toString().padStart(2, '0');
        ball.classList.remove('empty');
        setTimeout(() => {
            ball.classList.add('loaded');
            setTimeout(() => ball.classList.remove('loaded'), 500);
        }, startDelay + numbers.length * 100);
    }
}

function fillColorlotoBalls(displayId, pairs, startDelay = 0) {
    const ballsDisplay = document.getElementById(displayId);
    if (!ballsDisplay) return;
    const balls = ballsDisplay.querySelectorAll('.result-ball');
    pairs.forEach((pair, index) => {
        if (!balls[index]) return;
        balls[index].className = 'result-ball';
        balls[index].classList.add(`colorloto-${pair.color}`);
        balls[index].setAttribute('data-color', pair.color);
        balls[index].textContent = pair.number.toString();
        balls[index].classList.remove('empty');
        setTimeout(() => {
            balls[index].classList.add('loaded');
            setTimeout(() => balls[index].classList.remove('loaded'), 500);
        }, startDelay + index * 100);
    });
}

function updateSorteoInfo(elementId, result) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let html = '';
    if (result.sorteo) html += `<span class="sorteo-numero">🎲 Sorteo #${result.sorteo}</span>`;
    if (result.fecha) html += `<span class="sorteo-fecha">📅 ${result.fecha}</span>`;
    if (result.acumulado) {
        html += `<span class="sorteo-acumulado">💰 Acumulado: $${Number(result.acumulado).toLocaleString('es-CO')}</span>`;
    }
    el.innerHTML = html;
    el.style.display = html ? 'flex' : 'none';
}

// ========================================
// LOAD LATEST RESULTS FUNCTIONS
// ========================================
async function loadLatestBalotoResults(event) {
    const button = event?.currentTarget ?? event?.target;
    if (button) setButtonLoading(button, true);

    try {
        Toast.info('Cargando resultados de Baloto...', 2000);
        const response = await fetch(`${LOCAL_SERVER_URL}/api/baloto`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!result.success) {
            Toast.error(
                `${result.error}. Números encontrados: ${result.numbersFound || 0}, Súper Balota: ${
                    result.superBalotaFound || 0
                }`,
                5000
            );
            return;
        }

        fillResultBalls('baloto-results-display', result.numbers, result.superBalota);
        updateSorteoInfo('sorteo-info', result);
        if (result.acumulado) balotoData.acumulado = result.acumulado;
        if (result.premios?.length) balotoData.premios = result.premios;
        if (result.acumuladoRevancha) balotoData.acumuladoRevancha = result.acumuladoRevancha;

        Toast.success(`✅ Resultados cargados desde ${result.source}`, 4000);
    } catch (error) {
        console.error('Error al cargar Baloto:', error);
        Toast.error(
            'Error al cargar resultados. Asegúrate de tener el servidor corriendo (npm start) y abrir en http://localhost:3000',
            6000
        );
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

async function loadLatestBalotoRevanchaResults(event) {
    const button = event?.currentTarget ?? event?.target;
    if (button) setButtonLoading(button, true);

    try {
        Toast.info('Cargando resultados de Baloto Revancha...', 2000);
        const response = await fetch(`${LOCAL_SERVER_URL}/api/baloto-revancha`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!result.success) {
            Toast.error(`${result.error}. Números encontrados: ${result.numbersFound || 0}`, 5000);
            return;
        }

        fillResultBalls('baloto-revancha-results-display', result.numbers, result.superBalota);
        updateSorteoInfo('sorteo-revancha-info', result);
        if (result.acumulado) balotoData.acumuladoRevancha = result.acumulado;
        if (result.premios?.length) balotoData.premiosRevancha = result.premios;

        Toast.success(`✅ Resultados de Revancha cargados desde ${result.source}`, 4000);
    } catch (error) {
        console.error('Error al cargar Baloto Revancha:', error);
        Toast.error('Error al cargar resultados de Baloto Revancha', 6000);
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

// ========================================
// CARGAR RESULTADOS INTEGRADOS (BALOTO + REVANCHA)
// ========================================
async function loadLatestBalotoIntegratedResults(event) {
    const button = event?.currentTarget ?? event?.target;
    if (button) setButtonLoading(button, true);

    try {
        Toast.info('Cargando resultados de Baloto y Revancha...', 2000);

        // Un solo request al nuevo endpoint combinado
        const response = await fetch(`${LOCAL_SERVER_URL}/api/baloto-combined`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!result.success) {
            Toast.error(result.error, 5000);
            return;
        }

        fillResultBalls('baloto-results-display', result.baloto.numbers, result.baloto.superBalota);
        updateSorteoInfo('sorteo-info', result.baloto);
        if (result.baloto.acumulado) balotoData.acumulado = result.baloto.acumulado;
        if (result.baloto.premios?.length) balotoData.premios = result.baloto.premios;

        fillResultBalls('baloto-revancha-results-display', result.revancha.numbers, result.revancha.superBalota, 600);
        updateSorteoInfo('sorteo-revancha-info', result.revancha);
        if (result.revancha.acumulado) balotoData.acumuladoRevancha = result.revancha.acumulado;
        if (result.revancha.premios?.length) balotoData.premiosRevancha = result.revancha.premios;

        Toast.success(`✅ Resultados cargados desde ${result.source}`, 5000);
    } catch (error) {
        console.error('Error al cargar resultados integrados:', error);
        Toast.error(
            'Error al cargar resultados. Asegúrate de tener el servidor corriendo (npm start) y abrir en http://localhost:3000',
            6000
        );
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

async function loadLatestMilotoResults(event) {
    const button = event?.currentTarget ?? event?.target;
    if (button) setButtonLoading(button, true);

    try {
        Toast.info('Cargando resultados de Miloto...', 2000);
        const response = await fetch(`${LOCAL_SERVER_URL}/api/miloto`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!result.success) {
            Toast.error(`${result.error}. Por favor, ingresa los números manualmente desde la página oficial.`, 5000);
            return;
        }

        if (result.numbers.length !== 5) {
            Toast.error('Se esperaban 5 números del Miloto. Por favor, ingresa los números manualmente.', 5000);
            return;
        }

        fillResultBalls('miloto-results-display', result.numbers);
        updateSorteoInfo('sorteo-miloto-info', result);
        if (result.acumulado) milotoData.acumulado = result.acumulado;

        let message = `Resultados cargados: ${result.numbers.join(', ')}`;
        if (result.fecha) message += ` - ${result.fecha}`;
        if (result.sorteo) message += ` - Sorteo #${result.sorteo}`;
        Toast.success(message, 5000);
    } catch (error) {
        console.error('Error al cargar Miloto:', error);
        Toast.error(
            'Error de conexión. Asegúrate de tener el servidor corriendo (npm start) y abrir en http://localhost:3000',
            6000
        );
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

async function loadLatestColorlotoResults(event) {
    const button = event?.currentTarget ?? event?.target;
    if (button) setButtonLoading(button, true);

    try {
        Toast.info('Cargando resultados de Colorloto...', 2000);
        const response = await fetch(`${LOCAL_SERVER_URL}/api/colorloto`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (!result.success) {
            Toast.error(
                `${result.error}. Por favor, ingresa las combinaciones manualmente desde la página oficial.`,
                5000
            );
            return;
        }

        if (!result.colorNumberPairs || result.colorNumberPairs.length !== 6) {
            Toast.error(
                'Se esperaban 6 combinaciones de color-número. Por favor, ingresa las combinaciones manualmente.',
                5000
            );
            return;
        }

        const colorOrder = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
        const sortedPairs = [...result.colorNumberPairs].sort(
            (a, b) => colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color)
        );
        fillColorlotoBalls('colorloto-results-display', sortedPairs);
        updateSorteoInfo('sorteo-colorloto-info', result);
        if (result.acumulado) colorlotoData.acumulado = result.acumulado;

        const pairsDisplay = sortedPairs.map(p => `${p.color} ${p.number}`).join(', ');
        let message = `Resultados cargados: ${pairsDisplay}`;
        if (result.fecha) message += ` - ${result.fecha}`;
        if (result.sorteo) message += ` - Sorteo #${result.sorteo}`;
        Toast.success(message, 5000);
    } catch (error) {
        console.error('Error al cargar Colorloto:', error);
        Toast.error(
            'Error de conexión. Asegúrate de tener el servidor corriendo (npm start) y abrir en http://localhost:3000',
            6000
        );
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

// Utility functions
function getInputValues(selector) {
    const inputs = document.querySelectorAll(selector);
    return Array.from(inputs)
        .map(input => parseInt(input.value))
        .filter(val => !isNaN(val));
}

function showResult(
    elementId,
    isWinner,
    title,
    details,
    prize = null,
    userNumbers = [],
    winningNumbers = [],
    matches = 0
) {
    const resultContainer = document.getElementById(elementId);
    resultContainer.className = 'result-container show ' + (isWinner ? 'winner' : 'loser');

    let html = `<h3>${title}</h3>`;
    html += `<div class="result-details">`;

    details.forEach(detail => {
        html += `<p>${detail}</p>`;
    });

    if (prize !== null) {
        html += `<div class="prize-amount">💰 Premio: $${prize.toLocaleString('es-CO')}</div>`;
    }

    html += `</div>`;
    resultContainer.innerHTML = html;

    // Mostrar botones de compartir - FASE 3
    if (userNumbers.length > 0 && winningNumbers.length > 0) {
        const game = elementId.replace('-result', '');
        showShareButtons(game, {
            isWinner,
            prize: prize || 0,
            userNumbers,
            winningNumbers,
            matches,
        });
    }
}

// Generate random numbers
function generateRandomBaloto() {
    const ballsDisplay = document.getElementById('baloto-results-display');
    if (!ballsDisplay) return;

    const balls = ballsDisplay.querySelectorAll('.result-ball');
    const numbers = [];

    // Generate 5 unique random numbers between 1-43
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 43) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);
    numbers.forEach((num, index) => {
        if (balls[index]) {
            balls[index].textContent = num.toString().padStart(2, '0');
            balls[index].classList.remove('empty');
        }
    });

    // Generate Súper Balota (1-16)
    const superBallot = Math.floor(Math.random() * 16) + 1;
    if (balls[5]) {
        balls[5].textContent = superBallot.toString().padStart(2, '0');
        balls[5].classList.remove('empty');
    }
}

function generateRandomBalotoRevancha() {
    const ballsDisplay = document.getElementById('baloto-revancha-results-display');
    if (!ballsDisplay) return;

    const balls = ballsDisplay.querySelectorAll('.result-ball');
    const numbers = [];

    // Generate 5 unique random numbers between 1-43
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 43) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);
    numbers.forEach((num, index) => {
        if (balls[index]) {
            balls[index].textContent = num.toString().padStart(2, '0');
            balls[index].classList.remove('empty');
        }
    });

    // Generate Súper Balota (1-16)
    const superBallot = Math.floor(Math.random() * 16) + 1;
    if (balls[5]) {
        balls[5].textContent = superBallot.toString().padStart(2, '0');
        balls[5].classList.remove('empty');
    }
}

function generateRandomMiloto() {
    const ballsDisplay = document.getElementById('miloto-results-display');
    const numbers = [];

    // Generate 5 unique random numbers between 1-39
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 39) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);

    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        balls.forEach((ball, index) => {
            ball.textContent = numbers[index].toString().padStart(2, '0');
            ball.classList.add('ball-pop');
            setTimeout(() => ball.classList.remove('ball-pop'), 500);
        });
    }
}

function generateRandomColorloto() {
    const ballsDisplay = document.getElementById('colorloto-results-display');
    const colors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        colors.forEach((color, index) => {
            const number = Math.floor(Math.random() * 7) + 1;
            if (balls[index]) {
                balls[index].className = 'result-ball';
                balls[index].classList.add(`colorloto-${color}`);
                balls[index].setAttribute('data-color', color);
                balls[index].textContent = number.toString();
                balls[index].classList.add('ball-pop');
                setTimeout(() => balls[index].classList.remove('ball-pop'), 500);
            }
        });
    }
}

// ========================================
// GENERACIÓN INTELIGENTE (BASADA EN ESTADÍSTICAS)
// ========================================

async function generateIntelligentBaloto() {
    const ballsDisplay = document.getElementById('baloto-results-display');
    if (!ballsDisplay) return;

    const balls = ballsDisplay.querySelectorAll('.result-ball');

    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/generate/baloto`);
        const data = await response.json();

        if (data.success) {
            // Mostrar números
            data.numbers.forEach((num, index) => {
                if (balls[index]) {
                    balls[index].textContent = num.toString().padStart(2, '0');
                    balls[index].classList.remove('empty');
                    balls[index].classList.add('ball-pop');
                    setTimeout(() => balls[index].classList.remove('ball-pop'), 500);
                }
            });

            // Mostrar súper balota
            if (balls[5]) {
                balls[5].textContent = data.superBalota.toString().padStart(2, '0');
                balls[5].classList.remove('empty');
                balls[5].classList.add('ball-pop');
                setTimeout(() => balls[5].classList.remove('ball-pop'), 500);
            }

            // Mostrar mensaje sobre el método usado
            const icon = data.method === 'statistical' ? '🧠' : '🎲';
            const confidenceText = data.method === 'statistical' ? ` — confianza: ${data.confidence}%` : '';
            Toast.info(`${icon} Baloto generado con ${data.method === 'statistical' ? 'estadísticas posicionales' : 'números aleatorios'} (${data.totalSorteos} sorteos${confidenceText})`, 4500);
        } else {
            Toast.error('Error al generar números inteligentes');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.warning('No se pudo conectar al servidor. Usando generación aleatoria.', 3000);
        generateRandomBaloto();
    }
}

async function generateIntelligentBalotoRevancha() {
    const ballsDisplay = document.getElementById('baloto-revancha-results-display');
    if (!ballsDisplay) return;

    const balls = ballsDisplay.querySelectorAll('.result-ball');

    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/generate/baloto`);
        const data = await response.json();

        if (data.success) {
            data.numbers.forEach((num, index) => {
                if (balls[index]) {
                    balls[index].textContent = num.toString().padStart(2, '0');
                    balls[index].classList.remove('empty');
                    balls[index].classList.add('ball-pop');
                    setTimeout(() => balls[index].classList.remove('ball-pop'), 500);
                }
            });

            if (balls[5]) {
                balls[5].textContent = data.superBalota.toString().padStart(2, '0');
                balls[5].classList.remove('empty');
                balls[5].classList.add('ball-pop');
                setTimeout(() => balls[5].classList.remove('ball-pop'), 500);
            }

            const icon = data.method === 'statistical' ? '🧠' : '🎲';
            const confidenceText = data.method === 'statistical' ? ` — confianza: ${data.confidence}%` : '';
            Toast.info(`${icon} Revancha generada ${data.method === 'statistical' ? 'con estadísticas posicionales' : 'aleatoriamente'} (${data.totalSorteos} sorteos${confidenceText})`, 3500);
        } else {
            Toast.error('Error al generar números inteligentes');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.warning('Usando generación aleatoria', 3000);
        generateRandomBalotoRevancha();
    }
}

async function generateIntelligentMiloto() {
    const ballsDisplay = document.getElementById('miloto-results-display');
    if (!ballsDisplay) return;

    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/generate/miloto`);
        const data = await response.json();

        if (data.success) {
            const balls = ballsDisplay.querySelectorAll('.result-ball');
            data.numbers.forEach((num, index) => {
                if (balls[index]) {
                    balls[index].textContent = num.toString().padStart(2, '0');
                    balls[index].classList.remove('empty');
                    balls[index].classList.add('ball-pop');
                    setTimeout(() => balls[index].classList.remove('ball-pop'), 500);
                }
            });

            const icon = data.method === 'statistical' ? '🧠' : '🎲';
            const confidenceText = data.method === 'statistical' ? ` — confianza: ${data.confidence}%` : '';
            Toast.info(`${icon} Miloto generado ${data.method === 'statistical' ? 'con estadísticas posicionales' : 'aleatoriamente'} (${data.totalSorteos} sorteos${confidenceText})`, 3500);
        } else {
            Toast.error('Error al generar números inteligentes');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.warning('Usando generación aleatoria', 3000);
        generateRandomMiloto();
    }
}

async function generateIntelligentColorloto() {
    const ballsDisplay = document.getElementById('colorloto-results-display');
    if (!ballsDisplay) return;

    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/generate/colorloto`);
        const data = await response.json();

        if (data.success) {
            const balls = ballsDisplay.querySelectorAll('.result-ball');
            const colorOrder = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];

            // Ordenar pares
            const sortedPairs = data.pairs.sort((a, b) => colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color));

            sortedPairs.forEach((pair, index) => {
                if (balls[index]) {
                    balls[index].className = 'result-ball';
                    balls[index].classList.add(`colorloto-${pair.color}`);
                    balls[index].setAttribute('data-color', pair.color);
                    balls[index].textContent = pair.number.toString();
                    balls[index].classList.add('ball-pop');
                    setTimeout(() => balls[index].classList.remove('ball-pop'), 500);
                }
            });

            const icon = data.method === 'statistical' ? '🧠' : '🎲';
            const confidenceText = data.method === 'statistical' ? ` — confianza: ${data.confidence}%` : '';
            Toast.info(`${icon} Colorloto generado ${data.method === 'statistical' ? 'con estadísticas por color' : 'aleatoriamente'} (${data.totalSorteos} sorteos${confidenceText})`, 3500);
        } else {
            Toast.error('Error al generar números inteligentes');
        }
    } catch (error) {
        console.error('Error:', error);
        Toast.warning('Usando generación aleatoria', 3000);
        generateRandomColorloto();
    }
}

// ========================================
// LIMPIAR INPUTS DESPUÉS DE VALIDAR
// ========================================
function clearUserInputs(clearResults = false) {
    // Limpiar Baloto
    document.querySelectorAll('.baloto-number, .baloto-super').forEach(input => {
        input.value = '';
        input.classList.remove('winner', 'loser', 'valid', 'invalid', 'duplicate');
    });

    // Limpiar Baloto Revancha
    document.querySelectorAll('.baloto-revancha-number, .baloto-revancha-super').forEach(input => {
        input.value = '';
        input.classList.remove('winner', 'loser', 'valid', 'invalid', 'duplicate');
    });

    // Limpiar Miloto
    document.querySelectorAll('.miloto-number').forEach(input => {
        input.value = '';
        input.classList.remove('winner', 'loser', 'valid', 'invalid', 'duplicate');
    });

    // Limpiar Colorloto
    document.querySelectorAll('.user-number').forEach(input => {
        input.value = '';
        input.classList.remove('winner', 'loser', 'valid', 'invalid', 'duplicate');
    });
    document.querySelectorAll('.user-color').forEach(select => {
        select.classList.remove('duplicate');
    });

    // Limpiar resultados mostrados si se solicita
    if (clearResults) {
        clearResultsDisplay();
    }
}

// Limpiar automáticamente después de validar (sin confirmación)
function clearUserInputsAuto(delay = 3000) {
    setTimeout(() => {
        clearUserInputs(false); // Solo limpiar inputs, mantener resultados
        Toast.info('Campos limpiados automáticamente', 2000);
    }, delay);
}

// Limpiar solo la visualización de resultados
function clearResultsDisplay() {
    // Limpiar contenedores de resultados
    ['baloto-result', 'baloto-revancha-result', 'miloto-result', 'colorloto-result'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '';
            container.className = 'result-container';
        }
    });

    // Ocultar botones de compartir
    ['baloto-share', 'baloto-revancha-share', 'miloto-share', 'colorloto-share'].forEach(id => {
        const shareButtons = document.getElementById(id);
        if (shareButtons) {
            shareButtons.style.display = 'none';
        }
    });
}

// Limpiar con confirmación (para botón manual)
function clearUserInputsWithConfirm() {
    // Verificar si hay algún input con valor
    const hasValues =
        document.querySelectorAll(
            '.baloto-number, .baloto-super, .baloto-revancha-number, .baloto-revancha-super, .miloto-number, .user-number'
        ).length > 0 &&
        Array.from(
            document.querySelectorAll(
                '.baloto-number, .baloto-super, .baloto-revancha-number, .baloto-revancha-super, .miloto-number, .user-number'
            )
        ).some(input => input.value.trim() !== '');

    // Verificar si hay resultados mostrados
    const hasResults = ['baloto-result', 'baloto-revancha-result', 'miloto-result', 'colorloto-result'].some(
        id => document.getElementById(id)?.innerHTML.trim() !== ''
    );

    if (!hasValues && !hasResults) {
        Toast.info('No hay campos ni resultados para limpiar', 2000);
        return;
    }

    const message =
        hasValues && hasResults
            ? 'Se borrarán todos los números ingresados y los resultados mostrados.'
            : hasValues
              ? 'Se borrarán todos los números ingresados.'
              : 'Se borrarán los resultados mostrados.';

    showConfirmModal('¿Limpiar campos y resultados?', message, () => {
        clearUserInputs(true); // Limpiar inputs y resultados
        Toast.success('Todo limpiado correctamente', 2000);
    });
}

// ========================================
// VALIDATE BALOTO FUNCTION
// ========================================
function validateBaloto() {
    const userNumbers = getInputValues('.baloto-number');

    // Obtener resultados desde las bolas visuales
    const ballsDisplay = document.getElementById('baloto-results-display');
    const resultNumbers = [];
    let resultSuper = NaN;

    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        for (let i = 0; i < 5; i++) {
            const num = parseInt(balls[i]?.textContent);
            if (!isNaN(num)) resultNumbers.push(num);
        }
        resultSuper = parseInt(balls[5]?.textContent);
    }

    const userSuper = parseInt(document.querySelector('.baloto-super').value);

    if (userNumbers.length !== 5 || resultNumbers.length !== 5 || isNaN(userSuper) || isNaN(resultSuper)) {
        Toast.warning('Por favor, completa todos los campos y carga los resultados oficiales', 3000);
        return;
    }

    // Check for duplicates
    if (new Set(userNumbers).size !== 5) {
        Toast.warning('No puedes tener números duplicados', 3000);
        return;
    }

    // Validate ranges
    if (userNumbers.some(n => n < 1 || n > 43) || resultNumbers.some(n => n < 1 || n > 43)) {
        Toast.warning('Los números deben estar entre 1 y 43', 3000);
        return;
    }

    if (userSuper < 1 || userSuper > 16 || resultSuper < 1 || resultSuper > 16) {
        Toast.warning('La Súper Balota debe estar entre 1 y 16', 3000);
        return;
    }

    // Count matches
    const matches = userNumbers.filter(num => resultNumbers.includes(num)).length;
    const superMatch = userSuper === resultSuper;

    // Destacar números ganadores y perdedores
    highlightWinningNumbers('.baloto-number', userNumbers, resultNumbers);

    // Destacar Super Balota
    const userSuperInput = document.querySelector('.baloto-super');
    if (userSuperInput) {
        userSuperInput.classList.remove('winner', 'loser');
        userSuperInput.classList.add(superMatch ? 'winner' : 'loser');
    }

    // Determine prize - usar premios reales si están disponibles
    let prizeKey = `${matches}+${superMatch ? 1 : 0}`;
    let prize = balotoPrizes[prizeKey];
    let prizeAmount = 0;

    // Verificar reglas específicas de Baloto
    if (prize) {
        if (prize.isRefund) {
            // Reembolsos: 0+1 o 1+1 = $5,700 para Baloto
            prizeAmount = prize.prize;
        } else if (prize.isJackpot) {
            // Premio mayor: usar acumulado del servidor o valor inicial
            prizeAmount = balotoData.acumulado || prize.prize;
        } else {
            prizeAmount = prize.prize;
            // Buscar premio real desde el servidor para otras categorías
            if (balotoData.premios && balotoData.premios.length > 0) {
                const realPrize = balotoData.premios.find(p => p.categoria.includes(`${matches} `));
                if (realPrize && realPrize.premio > 0) {
                    prizeAmount = realPrize.premio;
                }
            }
        }
    }

    // Casos sin premio: 1 acierto sin super, 2 aciertos sin super, o ningún acierto sin super
    const noPrize = (matches === 1 && !superMatch) || (matches === 2 && !superMatch) || (matches === 0 && !superMatch);

    // Agregar badge de aciertos
    const matchBadge = `<span class="match-badge">✓ ${matches} aciertos${superMatch ? ' + Super Balota' : ''}</span>`;

    const details = [
        `Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${userSuper}`,
        `Números ganadores: ${resultNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${resultSuper}`,
        matchBadge,
    ];

    if (!noPrize && prize && prizeAmount > 0) {
        // Determinar si es premio grande (más de 50 millones)
        const isBigPrize = prizeAmount >= 50000000;
        const isRefund = prize.isRefund;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : isRefund ? '💰' : '🎉';

        const title = isRefund ? `${trophy} ¡Recuperaste tu apuesta!` : `${trophy} ¡FELICIDADES! ¡GANASTE!`;

        Toast.success(
            `${isRefund ? 'Reembolso' : '¡GANASTE!'} ${prize.category} - $${prizeAmount.toLocaleString('es-CO')}`,
            7000,
            isRefund ? 'Reembolso' : '¡FELICIDADES!'
        );

        showResult(
            'baloto-result',
            true,
            title,
            [...details, `Categoría: ${prize.category}`],
            prizeAmount,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Baloto', details.join(' | '), true, prizeAmount);

        // Celebración para premios grandes
        if (isBigPrize) {
            document.getElementById('baloto-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('baloto-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        const noWinMessage = noPrize
            ? `Con ${matches} acierto${matches !== 1 ? 's' : ''}${
                  !superMatch ? '' : ' y Súper Balota'
              } no hay premio. Necesitas al menos 2 aciertos + Súper Balota o 3 aciertos para ganar.`
            : 'Sigue intentando, ¡la próxima será!';

        showResult(
            'baloto-result',
            false,
            '😢 No ganaste esta vez',
            [...details, noWinMessage],
            0,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Baloto', details.join(' | '), false, 0);
    }
}

function validateBalotoRevancha() {
    const userNumbers = getInputValues('.baloto-revancha-number');

    // Obtener resultados desde las bolas visuales
    const ballsDisplay = document.getElementById('baloto-revancha-results-display');
    const resultNumbers = [];
    let resultSuper = NaN;

    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        for (let i = 0; i < 5; i++) {
            const num = parseInt(balls[i]?.textContent);
            if (!isNaN(num)) resultNumbers.push(num);
        }
        resultSuper = parseInt(balls[5]?.textContent);
    }

    const userSuper = parseInt(document.querySelector('.baloto-revancha-super').value);

    if (userNumbers.length !== 5 || resultNumbers.length !== 5 || isNaN(userSuper) || isNaN(resultSuper)) {
        Toast.warning('Por favor, completa todos los campos y carga los resultados oficiales', 3000);
        return;
    }

    if (new Set(userNumbers).size !== 5) {
        Toast.warning('No puedes tener números duplicados', 3000);
        return;
    }

    if (userNumbers.some(n => n < 1 || n > 43) || resultNumbers.some(n => n < 1 || n > 43)) {
        Toast.warning('Los números deben estar entre 1 y 43', 3000);
        return;
    }

    if (userSuper < 1 || userSuper > 16 || resultSuper < 1 || resultSuper > 16) {
        Toast.warning('La Súper Balota debe estar entre 1 y 16', 3000);
        return;
    }

    const matches = userNumbers.filter(num => resultNumbers.includes(num)).length;
    const superMatch = userSuper === resultSuper;

    highlightWinningNumbers('.baloto-revancha-number', userNumbers, resultNumbers);

    const userSuperInput = document.querySelector('.baloto-revancha-super');
    if (userSuperInput) {
        userSuperInput.classList.remove('winner', 'loser');
        userSuperInput.classList.add(superMatch ? 'winner' : 'loser');
    }

    let prizeKey = `${matches}+${superMatch ? 1 : 0}`;
    let prize = balotoRevanchaPrizes[prizeKey];
    let prizeAmount = 0;

    // Verificar reglas específicas de Baloto Revancha
    if (prize) {
        if (prize.isRefund) {
            // Reembolsos: 0+1 o 1+1 = $2,100
            prizeAmount = prize.prize;
        } else if (prize.isJackpot) {
            // Premio mayor = acumulado del servidor o valor inicial $1.000 millones
            prizeAmount = balotoData.acumuladoRevancha || prize.prize;
        } else if (prize.isVariable && balotoData.premiosRevancha && balotoData.premiosRevancha.length > 0) {
            // Premios variables: buscar desde el servidor
            const realPrize = balotoData.premiosRevancha.find(p => p.categoria.includes(`${matches} `));
            if (realPrize && realPrize.premio > 0) {
                prizeAmount = realPrize.premio;
            }
        } else {
            prizeAmount = prize.prize;
        }
    }

    // Casos sin premio: 1 acierto sin super, 2 aciertos sin super, o ningún acierto sin super
    const noPrize = (matches === 1 && !superMatch) || (matches === 2 && !superMatch) || (matches === 0 && !superMatch);

    const matchBadge = `<span class="match-badge">✓ ${matches} aciertos${superMatch ? ' + Super Balota' : ''}</span>`;

    const details = [
        `Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${userSuper}`,
        `Números ganadores: ${resultNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${resultSuper}`,
        matchBadge,
    ];

    if (!noPrize && prize && prizeAmount > 0) {
        const isBigPrize = prizeAmount >= 50000000;
        const isRefund = prize.isRefund;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : isRefund ? '💰' : '🎉';

        const title = isRefund ? `${trophy} ¡Recuperaste tu apuesta!` : `${trophy} ¡FELICIDADES! ¡GANASTE EN REVANCHA!`;

        Toast.success(
            `${isRefund ? 'Reembolso' : '¡GANASTE!'} ${prize.category} - $${prizeAmount.toLocaleString('es-CO')}`,
            7000,
            isRefund ? 'Reembolso' : '¡FELICIDADES!'
        );

        showResult(
            'baloto-revancha-result',
            true,
            title,
            [...details, `Categoría: ${prize.category}`],
            prizeAmount,
            userNumbers,
            resultNumbers,
            matches
        );

        saveToHistory('Baloto Revancha', details.join(' | '), true, prizeAmount);

        if (isBigPrize) {
            document.getElementById('baloto-revancha-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('baloto-revancha-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        const noWinMessage = noPrize
            ? `Con ${matches} acierto${matches !== 1 ? 's' : ''}${
                  !superMatch ? '' : ' y Súper Balota'
              } no hay premio en Revancha. Necesitas al menos 2 aciertos + Súper Balota o 3 aciertos para ganar.`
            : 'Sigue intentando, ¡la próxima será!';

        showResult(
            'baloto-revancha-result',
            false,
            '😢 No ganaste esta vez',
            [...details, noWinMessage],
            0,
            userNumbers,
            resultNumbers,
            matches
        );

        saveToHistory('Baloto Revancha', details.join(' | '), false, 0);
    }
}

// ========================================
// FUNCIÓN DE VALIDACIÓN INTEGRADA (BALOTO + REVANCHA)
// ========================================
function validateBalotoIntegrated() {
    const userNumbers = getInputValues('.baloto-number');
    const userSuper = parseInt(document.querySelector('.baloto-super').value);

    // Verificar si se está validando contra sorteo histórico
    const isHistorical = document.querySelector('input[name="baloto-sorteo-type"]:checked')?.value === 'historical';
    const sorteoSelector = document.getElementById('baloto-sorteo-selector');
    const selectedSorteo = isHistorical && sorteoSelector ? sorteoSelector.value : null;

    // Validar entrada del usuario
    if (userNumbers.length !== 5 || isNaN(userSuper)) {
        Toast.warning('Por favor, completa todos tus números (5 números + Súper Balota)', 3000);
        return;
    }

    if (new Set(userNumbers).size !== 5) {
        Toast.warning('No puedes tener números duplicados', 3000);
        return;
    }

    if (userNumbers.some(n => n < 1 || n > 43)) {
        Toast.warning('Los números deben estar entre 1 y 43', 3000);
        return;
    }

    if (userSuper < 1 || userSuper > 16) {
        Toast.warning('La Súper Balota debe estar entre 1 y 16', 3000);
        return;
    }

    // Obtener resultados de Baloto
    const balotoBallsDisplay = document.getElementById('baloto-results-display');
    const balotoResultNumbers = [];
    let balotoResultSuper = NaN;

    if (balotoBallsDisplay) {
        const balls = balotoBallsDisplay.querySelectorAll('.result-ball');
        for (let i = 0; i < 5; i++) {
            const num = parseInt(balls[i]?.textContent);
            if (!isNaN(num)) balotoResultNumbers.push(num);
        }
        balotoResultSuper = parseInt(balls[5]?.textContent);
    }

    // Obtener resultados de Revancha
    const revanchaBallsDisplay = document.getElementById('baloto-revancha-results-display');
    const revanchaResultNumbers = [];
    let revanchaResultSuper = NaN;

    if (revanchaBallsDisplay) {
        const balls = revanchaBallsDisplay.querySelectorAll('.result-ball');
        for (let i = 0; i < 5; i++) {
            const num = parseInt(balls[i]?.textContent);
            if (!isNaN(num)) revanchaResultNumbers.push(num);
        }
        revanchaResultSuper = parseInt(balls[5]?.textContent);
    }

    // Validar que tengamos los resultados
    if (balotoResultNumbers.length !== 5 || isNaN(balotoResultSuper)) {
        const mensaje = isHistorical
            ? 'Por favor, selecciona un sorteo histórico primero'
            : 'Por favor, carga los resultados oficiales de Baloto primero';
        Toast.warning(mensaje, 3000);
        return;
    }

    if (revanchaResultNumbers.length !== 5 || isNaN(revanchaResultSuper)) {
        const mensaje = isHistorical
            ? 'Por favor, selecciona un sorteo histórico que tenga datos de Revancha'
            : 'Por favor, carga los resultados oficiales de Revancha primero';
        Toast.warning(mensaje, 3000);
        return;
    }

    // Validar rangos de resultados
    if (
        balotoResultNumbers.some(n => n < 1 || n > 43) ||
        revanchaResultNumbers.some(n => n < 1 || n > 43) ||
        balotoResultSuper < 1 ||
        balotoResultSuper > 16 ||
        revanchaResultSuper < 1 ||
        revanchaResultSuper > 16
    ) {
        Toast.error('Error en los resultados cargados. Por favor, recarga los resultados oficiales', 4000);
        return;
    }

    // Calcular resultados para Baloto
    const balotoMatches = userNumbers.filter(num => balotoResultNumbers.includes(num)).length;
    const balotoSuperMatch = userSuper === balotoResultSuper;
    const balotoPrizeKey = `${balotoMatches}+${balotoSuperMatch ? 1 : 0}`;
    const balotoPrize = balotoPrizes[balotoPrizeKey];

    // Calcular resultados para Revancha
    const revanchaMatches = userNumbers.filter(num => revanchaResultNumbers.includes(num)).length;
    const revanchaSuperMatch = userSuper === revanchaResultSuper;
    const revanchaPrizeKey = `${revanchaMatches}+${revanchaSuperMatch ? 1 : 0}`;
    const revanchaPrize = balotoRevanchaPrizes[revanchaPrizeKey];

    // Calcular montos
    let balotoPrizeAmount = 0;
    let revanchaPrizeAmount = 0;

    // Premio Baloto
    if (balotoPrize) {
        if (balotoPrize.isJackpot) {
            balotoPrizeAmount = balotoData.acumulado || balotoPrize.prize;
        } else if (balotoPrize.isRefund) {
            balotoPrizeAmount = balotoPrize.prize;
        } else {
            balotoPrizeAmount = balotoPrize.prize;
            if (balotoData.premios && balotoData.premios.length > 0) {
                const realPrize = balotoData.premios.find(p => p.categoria.includes(`${balotoMatches} `));
                if (realPrize && realPrize.premio > 0) {
                    balotoPrizeAmount = realPrize.premio;
                }
            }
        }
    }

    // Premio Revancha
    if (revanchaPrize) {
        if (revanchaPrize.isJackpot) {
            revanchaPrizeAmount = balotoData.acumuladoRevancha || revanchaPrize.prize;
        } else if (revanchaPrize.isRefund) {
            revanchaPrizeAmount = revanchaPrize.prize;
        } else if (revanchaPrize.isVariable && balotoData.premiosRevancha && balotoData.premiosRevancha.length > 0) {
            const realPrize = balotoData.premiosRevancha.find(p => p.categoria.includes(`${revanchaMatches} `));
            if (realPrize && realPrize.premio > 0) {
                revanchaPrizeAmount = realPrize.premio;
            }
        } else {
            revanchaPrizeAmount = revanchaPrize.prize;
        }
    }

    // Determinar si hay premios
    const balotoNoPrize =
        (balotoMatches === 1 && !balotoSuperMatch) ||
        (balotoMatches === 2 && !balotoSuperMatch) ||
        (balotoMatches === 0 && !balotoSuperMatch);

    const revanchaNoPrize =
        (revanchaMatches === 1 && !revanchaSuperMatch) ||
        (revanchaMatches === 2 && !revanchaSuperMatch) ||
        (revanchaMatches === 0 && !revanchaSuperMatch);

    const balotoWon = !balotoNoPrize && balotoPrize && balotoPrizeAmount > 0;
    const revanchaWon = !revanchaNoPrize && revanchaPrize && revanchaPrizeAmount > 0;

    // Construir resultado HTML integrado
    let resultHTML = '<div class="integrated-results">';
    resultHTML += `<div class="user-numbers-summary">
        <h4>Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${userSuper}</h4>
    </div>`;

    // Resultado Baloto
    resultHTML +=
        '<div class="lottery-result baloto-section" style="margin: 20px 0; padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #ff9933 0%, #ff6600 100%);">';
    resultHTML += '<h3 style="margin: 0 0 15px 0; color: white;">🎰 BALOTO</h3>';
    resultHTML += `<p style="color: white; margin: 5px 0;"><strong>Números ganadores:</strong> ${balotoResultNumbers
        .sort((a, b) => a - b)
        .join(', ')} | <strong>Súper Balota:</strong> ${balotoResultSuper}</p>`;
    resultHTML += `<p style="color: white; margin: 5px 0;"><strong>Aciertos:</strong> ${balotoMatches} número${
        balotoMatches !== 1 ? 's' : ''
    }${balotoSuperMatch ? ' + Súper Balota ✓' : ''}</p>`;

    if (balotoWon) {
        const isBigPrize = balotoPrizeAmount >= 50000000;
        const isRefund = balotoPrize.isRefund;
        const trophy = isBigPrize ? '🏆' : isRefund ? '💰' : '🎉';

        resultHTML += `<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
            <h4 style="color: #fff; margin: 0 0 10px 0;">${trophy} ${
                isRefund ? '¡Recuperaste tu apuesta!' : '¡GANASTE!'
            }</h4>
            <p style="color: #fff; margin: 5px 0; font-size: 1.1em;"><strong>Categoría:</strong> ${
                balotoPrize.category
            }</p>
            <p style="color: #fff; margin: 5px 0; font-size: 1.3em; font-weight: bold;">
                💵 $${balotoPrizeAmount.toLocaleString('es-CO')}
            </p>
        </div>`;
    } else {
        resultHTML += `<div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p style="color: #fff; margin: 0;">❌ No ganaste en Baloto</p>
            <p style="color: #fff; margin: 5px 0; font-size: 0.9em;">Necesitas al menos 2 aciertos + Súper Balota o 3 aciertos para ganar.</p>
        </div>`;
    }
    resultHTML += '</div>';

    // Resultado Revancha
    resultHTML +=
        '<div class="lottery-result revancha-section" style="margin: 20px 0; padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #9933ff 0%, #6600cc 100%);">';
    resultHTML += '<h3 style="margin: 0 0 15px 0; color: white;">🎯 REVANCHA</h3>';
    resultHTML += `<p style="color: white; margin: 5px 0;"><strong>Números ganadores:</strong> ${revanchaResultNumbers
        .sort((a, b) => a - b)
        .join(', ')} | <strong>Súper Balota:</strong> ${revanchaResultSuper}</p>`;
    resultHTML += `<p style="color: white; margin: 5px 0;"><strong>Aciertos:</strong> ${revanchaMatches} número${
        revanchaMatches !== 1 ? 's' : ''
    }${revanchaSuperMatch ? ' + Súper Balota ✓' : ''}</p>`;

    if (revanchaWon) {
        const isBigPrize = revanchaPrizeAmount >= 50000000;
        const isRefund = revanchaPrize.isRefund;
        const trophy = isBigPrize ? '🏆' : isRefund ? '💰' : '🎉';

        resultHTML += `<div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
            <h4 style="color: #fff; margin: 0 0 10px 0;">${trophy} ${
                isRefund ? '¡Recuperaste tu apuesta!' : '¡GANASTE!'
            }</h4>
            <p style="color: #fff; margin: 5px 0; font-size: 1.1em;"><strong>Categoría:</strong> ${
                revanchaPrize.category
            }</p>
            <p style="color: #fff; margin: 5px 0; font-size: 1.3em; font-weight: bold;">
                💵 $${revanchaPrizeAmount.toLocaleString('es-CO')}
            </p>
        </div>`;
    } else {
        resultHTML += `<div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p style="color: #fff; margin: 0;">❌ No ganaste en Revancha</p>
            <p style="color: #fff; margin: 5px 0; font-size: 0.9em;">Necesitas al menos 2 aciertos + Súper Balota o 3 aciertos para ganar.</p>
        </div>`;
    }
    resultHTML += '</div>';

    // Resumen total
    const totalPrize = balotoPrizeAmount + revanchaPrizeAmount;
    if (balotoWon || revanchaWon) {
        resultHTML +=
            '<div style="background: linear-gradient(135deg, #00cc66 0%, #009944 100%); padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center;">';
        resultHTML += '<h3 style="color: white; margin: 0 0 10px 0;">💰 TOTAL GANADO</h3>';
        resultHTML += `<p style="color: white; font-size: 1.8em; font-weight: bold; margin: 0;">$${totalPrize.toLocaleString(
            'es-CO'
        )}</p>`;

        if (balotoWon && revanchaWon) {
            resultHTML +=
                '<p style="color: white; margin: 10px 0 0 0; font-size: 1.1em;">🎉 ¡Felicidades! ¡Ganaste en ambos sorteos!</p>';
        } else if (balotoWon) {
            resultHTML += '<p style="color: white; margin: 10px 0 0 0;">Ganaste en Baloto</p>';
        } else {
            resultHTML += '<p style="color: white; margin: 10px 0 0 0;">Ganaste en Revancha</p>';
        }
        resultHTML += '</div>';
    }

    resultHTML += '</div>';

    // Mostrar resultado
    const resultContainer = document.getElementById('baloto-integrated-result');
    if (resultContainer) {
        resultContainer.innerHTML = resultHTML;
        resultContainer.style.display = 'block';
    }

    // Toast notification
    const sorteoType = isHistorical && selectedSorteo ? `📜 Sorteo histórico #${selectedSorteo}` : '🎰 Último sorteo';

    if (balotoWon && revanchaWon) {
        Toast.success(
            `¡INCREÍBLE! Ganaste en AMBOS sorteos (${sorteoType}): $${totalPrize.toLocaleString('es-CO')}`,
            8000,
            '🎉 ¡DOBLE PREMIO!'
        );
    } else if (balotoWon) {
        Toast.success(
            `Ganaste en Baloto (${sorteoType}): $${balotoPrizeAmount.toLocaleString('es-CO')}`,
            6000,
            '🎰 ¡GANASTE EN BALOTO!'
        );
    } else if (revanchaWon) {
        Toast.success(
            `Ganaste en Revancha (${sorteoType}): $${revanchaPrizeAmount.toLocaleString('es-CO')}`,
            6000,
            '🎯 ¡GANASTE EN REVANCHA!'
        );
    } else {
        Toast.info(`Validado contra ${sorteoType}. No ganaste en ninguno de los sorteos. ¡Sigue intentando!`, 4000);
    }

    // Guardar en historial
    if (balotoWon) {
        saveToHistory('Baloto', `Números: ${userNumbers.join(', ')} | SB: ${userSuper}`, true, balotoPrizeAmount);
    }
    if (revanchaWon) {
        saveToHistory(
            'Baloto Revancha',
            `Números: ${userNumbers.join(', ')} | SB: ${userSuper}`,
            true,
            revanchaPrizeAmount
        );
    }
    if (!balotoWon && !revanchaWon) {
        saveToHistory('Baloto + Revancha', `Números: ${userNumbers.join(', ')} | SB: ${userSuper}`, false, 0);
    }

    // Celebración si hay premios grandes
    if ((balotoWon && balotoPrizeAmount >= 50000000) || (revanchaWon && revanchaPrizeAmount >= 50000000)) {
        if (resultContainer) {
            resultContainer.classList.add('celebration');
            setTimeout(() => {
                resultContainer.classList.remove('celebration');
            }, 800);
        }
    }
}

function validateMiloto() {
    const userNumbers = getInputValues('.miloto-number');

    // Obtener resultados desde las bolas visuales
    const ballsDisplay = document.getElementById('miloto-results-display');
    const resultNumbers = [];

    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        for (let i = 0; i < 5; i++) {
            const num = parseInt(balls[i]?.textContent);
            if (!isNaN(num)) resultNumbers.push(num);
        }
    }

    if (userNumbers.length !== 5 || resultNumbers.length !== 5) {
        Toast.warning('Por favor, completa todos los campos y carga los resultados oficiales', 3000);
        return;
    }

    // Check for duplicates
    if (new Set(userNumbers).size !== 5) {
        Toast.warning('No puedes tener números duplicados', 3000);
        return;
    }

    // Validate ranges
    if (userNumbers.some(n => n < 1 || n > 39) || resultNumbers.some(n => n < 1 || n > 39)) {
        Toast.warning('Los números deben estar entre 1 y 39', 3000);
        return;
    }

    // Count matches
    const matches = userNumbers.filter(num => resultNumbers.includes(num)).length;

    // Destacar números ganadores y perdedores
    highlightWinningNumbers('.miloto-number', userNumbers, resultNumbers);

    // Agregar badge de aciertos
    const matchBadge = `<span class="match-badge">✓ ${matches} aciertos</span>`;

    const details = [
        `Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')}`,
        `Números ganadores: ${resultNumbers.sort((a, b) => a - b).join(', ')}`,
        matchBadge,
    ];

    let prize = milotoPrizes[matches.toString()];
    let prizeAmount = 0;

    if (prize) {
        if (prize.isRefund) {
            // Reembolso: 2 aciertos = $4,000
            prizeAmount = prize.prize;
        } else if (prize.isJackpot) {
            // Premio mayor: usar acumulado del servidor o valor inicial $120 millones
            prizeAmount = milotoData.acumulado || prize.prize;
        } else if (prize.isVariable) {
            // Premios variables (3 y 4 aciertos): intentar obtener desde el servidor
            // Si no hay ganador del acumulado, reciben porcentaje adicional
            prizeAmount = prize.prize; // Valor por defecto si no hay datos del servidor
        } else {
            prizeAmount = prize.prize;
        }
    }

    if (prize && prizeAmount > 0) {
        const isBigPrize = prizeAmount >= 1000000;
        const isRefund = prize.isRefund;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : isRefund ? '💰' : '🎉';

        const title = isRefund ? `${trophy} ¡Recuperaste tu apuesta!` : `${trophy} ¡FELICIDADES! ¡GANASTE!`;

        Toast.success(
            `${isRefund ? 'Reembolso' : '¡GANASTE!'} ${prize.category} - $${prizeAmount.toLocaleString('es-CO')}`,
            7000,
            isRefund ? 'Reembolso' : '¡FELICIDADES!'
        );

        showResult(
            'miloto-result',
            true,
            title,
            [...details, `Categoría: ${prize.category}`],
            prizeAmount,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Miloto', details.join(' | '), true, prizeAmount);

        if (isBigPrize) {
            document.getElementById('miloto-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('miloto-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        showResult(
            'miloto-result',
            false,
            '😢 No ganaste esta vez',
            [...details, 'Necesitas al menos 2 números acertados para ganar'],
            0,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Miloto', details.join(' | '), false, 0);
    }
}

function validateColorloto() {
    const userColors = [];
    const userNumbers = [];
    const resultColors = [];
    const resultNumbers = [];

    // Leer color y número elegidos por el usuario en cada una de las 6 parejas
    // (el color puede repetirse entre parejas — así se puede jugar realmente)
    document.querySelectorAll('.user-color').forEach((select, index) => {
        userColors[index] = select.value;
    });
    document.querySelectorAll('.user-number').forEach((input, index) => {
        userNumbers[index] = parseInt(input.value);
    });

    // Get result selections from visual balls
    const ballsDisplay = document.getElementById('colorloto-results-display');
    if (ballsDisplay) {
        const balls = ballsDisplay.querySelectorAll('.result-ball');
        balls.forEach((ball, index) => {
            const color = ball.getAttribute('data-color');
            const number = parseInt(ball.textContent);
            if (color) resultColors[index] = color;
            if (!isNaN(number)) resultNumbers[index] = number;
        });
    }

    // Validate all fields are filled
    if (
        userNumbers.some(n => isNaN(n)) ||
        resultColors.some(c => !c) ||
        resultNumbers.some(n => isNaN(n))
    ) {
        Toast.warning('Por favor, completa todos los campos (número del 1 al 7 para cada color)', 3000);
        return;
    }

    // Validate numbers are in range 1-7
    if (userNumbers.some(n => n < 1 || n > 7) || resultNumbers.some(n => n < 1 || n > 7)) {
        Toast.warning('Los números deben estar entre 1 y 7', 3000);
        return;
    }

    // No se puede repetir la misma pareja color+número dos veces en el tiquete
    // (sí se puede repetir color solo, o número solo — así es la mecánica real)
    const userPairKeys = userColors.map((c, i) => `${c}-${userNumbers[i]}`);
    if (new Set(userPairKeys).size !== userPairKeys.length) {
        Toast.warning('No puedes repetir la misma pareja color y número. Puedes repetir el color o el número, pero no ambos juntos.', 4000);
        return;
    }

    // Count exact matches (same color AND same number)
    let matches = 0;
    const matchedPairs = [];

    for (let i = 0; i < 6; i++) {
        const userPair = `${userColors[i]}-${userNumbers[i]}`;
        for (let j = 0; j < 6; j++) {
            const resultPair = `${resultColors[j]}-${resultNumbers[j]}`;
            if (userPair === resultPair) {
                matches++;
                matchedPairs.push(`${userColors[i].toUpperCase()} ${userNumbers[i]}`);
                break;
            }
        }
    }

    const userPairs = userColors.map((c, i) => `${c}-${userNumbers[i]}`);
    const userPairsDisplay = userColors.map((c, i) => `${c} ${userNumbers[i]}`).join(', ');
    const resultPairsDisplay = resultColors.map((c, i) => `${c} ${resultNumbers[i]}`).join(', ');

    // Destacar números ganadores en Colorloto
    const userNumberInputs = document.querySelectorAll('.user-number');
    userNumberInputs.forEach((input, index) => {
        input.classList.remove('winner', 'loser');
        const userPair = `${userColors[index]}-${userNumbers[index]}`;
        let isWinner = false;

        for (let j = 0; j < 6; j++) {
            const resultPair = `${resultColors[j]}-${resultNumbers[j]}`;
            if (userPair === resultPair) {
                isWinner = true;
                break;
            }
        }

        input.classList.add(isWinner ? 'winner' : 'loser');
    });

    // Agregar badge de aciertos
    const matchBadge = `<span class="match-badge">✓ ${matches} combinaciones exactas</span>`;

    const details = [
        `Tus combinaciones: ${userPairsDisplay}`,
        `Combinaciones ganadoras: ${resultPairsDisplay}`,
        matchBadge,
        matchedPairs.length > 0 ? `Acertadas: ${matchedPairs.join(', ')}` : '',
    ].filter(d => d);

    let prize = colorlotoPrizes[matches.toString()];

    if (prize) {
        const isBigPrize = prize.prize >= 5000000;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : '🎉';

        Toast.success(`¡GANASTE! ${prize.category} - $${prize.prize.toLocaleString('es-CO')}`, 7000, '¡FELICIDADES!');
        showResult(
            'colorloto-result',
            true,
            `${trophy} ¡FELICIDADES! ¡GANASTE!`,
            [...details, `Categoría: ${prize.category}`],
            prize.prize,
            userPairs,
            resultColors.map((c, i) => `${c}-${resultNumbers[i]}`),
            matches
        );

        // Guardar en historial
        saveToHistory('Colorloto', details.filter(d => !d.includes('match-badge')).join(' | '), true, prize.prize);

        if (isBigPrize) {
            document.getElementById('colorloto-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('colorloto-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        showResult(
            'colorloto-result',
            false,
            '😢 No ganaste esta vez',
            [...details, 'Necesitas al menos 2 combinaciones exactas para ganar'],
            0,
            userPairs,
            resultColors.map((c, i) => `${c}-${resultNumbers[i]}`),
            matches
        );

        // Guardar en historial
        saveToHistory('Colorloto', details.filter(d => !d.includes('match-badge')).join(' | '), false, 0);
    }
}

// ========================================
// VALIDACIÓN EN TIEMPO REAL - FASE 1.2
// ========================================

// Validación para Baloto
function validateBalotoInputs() {
    const inputs = document.querySelectorAll('.baloto-number');
    const values = Array.from(inputs)
        .map(i => parseInt(i.value))
        .filter(v => !isNaN(v));

    inputs.forEach((input, index) => {
        const value = parseInt(input.value);
        input.classList.remove('valid', 'invalid', 'duplicate');

        if (isNaN(value) || input.value === '') {
            return; // Sin clase si está vacío
        }

        // Validar rango
        if (value < 1 || value > 43) {
            input.classList.add('invalid');
            return;
        }

        // Validar duplicados
        if (values.filter(v => v === value).length > 1) {
            input.classList.add('duplicate');
            return;
        }

        input.classList.add('valid');
    });

    // Validar Super Balota
    const superInput = document.querySelector('.baloto-super');
    if (superInput) {
        const superValue = parseInt(superInput.value);
        superInput.classList.remove('valid', 'invalid');

        if (!isNaN(superValue) && superInput.value !== '') {
            if (superValue >= 1 && superValue <= 16) {
                superInput.classList.add('valid');
            } else {
                superInput.classList.add('invalid');
            }
        }
    }
}

// Validación para Miloto
function validateMilotoInputs() {
    const inputs = document.querySelectorAll('.miloto-number');
    const values = Array.from(inputs)
        .map(i => parseInt(i.value))
        .filter(v => !isNaN(v));

    inputs.forEach((input, index) => {
        const value = parseInt(input.value);
        input.classList.remove('valid', 'invalid', 'duplicate');

        if (isNaN(value) || input.value === '') {
            return;
        }

        if (value < 1 || value > 39) {
            input.classList.add('invalid');
            return;
        }

        if (values.filter(v => v === value).length > 1) {
            input.classList.add('duplicate');
            return;
        }

        input.classList.add('valid');
    });
}

// Validación para Colorloto — el color puede repetirse entre parejas (con
// distinto número) y el número puede repetirse (con distinto color); solo no
// se puede repetir la misma pareja color+número dos veces.
function validateColorlotoInputs() {
    const colorSelects = Array.from(document.querySelectorAll('.user-color'));
    const numberInputs = Array.from(document.querySelectorAll('.user-number'));

    colorSelects.forEach((select, index) => {
        const pair = select.closest('.color-number-pair');
        if (pair) pair.setAttribute('data-color', select.value);
        select.classList.remove('duplicate');
    });

    const pairKeys = colorSelects.map((select, index) => `${select.value}-${numberInputs[index].value}`);

    numberInputs.forEach((input, index) => {
        const value = parseInt(input.value);
        input.classList.remove('valid', 'invalid', 'duplicate');

        if (isNaN(value) || input.value === '') {
            return;
        }

        if (value < 1 || value > 7) {
            input.classList.add('invalid');
            return;
        }

        const isDuplicatePair = pairKeys.filter(k => k === pairKeys[index]).length > 1;
        if (isDuplicatePair) {
            input.classList.add('duplicate');
            colorSelects[index].classList.add('duplicate');
            return;
        }

        input.classList.add('valid');
    });
}

// Animar números cuando se cargan
function animateLoadedNumbers(selector) {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach((input, index) => {
        input.classList.remove('loaded');
        setTimeout(() => {
            input.classList.add('loaded');
            setTimeout(() => input.classList.remove('loaded'), 500);
        }, index * 100);
    });
}

// Destacar números ganadores
function highlightWinningNumbers(selector, userNumbers, resultNumbers) {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach((input, index) => {
        const userNum = userNumbers[index];
        input.classList.remove('winner', 'loser');

        if (resultNumbers.includes(userNum)) {
            input.classList.add('winner');
        } else {
            input.classList.add('loser');
        }
    });
}

// Auto-focus next input when filled
document.querySelectorAll('.number-input').forEach((input, index, inputs) => {
    input.addEventListener('input', e => {
        let value = e.target.value;

        // Eliminar caracteres no numéricos
        value = value.replace(/[^0-9]/g, '');

        // Limitar a máximo 2 dígitos
        if (value.length > 2) {
            value = value.slice(0, 2);
        }

        // Actualizar el valor del input
        e.target.value = value;

        // Cambiar al siguiente input solo cuando se completen 2 dígitos
        if (value.length >= 2 && index < inputs.length - 1) {
            // Move to next input in the same section
            const nextInput = inputs[index + 1];
            if (nextInput && nextInput.closest('.input-section') === input.closest('.input-section')) {
                nextInput.focus();
            }
        }
    });

    // Prevenir entrada de caracteres no numéricos usando keypress
    input.addEventListener('keypress', e => {
        // Permitir solo números
        if (e.key && !/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });

    // Validar contenido pegado
    input.addEventListener('paste', e => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const cleanedData = pasteData.replace(/\D/g, '').slice(0, 2);
        if (cleanedData && parseInt(cleanedData) > 0) {
            e.target.value = cleanedData;
            // Trigger input event para mover al siguiente
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // Soporte para tecla Enter (validar el formulario actual)
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const section = input.closest('.tab-content');
            if (section && section.id === 'baloto') {
                validateBaloto();
            } else if (section && section.id === 'miloto') {
                validateMiloto();
            } else if (section && section.id === 'colorloto') {
                validateColorloto();
            }
        }
    });
});

// Agregar validación en tiempo real
document.querySelectorAll('.baloto-number, .baloto-super').forEach(input => {
    input.addEventListener('input', validateBalotoInputs);
    input.addEventListener('blur', validateBalotoInputs);
});

document.querySelectorAll('.miloto-number').forEach(input => {
    input.addEventListener('input', validateMilotoInputs);
    input.addEventListener('blur', validateMilotoInputs);
});

document.querySelectorAll('.user-number').forEach(input => {
    input.addEventListener('input', validateColorlotoInputs);
    input.addEventListener('change', validateColorlotoInputs);
    input.addEventListener('blur', validateColorlotoInputs);
});

document.querySelectorAll('.user-color').forEach(select => {
    select.addEventListener('change', validateColorlotoInputs);
});

// ========================================
// HISTORIAL CON LOCALSTORAGE - FASE 2
// ========================================

// Guardar validación en historial
function saveToHistory(game, details, isWinner, prize = 0) {
    const history = getHistory();
    const entry = {
        id: Date.now(),
        game: game,
        date: new Date().toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
        details: details,
        isWinner: isWinner,
        prize: prize,
    };

    history.unshift(entry); // Agregar al inicio

    // Mantener solo las últimas 50 validaciones
    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem('validador-balotos:validationHistory', JSON.stringify(history));
    updateHistoryBadge();
}

// Obtener historial
function getHistory() {
    const stored = localStorage.getItem('validador-balotos:validationHistory');
    return stored ? JSON.parse(stored) : [];
}

// Limpiar historial
function clearHistory() {
    showConfirmModal(
        '¿Borrar todo el historial?',
        'Esta acción no se puede deshacer. Se eliminarán todas las validaciones guardadas.',
        () => {
            localStorage.removeItem('validador-balotos:validationHistory');
            updateHistoryBadge();
            renderHistory();
            Toast.success('Historial limpiado', 2500);
        }
    );
}

// Modal de confirmación reutilizable
function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay confirm-modal';
    modal.innerHTML = `
        <div class="modal confirm-dialog" onclick="event.stopPropagation()">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="btn-secondary cancel-btn">Cancelar</button>
                <button class="btn-primary confirm-btn">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.cancel-btn').onclick = closeModal;
    modal.querySelector('.confirm-btn').onclick = () => {
        onConfirm();
        closeModal();
    };
    modal.onclick = closeModal;
}

// Actualizar badge de contador
function updateHistoryBadge() {
    const history = getHistory();
    const badge = document.getElementById('history-count');
    if (history.length > 0) {
        badge.textContent = history.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Abrir modal de historial
function openHistoryModal() {
    document.getElementById('history-modal').classList.add('show');
    renderHistory();
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

// Cerrar modal
function closeHistoryModal(event) {
    if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
        document.getElementById('history-modal').classList.remove('show');
        document.body.style.overflow = ''; // Restaurar scroll
    }
}

// Renderizar historial en el modal
function renderHistory() {
    const history = getHistory();
    const container = document.getElementById('history-list');
    const emptyState = document.getElementById('empty-history');

    if (history.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = history
        .map(
            entry => `
        <div class="history-item ${entry.isWinner ? 'winner' : 'loser'}">
            <div class="history-header">
                <span class="history-game">${entry.game}</span>
                <span class="history-date">${entry.date}</span>
            </div>
            <div class="history-details">
                ${entry.details}
            </div>
            ${
                entry.isWinner && entry.prize > 0
                    ? `
                <div class="history-prize">
                    💰 Premio: $${entry.prize.toLocaleString('es-CO')}
                </div>
            `
                    : ''
            }
        </div>
    `
        )
        .join('');
}

// ========================================
// FASE 3: DARK MODE
// ========================================
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Cargar tema guardado o usar el del sistema
    const savedTheme = localStorage.getItem('validador-balotos:theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    html.setAttribute('data-theme', theme);

    // Toggle de tema
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('validador-balotos:theme', newTheme);

        // Feedback visual
        Toast.info(`Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 2000);
    });
}

// ========================================
// FASE 3: COMPARTIR EN REDES SOCIALES
// ========================================
function showShareButtons(game, result) {
    const shareContainer = document.getElementById(`${game}-share`);
    if (!shareContainer) return;

    // Crear mensaje para compartir
    let shareText = '';
    if (result.isWinner) {
        shareText = `🎰 ¡Gané en ${game.toUpperCase()}! 💰 Premio: $${result.prize.toLocaleString('es-CO')}\\n`;
    } else {
        shareText = `Validé mi tiquete de ${game.toUpperCase()} 🎲\\n`;
    }

    shareText += `Mis números: ${result.userNumbers.join(', ')}\\n`;
    shareText += `Números ganadores: ${result.winningNumbers.join(', ')}\\n`;
    shareText += `Aciertos: ${result.matches}\\n`;
    shareText += `\\n🔗 Valida tus tiquetes en: ${window.location.origin}`;

    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.href);

    shareContainer.innerHTML = `
        <button class="btn-share btn-share-whatsapp" onclick="shareOnWhatsApp(\`${encodedText}\`)">
            📱 WhatsApp
        </button>
        <button class="btn-share btn-share-facebook" onclick="shareOnFacebook(\`${encodedUrl}\`)">
            👍 Facebook
        </button>
        <button class="btn-share btn-share-twitter" onclick="shareOnTwitter(\`${encodedText}\`)">
            🐦 Twitter
        </button>
        <button class="btn-share btn-share-copy" onclick="copyToClipboard(event, \`${shareText}\`)">
            📋 Copiar
        </button>
    `;

    shareContainer.style.display = 'flex';
}

function shareOnWhatsApp(text) {
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
    Toast.success('Abriendo WhatsApp...', 2000);
}

function shareOnFacebook(url) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    Toast.success('Abriendo Facebook...', 2000);
}

function shareOnTwitter(text) {
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'width=600,height=400');
    Toast.success('Abriendo Twitter...', 2000);
}

function copyToClipboard(event, text) {
    // Decodificar el texto
    const decodedText = decodeURIComponent(text);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(decodedText)
            .then(() => {
                Toast.success('¡Texto copiado al portapapeles!', 3000);

                // Cambiar color del botón temporalmente
                event.target.classList.add('copied');
                event.target.textContent = '✓ Copiado';

                setTimeout(() => {
                    event.target.classList.remove('copied');
                    event.target.textContent = '📋 Copiar';
                }, 2000);
            })
            .catch(() => {
                fallbackCopyToClipboard(decodedText);
            });
    } else {
        fallbackCopyToClipboard(decodedText);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        Toast.success('¡Texto copiado al portapapeles!', 3000);
    } catch (err) {
        Toast.error('No se pudo copiar el texto', 3000);
    }

    document.body.removeChild(textArea);
}
// ========================================
// ESTADÍSTICAS HISTÓRICAS
// ========================================

async function loadStatisticsData(event) {
    if (event && event.target) event.target.disabled = true;
    const container = document.getElementById('stats-container');
    if (!container) return;
    container.innerHTML = '<p class="helper-text">Cargando estadísticas...</p>';

    try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/statistics`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error');

        // La API devuelve: data.totals, data.baloto.top10, data.miloto.top10
        // top10 es un array de { number, count }
        function renderBars(top10, colorClass) {
            if (!top10 || !top10.length) return '<p class="helper-text">Sin datos suficientes</p>';
            const max = top10[0].count || 1;
            return top10
                .map(({ number, count }) => {
                    const pct = Math.round((count / max) * 100);
                    return `<div class="stat-bar-row">
                        <span class="stat-bar-label">${number}</span>
                        <div class="stat-bar-track"><div class="stat-bar-fill ${colorClass}" style="width:${pct}%"></div></div>
                        <span class="stat-bar-count">${count}</span>
                    </div>`;
                })
                .join('');
        }

        const totals = data.totals || {};
        container.innerHTML = `
            <div class="stats-summary">
                <div class="stat-card"><div class="stat-card-value">${totals.baloto ?? 0}</div><div class="stat-card-label">Sorteos Baloto</div></div>
                <div class="stat-card"><div class="stat-card-value">${totals.miloto ?? 0}</div><div class="stat-card-label">Sorteos Miloto</div></div>
                <div class="stat-card"><div class="stat-card-value">${totals.colorloto ?? 0}</div><div class="stat-card-label">Sorteos Colorloto</div></div>
            </div>
            <div class="stats-chart-section">
                <h3>🎰 Baloto — Top 10 números más frecuentes</h3>
                ${data.baloto?.hasEnoughData
                    ? `<div class="stats-bars">${renderBars(data.baloto.top10, 'baloto-bar')}</div>`
                    : `<p class="helper-text">Se necesitan al menos ${data.minRequired} sorteos (actuales: ${totals.baloto ?? 0})</p>`}
            </div>
            <div class="stats-chart-section">
                <h3>🎱 Miloto — Top 10 números más frecuentes</h3>
                ${data.miloto?.hasEnoughData
                    ? `<div class="stats-bars">${renderBars(data.miloto.top10, 'miloto-bar')}</div>`
                    : `<p class="helper-text">Se necesitan al menos ${data.minRequired} sorteos (actuales: ${totals.miloto ?? 0})</p>`}
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="helper-text">Error al cargar estadísticas: ${e.message}</p>`;
    } finally {
        if (event && event.target) event.target.disabled = false;
    }
}

// ========================================
// PORTAFOLIO ESTRATÉGICO
// ========================================

async function loadPortfolioReport(event) {
    if (event && event.target) event.target.disabled = true;
    const container = document.getElementById('portfolio-container');
    if (!container) return;
    container.innerHTML = '<p class="helper-text">Calculando portafolio...</p>';

    try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/portfolio`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error');

        const report = data.report;

        function renderCombinationsTable(combinations, isColorloto) {
            const rows = combinations
                .map(c => {
                    const numerosStr = isColorloto
                        ? c.pares.map(p => `${p.color}-${p.number}`).join(', ')
                        : `${c.numeros.join(', ')}${c.superBalota != null ? ' | SB: ' + c.superBalota : ''}`;
                    return `<tr>
                        <td>${c.estrategia}</td>
                        <td>${numerosStr}</td>
                        <td>${c.puntajeEstrategico}</td>
                        <td>${c.puntajePopularidad}</td>
                        <td>${c.sumaNumeros}</td>
                    </tr>`;
                })
                .join('');
            return `<table class="portfolio-table">
                <thead><tr><th>Estrategia</th><th>Combinación</th><th>Punt. Estratégico</th><th>Popularidad</th><th>Suma</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
        }

        function renderColorCoverage(cobertura) {
            if (!cobertura || !cobertura.sorteosAnalizados) return '';
            const colorLabel = { amarillo: 'Amarillo', azul: 'Azul', rojo: 'Rojo', verde: 'Verde', blanco: 'Blanco', negro: 'Negro' };
            const filas = cobertura.porColor
                .map(c => `<tr><td>${colorLabel[c.color] || c.color}</td><td>${c.pctAusente}%</td><td>${c.vecesAusente} / ${cobertura.sorteosAnalizados}</td></tr>`)
                .join('');
            return `<div class="portfolio-coverage-note">
                <p class="helper-text">
                    ⚠️ Cada tiquete cubre los 6 colores (uno c/u, sin repetir). Pero en el sorteo real, los 6 colores
                    distintos <strong>solo salieron ${cobertura.pctSeisColoresDistintos}%</strong> de las veces
                    (${cobertura.sorteosAnalizados} sorteos analizados) — casi siempre el sorteo repite o se salta
                    algún color, lo que hace que acertar las 6 parejas sea muy poco probable sin importar qué
                    números elijas. El plan de premios oficial también paga por 3, 4 o 5 aciertos, no solo por 6.
                </p>
                <table class="portfolio-table">
                    <thead><tr><th>Color</th><th>% de sorteos donde faltó</th><th>Sorteos</th></tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
        }

        function renderGameSection(name, gameData, isColorloto) {
            const combinaciones = gameData.combinaciones || gameData.combinacionesReutilizadasDeBaloto || [];
            return `<div class="portfolio-game-section">
                <h3>${name}</h3>
                ${gameData.nota ? `<p class="helper-text">${gameData.nota}</p>` : ''}
                ${isColorloto ? renderColorCoverage(gameData.coberturaColores) : ''}
                ${renderCombinationsTable(combinaciones, isColorloto)}
            </div>`;
        }

        container.innerHTML = `
            <p class="helper-text">${report.resumenEjecutivo}</p>
            ${renderGameSection('Baloto', report.juegos.Baloto, false)}
            ${renderGameSection('Baloto Revancha', report.juegos['Baloto Revancha'], false)}
            ${renderGameSection('Miloto', report.juegos.Miloto, false)}
            ${renderGameSection('Colorloto', report.juegos.Colorloto, true)}
            <div class="portfolio-game-section">
                <h3>Advertencia de juego responsable</h3>
                <p class="helper-text">${report.advertenciaJuegoResponsable}</p>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<p class="helper-text">Error al calcular el portafolio: ${e.message}</p>`;
    } finally {
        if (event && event.target) event.target.disabled = false;
    }
}

// ========================================
// FUNCIONES DE SORTEOS HISTÓRICOS
// ========================================

// Variables globales para almacenar sorteos históricos
let balotoHistoricalSorteos = [];
let milotoHistoricalSorteos = [];
let colorlotoHistoricalSorteos = [];

// Cargar lista de sorteos históricos al inicio
async function loadHistoricalSorteos() {
    try {
        // Cargar Baloto
        const [balotoResponse, milotoResponse, colorlotoResponse] = await Promise.all([
            fetch(`${LOCAL_SERVER_URL}/api/history/Baloto?limit=200`),
            fetch(`${LOCAL_SERVER_URL}/api/history/Miloto?limit=200`),
            fetch(`${LOCAL_SERVER_URL}/api/history/Colorloto?limit=200`),
        ]);

        if (balotoResponse.ok) {
            const data = await balotoResponse.json();
            if (data.success) { balotoHistoricalSorteos = data.sorteos; populateBalotoSelector(); }
        }
        if (milotoResponse.ok) {
            const data = await milotoResponse.json();
            if (data.success) { milotoHistoricalSorteos = data.sorteos; populateMilotoSelector(); }
        }
        if (colorlotoResponse.ok) {
            const data = await colorlotoResponse.json();
            if (data.success) { colorlotoHistoricalSorteos = data.sorteos; populateColorlotoSelector(); }
        }
    } catch (error) {
        console.error('Error cargando sorteos históricos:', error);
    }
}

// Extraer año de un string de fecha como "30 de Mayo de 2026" o "ayer Miércoles 31 de Diciembre de 2025"
function extractYear(fecha) {
    const m = (fecha || '').match(/\b(20\d{2})\b/);
    return m ? parseInt(m[1]) : null;
}

// Poblar selectores con sorteos del año en curso
function populateBalotoSelector() {
    const selector = document.getElementById('baloto-sorteo-selector');
    if (!selector) return;

    const currentYear = new Date().getFullYear();
    const sorteosOrdenados = [...balotoHistoricalSorteos]
        .filter(s => extractYear(s.fecha) === currentYear)
        .sort((a, b) => b.sorteo - a.sorteo);

    selector.innerHTML = '<option value="" style="color: inherit">Seleccionar sorteo...</option>';
    sorteosOrdenados.forEach(sorteo => {
        const option = document.createElement('option');
        option.value = sorteo.sorteo;
        option.style.color = 'inherit';
        option.textContent = `Sorteo ${sorteo.sorteo} - ${sorteo.fecha}`;
        selector.appendChild(option);
    });
}

function populateMilotoSelector() {
    const selector = document.getElementById('miloto-sorteo-selector');
    if (!selector) return;

    const currentYear = new Date().getFullYear();
    const sorteosOrdenados = [...milotoHistoricalSorteos]
        .filter(s => extractYear(s.fecha) === currentYear)
        .sort((a, b) => b.sorteo - a.sorteo);

    selector.innerHTML = '<option value="" style="color: inherit">Seleccionar sorteo...</option>';
    sorteosOrdenados.forEach(sorteo => {
        const option = document.createElement('option');
        option.value = sorteo.sorteo;
        option.style.color = 'inherit';
        option.textContent = `Sorteo ${sorteo.sorteo} - ${sorteo.fecha}`;
        selector.appendChild(option);
    });
}

function populateColorlotoSelector() {
    const selector = document.getElementById('colorloto-sorteo-selector');
    if (!selector) return;

    const currentYear = new Date().getFullYear();
    const sorteosOrdenados = [...colorlotoHistoricalSorteos]
        .filter(s => extractYear(s.fecha) === currentYear)
        .sort((a, b) => b.sorteo - a.sorteo);

    selector.innerHTML = '<option value="" style="color: inherit">Seleccionar sorteo...</option>';
    sorteosOrdenados.forEach(sorteo => {
        const option = document.createElement('option');
        option.value = sorteo.sorteo;
        option.style.color = 'inherit';
        option.textContent = `Sorteo ${sorteo.sorteo} - ${sorteo.fecha}`;
        selector.appendChild(option);
    });
}

// Toggle visibilidad de selectores
function toggleBalotoHistoricalSelector() {
    const selector = document.getElementById('baloto-sorteo-selector');
    const isHistorical = document.querySelector('input[name="baloto-sorteo-type"]:checked').value === 'historical';

    if (selector) {
        selector.classList.toggle('hidden', !isHistorical);

        // Actualizar indicador visual en las secciones de resultados
        const sorteoInfo = document.getElementById('sorteo-info');
        const sorteoRevanchaInfo = document.getElementById('sorteo-revancha-info');

        if (!isHistorical) {
            // Si cambia a último sorteo, limpiar info anterior
            if (sorteoInfo) {
                sorteoInfo.innerHTML = '';
                sorteoInfo.style.display = 'none';
            }
            if (sorteoRevanchaInfo) {
                sorteoRevanchaInfo.innerHTML = '';
                sorteoRevanchaInfo.style.display = 'none';
            }
        } else if (isHistorical && selector.value) {
            loadHistoricalBalotoResult(selector.value);
        }
    }
}

function toggleMilotoHistoricalSelector() {
    const selector = document.getElementById('miloto-sorteo-selector');
    const isHistorical = document.querySelector('input[name="miloto-sorteo-type"]:checked').value === 'historical';

    if (selector) {
        selector.classList.toggle('hidden', !isHistorical);

        // Actualizar indicador visual
        const sorteoInfo = document.getElementById('sorteo-miloto-info');

        if (!isHistorical) {
            // Si cambia a último sorteo, limpiar info anterior
            if (sorteoInfo) {
                sorteoInfo.innerHTML = '';
                sorteoInfo.style.display = 'none';
            }
        } else if (isHistorical && selector.value) {
            loadHistoricalMilotoResult(selector.value);
        }
    }
}

function toggleColorlotoHistoricalSelector() {
    const selector = document.getElementById('colorloto-sorteo-selector');
    const isHistorical = document.querySelector('input[name="colorloto-sorteo-type"]:checked').value === 'historical';

    if (selector) {
        selector.classList.toggle('hidden', !isHistorical);

        // Actualizar indicador visual
        const sorteoInfo = document.getElementById('sorteo-colorloto-info');

        if (!isHistorical) {
            // Si cambia a último sorteo, limpiar info anterior
            if (sorteoInfo) {
                sorteoInfo.innerHTML = '';
                sorteoInfo.style.display = 'none';
            }
        } else if (isHistorical && selector.value) {
            loadHistoricalColorlotoResult(selector.value);
        }
    }
}

// Cargar resultado histórico específico
async function loadHistoricalBalotoResult(sorteoId) {
    try {
        // Cargar Baloto y Revancha en paralelo
        const [balotoResponse, revanchaResponse] = await Promise.all([
            fetch(`${LOCAL_SERVER_URL}/api/history/Baloto/${sorteoId}`),
            fetch(`${LOCAL_SERVER_URL}/api/history/${encodeURIComponent('Baloto Revancha')}/${sorteoId}`),
        ]);

        const balotoData = await balotoResponse.json();
        let revanchaData = { success: false };

        if (revanchaResponse.ok) {
            revanchaData = await revanchaResponse.json();
        }

        // Cargar resultados de Baloto
        if (balotoData.success) {
            const ballsDisplay = document.getElementById('baloto-results-display');
            if (ballsDisplay) {
                const balls = ballsDisplay.querySelectorAll('.result-ball');

                balotoData.sorteo.numeros.forEach((num, index) => {
                    if (balls[index]) {
                        balls[index].textContent = num.toString().padStart(2, '0');
                        balls[index].classList.remove('empty');
                    }
                });

                if (balls[5] && balotoData.sorteo.superBalota) {
                    balls[5].textContent = balotoData.sorteo.superBalota.toString().padStart(2, '0');
                    balls[5].classList.remove('empty');
                }
            }

            const sorteoInfoElement = document.getElementById('sorteo-info');
            if (sorteoInfoElement) {
                sorteoInfoElement.innerHTML = `<span class="sorteo-numero">🎲 Sorteo #${balotoData.sorteo.sorteo}</span><span class="sorteo-fecha">📅 ${balotoData.sorteo.fecha}</span>`;
                sorteoInfoElement.style.display = 'flex';
            }
        }

        // Cargar resultados de Revancha
        if (revanchaData.success) {
            const ballsDisplay = document.getElementById('baloto-revancha-results-display');
            if (ballsDisplay) {
                const balls = ballsDisplay.querySelectorAll('.result-ball');

                revanchaData.sorteo.numeros.forEach((num, index) => {
                    if (balls[index]) {
                        balls[index].textContent = num.toString().padStart(2, '0');
                        balls[index].classList.remove('empty');
                    }
                });

                if (balls[5] && revanchaData.sorteo.superBalota) {
                    balls[5].textContent = revanchaData.sorteo.superBalota.toString().padStart(2, '0');
                    balls[5].classList.remove('empty');
                }
            }

            const sorteoInfoElement = document.getElementById('sorteo-revancha-info');
            if (sorteoInfoElement) {
                sorteoInfoElement.innerHTML = `<span class="sorteo-numero">🎯 Sorteo #${revanchaData.sorteo.sorteo}</span><span class="sorteo-fecha">📅 ${revanchaData.sorteo.fecha}</span>`;
                sorteoInfoElement.style.display = 'flex';
            }
        }

        if (balotoData.success || revanchaData.success) {
            Toast.success(
                `📜 Sorteo histórico #${sorteoId} cargado (Baloto ${balotoData.success ? '✓' : '✗'} / Revancha ${revanchaData.success ? '✓' : '✗'})`,
                4000
            );
        } else {
            Toast.warning('No se encontraron datos para este sorteo');
        }
    } catch (error) {
        console.error('Error cargando sorteo histórico:', error);
        Toast.error('Error al cargar sorteo histórico');
    }
}

async function loadHistoricalMilotoResult(sorteoId) {
    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/history/Miloto/${sorteoId}`);
        const data = await response.json();

        if (data.success) {
            const ballsDisplay = document.getElementById('miloto-results-display');
            if (ballsDisplay) {
                const balls = ballsDisplay.querySelectorAll('.result-ball');

                data.sorteo.numeros.forEach((num, index) => {
                    if (balls[index]) {
                        balls[index].textContent = num.toString().padStart(2, '0');
                        balls[index].classList.remove('empty');
                    }
                });
            }

            const sorteoInfoElement = document.getElementById('sorteo-miloto-info');
            if (sorteoInfoElement) {
                sorteoInfoElement.innerHTML = `<span class="sorteo-numero">🎲 Sorteo #${data.sorteo.sorteo}</span><span class="sorteo-fecha">📅 ${data.sorteo.fecha}</span>`;
                sorteoInfoElement.style.display = 'flex';
            }

            Toast.success(`Sorteo histórico #${sorteoId} cargado`, 2000);
        }
    } catch (error) {
        console.error('Error cargando sorteo histórico:', error);
        Toast.error('Error al cargar sorteo histórico');
    }
}

async function loadHistoricalColorlotoResult(sorteoId) {
    try {
        const response = await fetch(`${LOCAL_SERVER_URL}/api/history/Colorloto/${sorteoId}`);
        const data = await response.json();

        if (data.success) {
            const ballsDisplay = document.getElementById('colorloto-results-display');
            if (ballsDisplay && data.sorteo.colorNumberPairs) {
                const balls = ballsDisplay.querySelectorAll('.result-ball');
                const colorOrder = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
                const sortedPairs = [...data.sorteo.colorNumberPairs].sort(
                    (a, b) => colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color)
                );

                sortedPairs.forEach((pair, index) => {
                    if (balls[index]) {
                        balls[index].className = 'result-ball';
                        balls[index].classList.add(`colorloto-${pair.color}`);
                        balls[index].setAttribute('data-color', pair.color);
                        balls[index].textContent = pair.number.toString();
                    }
                });
            }

            const sorteoInfoElement = document.getElementById('sorteo-colorloto-info');
            if (sorteoInfoElement) {
                sorteoInfoElement.innerHTML = `<span class="sorteo-numero">🎲 Sorteo #${data.sorteo.sorteo}</span><span class="sorteo-fecha">📅 ${data.sorteo.fecha}</span>`;
                sorteoInfoElement.style.display = 'flex';
            }

            Toast.success(`Sorteo histórico #${sorteoId} cargado`, 2000);
        }
    } catch (error) {
        console.error('Error cargando sorteo histórico:', error);
        Toast.error('Error al cargar sorteo histórico');
    }
}

// Listeners para selectores
document.addEventListener('DOMContentLoaded', () => {
    // Cargar sorteos históricos al inicio
    loadHistoricalSorteos();

    // Listeners para cambios en selectores
    const balotoSelector = document.getElementById('baloto-sorteo-selector');
    if (balotoSelector) {
        balotoSelector.addEventListener('change', e => {
            if (e.target.value) {
                loadHistoricalBalotoResult(e.target.value);
            }
        });
    }

    const milotoSelector = document.getElementById('miloto-sorteo-selector');
    if (milotoSelector) {
        milotoSelector.addEventListener('change', e => {
            if (e.target.value) {
                loadHistoricalMilotoResult(e.target.value);
            }
        });
    }

    const colorlotoSelector = document.getElementById('colorloto-sorteo-selector');
    if (colorlotoSelector) {
        colorlotoSelector.addEventListener('change', e => {
            if (e.target.value) {
                loadHistoricalColorlotoResult(e.target.value);
            }
        });
    }
});
