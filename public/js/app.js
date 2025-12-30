// API Configuration
const LOCAL_SERVER_URL = 'http://localhost:3000'; // Servidor de scraping local

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
        });
    });

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeHistoryModal({ target: { classList: { contains: () => true } } });
        }
    });

    // Inicializar badge del historial
    updateHistoryBadge();

    // Inicializar modo oscuro
    initDarkMode();

    console.log('✅ Todos los event listeners registrados');
});

// Prize tables based on Colombian lottery rules
const balotoPrizes = {
    '5+1': { category: 'Acumulado (5 números + Súper Balota)', prize: 15000000000, key: 'baloto_ganadores1_valor' },
    '5+0': { category: '5 números', prize: 50000000, key: 'baloto_ganadores2_valor' },
    '4+1': { category: '4 números + Súper Balota', prize: 5000000, key: 'baloto_ganadores3_valor' },
    '4+0': { category: '4 números', prize: 200000, key: 'baloto_ganadores4_valor' },
    '3+1': { category: '3 números + Súper Balota', prize: 100000, key: 'baloto_ganadores5_valor' },
    '3+0': { category: '3 números', prize: 20000, key: 'baloto_ganadores6_valor' },
    '2+1': { category: '2 números + Súper Balota', prize: 10000, key: 'baloto_ganadores7_valor' },
};

const milotoPrizes = {
    5: { category: '5 números', prize: 5000000 },
    4: { category: '4 números', prize: 100000 },
    3: { category: '3 números', prize: 10000 },
    2: { category: '2 números', prize: 5000 },
};

const colorlotoPrizes = {
    6: { category: '6 combinaciones exactas', prize: 10000000 },
    5: { category: '5 combinaciones exactas', prize: 1000000 },
    4: { category: '4 combinaciones exactas', prize: 100000 },
    3: { category: '3 combinaciones exactas', prize: 10000 },
    2: { category: '2 combinaciones exactas', prize: 5000 },
};

// ========================================
// LOAD LATEST RESULTS FUNCTIONS
// ========================================
async function loadLatestBalotoResults() {
    console.log('Intentando cargar resultados de Baloto...');
    console.log('URL del servidor:', LOCAL_SERVER_URL);

    const button = event?.target;
    if (button) setButtonLoading(button, true);

    try {
        const url = `${LOCAL_SERVER_URL}/api/baloto`;
        console.log('Consultando:', url);

        Toast.info('Cargando resultados de Baloto...', 2000);

        const response = await fetch(url);
        console.log('Respuesta recibida, status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Datos parseados:', result);

        if (!result.success) {
            console.error('Error en la respuesta:', result.error);
            Toast.error(
                `${result.error}. Números encontrados: ${result.numbersFound || 0}, Súper Balota: ${
                    result.superBalotaFound || 0
                }`,
                5000
            );
            return;
        }

        // Llenar los inputs con los resultados
        const resultInputs = document.querySelectorAll('.baloto-result');
        result.numbers.forEach((num, index) => {
            if (resultInputs[index]) {
                resultInputs[index].value = num;
            }
        });

        document.querySelector('.baloto-result-super').value = result.superBalota;

        // Animar los números cargados
        animateLoadedNumbers('.baloto-result');
        setTimeout(() => {
            const superInput = document.querySelector('.baloto-result-super');
            if (superInput) {
                superInput.classList.add('loaded');
                setTimeout(() => superInput.classList.remove('loaded'), 500);
            }
        }, 500);

        // Mostrar información del sorteo
        const sorteoInfoElement = document.getElementById('sorteo-info');
        if (sorteoInfoElement) {
            let infoHTML = '';
            if (result.sorteo) {
                infoHTML += `<span class="sorteo-numero">Sorteo #${result.sorteo}</span>`;
            }
            if (result.fecha) {
                infoHTML += `<span class="sorteo-fecha">${result.fecha}</span>`;
            }
            sorteoInfoElement.innerHTML = infoHTML;
            sorteoInfoElement.style.display = infoHTML ? 'flex' : 'none';
        }

        let toastText = `✅ Resultados cargados desde ${result.source}`;
        Toast.success(toastText, 4000);
    } catch (error) {
        console.error('Error completo:', error);
        Toast.error(
            'Error al cargar resultados. Asegúrate de tener el servidor corriendo (npm start) y abrir en http://localhost:3000',
            6000
        );
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

async function loadLatestBalotoRevanchaResults() {
    console.log('Intentando cargar resultados de Baloto Revancha...');

    const button = event?.target;
    if (button) setButtonLoading(button, true);

    try {
        const url = `${LOCAL_SERVER_URL}/api/baloto-revancha`;
        Toast.info('Cargando resultados de Baloto Revancha...', 2000);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            Toast.error(`${result.error}. Números encontrados: ${result.numbersFound || 0}`, 5000);
            return;
        }

        // Llenar los inputs con los resultados
        const resultInputs = document.querySelectorAll('.baloto-revancha-result');
        result.numbers.forEach((num, index) => {
            if (resultInputs[index]) {
                resultInputs[index].value = num;
            }
        });

        document.querySelector('.baloto-revancha-result-super').value = result.superBalota;

        // Animar los números cargados
        animateLoadedNumbers('.baloto-revancha-result');
        setTimeout(() => {
            const superInput = document.querySelector('.baloto-revancha-result-super');
            if (superInput) {
                superInput.classList.add('loaded');
                setTimeout(() => superInput.classList.remove('loaded'), 500);
            }
        }, 500);

        // Mostrar información del sorteo
        const sorteoInfoElement = document.getElementById('sorteo-revancha-info');
        if (sorteoInfoElement) {
            let infoHTML = '';
            if (result.sorteo) {
                infoHTML += `<span class="sorteo-numero">Sorteo #${result.sorteo}</span>`;
            }
            if (result.fecha) {
                infoHTML += `<span class="sorteo-fecha">${result.fecha}</span>`;
            }
            sorteoInfoElement.innerHTML = infoHTML;
            sorteoInfoElement.style.display = infoHTML ? 'flex' : 'none';
        }

        Toast.success(`✅ Resultados de Revancha cargados desde ${result.source}`, 4000);
    } catch (error) {
        console.error('Error completo:', error);
        Toast.error('Error al cargar resultados de Baloto Revancha', 6000);
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

async function loadLatestMilotoResults() {
    console.log('Intentando cargar resultados de Miloto...');
    console.log('URL del servidor:', LOCAL_SERVER_URL);

    const button = event?.target;
    if (button) setButtonLoading(button, true);

    try {
        const url = `${LOCAL_SERVER_URL}/api/miloto`;
        console.log('Consultando:', url);

        Toast.info('Cargando resultados de Miloto...', 2000);

        const response = await fetch(url);
        console.log('Respuesta recibida:', response.status);

        const result = await response.json();
        console.log('Datos:', result);

        if (!result.success) {
            Toast.error(`${result.error}. Por favor, ingresa los números manualmente desde la página oficial.`, 5000);
            return;
        }

        if (result.numbers.length !== 5) {
            Toast.error('Se esperaban 5 números del Miloto. Por favor, ingresa los números manualmente.', 5000);
            return;
        }

        // Llenar los inputs con los resultados
        const resultInputs = document.querySelectorAll('.miloto-result');
        result.numbers.forEach((num, index) => {
            if (resultInputs[index]) {
                resultInputs[index].value = num;
            }
        });

        // Animar los números cargados
        animateLoadedNumbers('.miloto-result');

        // Mostrar información del sorteo
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

async function loadLatestColorlotoResults() {
    console.log('Intentando cargar resultados de Colorloto...');
    console.log('URL del servidor:', LOCAL_SERVER_URL);

    const button = event?.target;
    if (button) setButtonLoading(button, true);

    try {
        const url = `${LOCAL_SERVER_URL}/api/colorloto`;
        console.log('Consultando:', url);

        Toast.info('Cargando resultados de Colorloto...', 2000);

        const response = await fetch(url);
        console.log('Respuesta recibida:', response.status);

        const result = await response.json();
        console.log('Datos:', result);

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

        // Llenar los selectores y inputs con los resultados
        const resultColors = document.querySelectorAll('.result-color');
        const resultNumbers = document.querySelectorAll('.result-number');

        result.colorNumberPairs.forEach((pair, index) => {
            if (resultColors[index] && resultNumbers[index]) {
                resultColors[index].value = pair.color;
                resultNumbers[index].value = pair.number;
            }
        });

        // Animar los números cargados
        animateLoadedNumbers('.result-number');

        // Mostrar información del sorteo
        const pairsDisplay = result.colorNumberPairs.map(p => `${p.color} ${p.number}`).join(', ');
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
    const resultInputs = document.querySelectorAll('.baloto-result');
    const numbers = [];

    // Generate 5 unique random numbers between 1-43
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 43) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);
    resultInputs.forEach((input, index) => {
        input.value = numbers[index];
    });

    // Generate Súper Balota (1-16)
    const superBallot = Math.floor(Math.random() * 16) + 1;
    document.querySelector('.baloto-result-super').value = superBallot;
}

function generateRandomBalotoRevancha() {
    const resultInputs = document.querySelectorAll('.baloto-revancha-result');
    const numbers = [];

    // Generate 5 unique random numbers between 1-43
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 43) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);
    resultInputs.forEach((input, index) => {
        input.value = numbers[index];
    });

    // Generate Súper Balota (1-16)
    const superBallot = Math.floor(Math.random() * 16) + 1;
    document.querySelector('.baloto-revancha-result-super').value = superBallot;
}

function generateRandomMiloto() {
    const resultInputs = document.querySelectorAll('.miloto-result');
    const numbers = [];

    // Generate 5 unique random numbers between 1-39
    while (numbers.length < 5) {
        const num = Math.floor(Math.random() * 39) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    numbers.sort((a, b) => a - b);
    resultInputs.forEach((input, index) => {
        input.value = numbers[index];
    });
}

function generateRandomColorloto() {
    const colors = ['amarillo', 'azul', 'rojo', 'verde', 'blanco', 'negro'];
    const usedColors = [];

    const resultColors = document.querySelectorAll('.result-color');
    const resultNumbers = document.querySelectorAll('.result-number');

    // Generate 6 unique color-number combinations
    for (let i = 0; i < 6; i++) {
        // Pick a color that hasn't been used
        let color;
        do {
            color = colors[Math.floor(Math.random() * colors.length)];
        } while (usedColors.includes(color));
        usedColors.push(color);

        // Assign random number 1-7
        const number = Math.floor(Math.random() * 7) + 1;

        resultColors[i].value = color;
        resultNumbers[i].value = number;
    }
}

// Validation functions
function validateBaloto() {
    const userNumbers = getInputValues('.baloto-number');
    const resultNumbers = getInputValues('.baloto-result');
    const userSuper = parseInt(document.querySelector('.baloto-super').value);
    const resultSuper = parseInt(document.querySelector('.baloto-result-super').value);

    if (userNumbers.length !== 5 || resultNumbers.length !== 5 || isNaN(userSuper) || isNaN(resultSuper)) {
        Toast.warning('Por favor, completa todos los campos', 3000);
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

    // Determine prize
    let prizeKey = `${matches}+${superMatch ? 1 : 0}`;
    let prize = balotoPrizes[prizeKey];

    // Agregar badge de aciertos
    const matchBadge = `<span class="match-badge">✓ ${matches} aciertos${superMatch ? ' + Super Balota' : ''}</span>`;

    const details = [
        `Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${userSuper}`,
        `Números ganadores: ${resultNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${resultSuper}`,
        matchBadge,
    ];

    if (prize) {
        // Determinar si es premio grande (más de 50 millones)
        const isBigPrize = prize.prize >= 50000000;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : '🎉';

        Toast.success(`¡GANASTE! ${prize.category} - $${prize.prize.toLocaleString('es-CO')}`, 7000, '¡FELICIDADES!');
        showResult(
            'baloto-result',
            true,
            `${trophy} ¡FELICIDADES! ¡GANASTE!`,
            [...details, `Categoría: ${prize.category}`],
            prize.prize,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Baloto', details.join(' | '), true, prize.prize);

        // Celebración para premios grandes
        if (isBigPrize) {
            document.getElementById('baloto-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('baloto-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        showResult(
            'baloto-result',
            false,
            '😢 No ganaste esta vez',
            [...details, 'Sigue intentando, ¡la próxima será!'],
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
    const resultNumbers = getInputValues('.baloto-revancha-result');
    const userSuper = parseInt(document.querySelector('.baloto-revancha-super').value);
    const resultSuper = parseInt(document.querySelector('.baloto-revancha-result-super').value);

    if (userNumbers.length !== 5 || resultNumbers.length !== 5 || isNaN(userSuper) || isNaN(resultSuper)) {
        Toast.warning('Por favor, completa todos los campos', 3000);
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
    let prize = balotoPrizes[prizeKey];

    const matchBadge = `<span class="match-badge">✓ ${matches} aciertos${superMatch ? ' + Super Balota' : ''}</span>`;

    const details = [
        `Tus números: ${userNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${userSuper}`,
        `Números ganadores: ${resultNumbers.sort((a, b) => a - b).join(', ')} | Súper Balota: ${resultSuper}`,
        matchBadge,
    ];

    if (prize) {
        const isBigPrize = prize.prize >= 50000000;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : '🎉';

        Toast.success(`¡GANASTE! ${prize.category} - $${prize.prize.toLocaleString('es-CO')}`, 7000, '¡FELICIDADES!');
        showResult(
            'baloto-revancha-result',
            true,
            `${trophy} ¡FELICIDADES! ¡GANASTE EN REVANCHA!`,
            [...details, `Categoría: ${prize.category}`],
            prize.prize,
            userNumbers,
            resultNumbers,
            matches
        );

        saveToHistory('Baloto Revancha', details.join(' | '), true, prize.prize);

        if (isBigPrize) {
            document.getElementById('baloto-revancha-result').classList.add('celebration');
            setTimeout(() => {
                document.getElementById('baloto-revancha-result').classList.remove('celebration');
            }, 800);
        }
    } else {
        showResult(
            'baloto-revancha-result',
            false,
            '😢 No ganaste esta vez',
            [...details, 'Sigue intentando, ¡la próxima será!'],
            0,
            userNumbers,
            resultNumbers,
            matches
        );

        saveToHistory('Baloto Revancha', details.join(' | '), false, 0);
    }
}

function validateMiloto() {
    const userNumbers = getInputValues('.miloto-number');
    const resultNumbers = getInputValues('.miloto-result');

    if (userNumbers.length !== 5 || resultNumbers.length !== 5) {
        Toast.warning('Por favor, completa todos los campos (5 números)', 3000);
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

    if (prize) {
        const isBigPrize = prize.prize >= 1000000;
        const trophy = isBigPrize ? '<span class="prize-trophy">🏆</span>' : '🎉';

        Toast.success(`¡GANASTE! ${prize.category} - $${prize.prize.toLocaleString('es-CO')}`, 7000, '¡FELICIDADES!');
        showResult(
            'miloto-result',
            true,
            `${trophy} ¡FELICIDADES! ¡GANASTE!`,
            [...details, `Categoría: ${prize.category}`],
            prize.prize,
            userNumbers,
            resultNumbers,
            matches
        );

        // Guardar en historial
        saveToHistory('Miloto', details.join(' | '), true, prize.prize);

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

    // Get user selections
    document.querySelectorAll('.user-color').forEach((select, index) => {
        userColors[index] = select.value;
    });
    document.querySelectorAll('.user-number').forEach((input, index) => {
        userNumbers[index] = parseInt(input.value);
    });

    // Get result selections
    document.querySelectorAll('.result-color').forEach((select, index) => {
        resultColors[index] = select.value;
    });
    document.querySelectorAll('.result-number').forEach((input, index) => {
        resultNumbers[index] = parseInt(input.value);
    });

    // Validate all fields are filled
    if (
        userColors.some(c => !c) ||
        userNumbers.some(n => isNaN(n)) ||
        resultColors.some(c => !c) ||
        resultNumbers.some(n => isNaN(n))
    ) {
        Toast.warning('Por favor, completa todos los campos (6 colores con sus números)', 3000);
        return;
    }

    // Validate numbers are in range 1-7
    if (userNumbers.some(n => n < 1 || n > 7) || resultNumbers.some(n => n < 1 || n > 7)) {
        Toast.warning('Los números deben estar entre 1 y 7', 3000);
        return;
    }

    // Check for duplicate colors in user selection
    if (new Set(userColors).size !== 6) {
        Toast.warning('No puedes repetir colores en tu selección', 3000);
        return;
    }

    // Check for duplicate numbers with same color (color-number pairs can't repeat)
    const userPairs = userColors.map((c, i) => `${c}-${userNumbers[i]}`);
    if (new Set(userPairs).size !== 6) {
        Toast.warning('No puedes tener combinaciones idénticas de color y número', 3000);
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

// Validación para Colorloto
function validateColorlotoInputs() {
    const numberInputs = document.querySelectorAll('.user-number');
    const colorSelects = document.querySelectorAll('.user-color');

    const colors = Array.from(colorSelects)
        .map(s => s.value)
        .filter(v => v);

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

        input.classList.add('valid');
    });

    // Validar colores duplicados
    colorSelects.forEach(select => {
        select.classList.remove('duplicate');
        if (select.value && colors.filter(c => c === select.value).length > 1) {
            select.classList.add('duplicate');
        }
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
        if (e.target.value.length >= 1 && index < inputs.length - 1) {
            // Move to next input in the same section
            const nextInput = inputs[index + 1];
            if (nextInput && nextInput.closest('.input-section') === input.closest('.input-section')) {
                nextInput.focus();
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

document.querySelectorAll('.user-number, .user-color').forEach(input => {
    input.addEventListener('input', validateColorlotoInputs);
    input.addEventListener('change', validateColorlotoInputs);
    input.addEventListener('blur', validateColorlotoInputs);
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

    localStorage.setItem('validationHistory', JSON.stringify(history));
    updateHistoryBadge();
}

// Obtener historial
function getHistory() {
    const stored = localStorage.getItem('validationHistory');
    return stored ? JSON.parse(stored) : [];
}

// Limpiar historial
function clearHistory() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
        localStorage.removeItem('validationHistory');
        updateHistoryBadge();
        renderHistory();
        Toast.success('Historial limpiado correctamente', 3000);
    }
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
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    html.setAttribute('data-theme', theme);

    // Toggle de tema
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

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
        <button class="btn-share btn-share-copy" onclick="copyToClipboard(\`${shareText}\`)">
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

function copyToClipboard(text) {
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
