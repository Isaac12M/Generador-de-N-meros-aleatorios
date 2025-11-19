// Elementos DOM
const elements = {
    seed: document.getElementById('seed'),
    multiplier: document.getElementById('multiplier'),
    increment: document.getElementById('increment'),
    modulus: document.getElementById('modulus'),
    count: document.getElementById('count'),
    generateBtn: document.getElementById('generateBtn'),
    resetBtn: document.getElementById('resetBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    numbersContainer: document.getElementById('numbersContainer'),
    validationSection: document.getElementById('validationSection'),
    messageDiv: document.getElementById('message'),
    confirmationModal: document.getElementById('confirmationModal'),
    confirmYes: document.getElementById('confirmYes'),
    confirmNo: document.getElementById('confirmNo')
};

// Variables globales
let currentNumbers = [];
let scatterChart = null;

// Configuración
const CONFIG = {
    alpha: 0.05,
    z_alpha_2: 1.96
};

// Tabla Chi-cuadrado para α = 0.05
const CHI_SQUARE_TABLE = {
    1: 3.8415, 2: 5.9915, 3: 7.8147, 4: 9.4877, 5: 11.0705,
    6: 12.5916, 7: 14.0671, 8: 15.5073, 9: 16.9190, 10: 18.3070,
    11: 19.6751, 12: 21.0261, 13: 22.3620, 14: 23.6848, 15: 24.9958,
    16: 26.2962, 17: 27.5871, 18: 28.8693, 19: 30.1435, 20: 31.4104,
    25: 37.6525, 30: 43.7730, 35: 49.8018, 40: 55.7585, 45: 61.6562, 50: 67.5048
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupEventListeners();
});

// Configurar eventos
function setupEventListeners() {
    elements.generateBtn.addEventListener('click', handleGenerate);
    elements.resetBtn.addEventListener('click', handleReset);
    elements.regenerateBtn.addEventListener('click', handleRegenerate);
    elements.confirmYes.addEventListener('click', confirmGeneration);
    elements.confirmNo.addEventListener('click', cancelGeneration);
    
    elements.count.addEventListener('input', updateModulusFromCount);
    elements.modulus.addEventListener('focus', () => elements.modulus.blur());
}

// Inicializar gráficos
function initializeCharts() {
    scatterChart = new Chart(document.getElementById('scatterChart'), {
        type: 'scatter',
        data: { datasets: [{
            label: 'Números Aleatorios',
            data: [],
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            pointRadius: 6
        }]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Índice' }, min: 0 },
                y: { title: { display: true, text: 'Valor Normalizado' }, min: 0, max: 1 }
            }
        }
    });
}

// Actualizar módulo automáticamente
function updateModulusFromCount() {
    const count = parseInt(elements.count.value);
    if (!isNaN(count) && count >= 100) {
        let modulus = 2;
        while (modulus < count) modulus *= 2;
        elements.modulus.value = modulus;
        showMessage(`Módulo actualizado: ${modulus}`, 'info');
    }
}

// Mostrar mensaje
function showMessage(message, type = 'info') {
    elements.messageDiv.textContent = message;
    elements.messageDiv.className = type;
    if (type !== 'error') setTimeout(() => elements.messageDiv.textContent = '', 5000);
}

// Generar números
function generateNumbers(seed, multiplier, increment, modulus, count) {
    currentNumbers = [];
    let x = seed;
    
    for (let i = 0; i < count; i++) {
        x = (multiplier * x + increment) % modulus;
        currentNumbers.push({
            index: i + 1,
            value: x,
            normalized: x / (modulus - 1)
        });
    }
    
    displayNumbers();
    updateCharts();
    runValidationTests();
}

// Mostrar números
function displayNumbers() {
    elements.numbersContainer.innerHTML = '';
    currentNumbers.forEach(num => {
        const div = document.createElement('div');
        div.className = 'number-item';
        div.textContent = num.normalized.toFixed(4);
        elements.numbersContainer.appendChild(div);
    });
}

// Actualizar gráficos
function updateCharts() {
    scatterChart.data.datasets[0].data = currentNumbers.map(num => ({
        x: num.index,
        y: num.normalized
    }));
    scatterChart.update();
}

// Pruebas de validación
function runValidationTests() {
    const tests = [
        testUniformityMean(),
        testUniformityVariance(),
        testUniformityChiSquare(),
        testRunsUpDown()
    ];
    
    displayValidationResults(tests);
}

function testUniformityMean() {
    const n = currentNumbers.length;
    const mean = currentNumbers.reduce((sum, num) => sum + num.normalized, 0) / n;
    const lowerLimit = 0.5 - CONFIG.z_alpha_2 * (1 / Math.sqrt(12 * n));
    const upperLimit = 0.5 + CONFIG.z_alpha_2 * (1 / Math.sqrt(12 * n));
    
    return {
        name: "Prueba de Uniformidad - Media",
        passes: mean >= lowerLimit && mean <= upperLimit,
        details: {
            mean: mean.toFixed(6),
            lowerLimit: lowerLimit.toFixed(6),
            upperLimit: upperLimit.toFixed(6),
            expected: "0.500000"
        }
    };
}

function testUniformityVariance() {
    const n = currentNumbers.length;
    const mean = currentNumbers.reduce((sum, num) => sum + num.normalized, 0) / n;
    const variance = currentNumbers.reduce((sum, num) => sum + Math.pow(num.normalized - mean, 2), 0) / (n - 1);
    const lowerLimit = (1 / 12) - CONFIG.z_alpha_2 * Math.sqrt(1 / (180 * n));
    const upperLimit = (1 / 12) + CONFIG.z_alpha_2 * Math.sqrt(1 / (180 * n));
    
    return {
        name: "Prueba de Uniformidad - Varianza",
        passes: variance >= lowerLimit && variance <= upperLimit,
        details: {
            variance: variance.toFixed(6),
            lowerLimit: lowerLimit.toFixed(6),
            upperLimit: upperLimit.toFixed(6),
            expected: (1/12).toFixed(6)
        }
    };
}

function testUniformityChiSquare() {
    const n = currentNumbers.length;
    const data = currentNumbers.map(num => num.normalized);
    
    // Calcular número de intervalos (m = √n)
    const m = Math.floor(Math.sqrt(n));
    const intervalSize = 1 / m;
    
    // Frecuencias observadas
    const observed = new Array(m).fill(0);
    data.forEach(value => {
        const index = Math.min(Math.floor(value / intervalSize), m - 1);
        observed[index]++;
    });
    
    // Frecuencia esperada
    const expected = n / m;
    
    // Calcular estadístico Chi-cuadrado
    let chiSquared = 0;
    for (let i = 0; i < m; i++) {
        chiSquared += Math.pow(observed[i] - expected, 2) / expected;
    }
    
    // Obtener valor crítico (grados de libertad = m - 1)
    const degreesOfFreedom = m - 1;
    const criticalValue = CHI_SQUARE_TABLE[degreesOfFreedom] || (degreesOfFreedom + Math.sqrt(2 * degreesOfFreedom) * 1.645);
    
    // La prueba pasa si chiSquared < criticalValue
    const passes = chiSquared < criticalValue;
    
    return {
        name: "Prueba de Uniformidad - Chi Cuadrado",
        passes: passes,
        details: {
            chiSquared: chiSquared.toFixed(4),
            criticalValue: criticalValue.toFixed(4),
            intervals: m,
            degreesOfFreedom: degreesOfFreedom
        }
    };
}

function testRunsUpDown() {
    const n = currentNumbers.length;
    const data = currentNumbers.map(num => num.normalized);
    
    // Generar secuencia de corridas (1 = sube, 0 = baja)
    const runs = [];
    for (let i = 1; i < n; i++) {
        runs.push(data[i] > data[i - 1] ? 1 : 0);
    }
    
    // Contar corridas observadas
    let observedRuns = 1;
    for (let i = 1; i < runs.length; i++) {
        if (runs[i] !== runs[i - 1]) {
            observedRuns++;
        }
    }
    
    // Calcular parámetros estadísticos
    const expectedRuns = (2 * n - 1) / 3;
    const varianceRuns = (16 * n - 29) / 90;
    const stdDevRuns = Math.sqrt(varianceRuns);
    
    // Calcular estadístico Z0
    const Z0 = (observedRuns - expectedRuns) / stdDevRuns;
    
    // La prueba pasa si |Z0| ≤ 1.96
    const passes = Math.abs(Z0) <= 1.96;
    
    return {
        name: "Prueba de Independencia - Corridas Arriba/Abajo",
        passes: passes,
        details: {
            Z0: Math.abs(Z0).toFixed(4),
            criticalValue: "1.9600",
            observedRuns: observedRuns,
            expectedRuns: expectedRuns.toFixed(2)
        }
    };
}

// Mostrar resultados de validación
function displayValidationResults(tests) {
    elements.validationSection.innerHTML = '<h2>Pruebas de Validación</h2>';
    const testList = document.createElement('div');
    testList.className = 'validation-list';
    
    tests.forEach(test => {
        const testElement = document.createElement('div');
        testElement.className = 'test-item-list';
        const status = test.passes ? 'APRUEBA' : 'NO APRUEBA';
        
        let detailsHTML = '';
        
        if (test.name === "Prueba de Uniformidad - Chi Cuadrado") {
            detailsHTML = `
                <div class="test-description">La prueba verifica la uniformidad (que los números estén repartidos equitativamente en los intervalos). Para que la hipótesis de uniformidad se mantenga, el estadístico de prueba calculado debe ser inferior al valor crítico.</div>
                <div><strong>Chi calculado:</strong> ${test.details.chiSquared}</div>
                <div><strong>Límite crítico:</strong> ${test.details.criticalValue}</div>
                <div><strong>Intervalos:</strong> ${test.details.intervals}</div>
            `;
        } else if (test.name === "Prueba de Independencia - Corridas Arriba/Abajo") {
            detailsHTML = `
                <div class="test-description">La prueba funciona si el resultado de la verificación (llamado estadístico Z0) cae dentro de los límites que la prueba considera normales o aceptables. Si queda dentro de ese rango, concluimos que la secuencia sí es aleatoria.</div>
                <div><strong>Zo calculado:</strong> ${test.details.Z0}</div>
                <div><strong>Límite crítico:</strong> ${test.details.criticalValue}</div>
                <div><strong>Corridas observadas:</strong> ${test.details.observedRuns}</div>
            `;
        } else {
            detailsHTML = `
                <div><strong>Valor calculado:</strong> ${Object.values(test.details)[0]}</div>
                <div><strong>Límite inferior:</strong> ${test.details.lowerLimit}</div>
                <div><strong>Límite superior:</strong> ${test.details.upperLimit}</div>
            `;
        }
        
        testElement.innerHTML = `
            <div class="test-header">
                <span class="checkbox">${test.passes ? '✓' : '✗'}</span>
                <strong>${test.name}</strong>
            </div>
            <div class="test-details-list">
                ${detailsHTML}
                <div class="test-result ${test.passes ? 'result-pass' : 'result-fail'}">
                    Resultado: ${status}
                </div>
            </div>
        `;
        testList.appendChild(testElement);
    });
    
    elements.validationSection.appendChild(testList);
    
    const allPass = tests.every(test => test.passes);
    const finalResult = document.createElement('div');
    finalResult.className = `final-validation-result ${allPass ? 'all-pass' : 'some-fail'}`;
    finalResult.innerHTML = `
        <div class="final-checkbox">${allPass ? '✓' : '✗'}</div>
        <div>Los números <strong>${allPass ? 'PASAN' : 'NO PASAN'}</strong> todas las pruebas</div>
    `;
    elements.validationSection.appendChild(finalResult);
    
    elements.regenerateBtn.style.display = allPass ? 'none' : 'inline-block';
    showMessage(`Se generaron ${currentNumbers.length} números - ${allPass ? 'VÁLIDOS' : 'NO VÁLIDOS'}`, allPass ? 'success' : 'error');
}

// Manejar generación
function handleGenerate() {
    const seed = parseInt(elements.seed.value);
    const multiplier = parseInt(elements.multiplier.value);
    const increment = parseInt(elements.increment.value);
    const modulus = parseInt(elements.modulus.value);
    const count = parseInt(elements.count.value);
    
    if (!seed && seed !== 0 || !multiplier || !increment || !modulus || !count) {
        showMessage('Todos los campos son requeridos', 'error');
        return;
    }
    
    if (count < 100) {
        showMessage('La cantidad mínima es 100 números', 'error');
        return;
    }
    
    count > 100 ? showConfirmationModal() : generateNumbers(seed, multiplier, increment, modulus, count);
}

// Modal de confirmación
function showConfirmationModal() {
    elements.confirmationModal.style.display = 'flex';
}

function confirmGeneration() {
    elements.confirmationModal.style.display = 'none';
    const seed = parseInt(elements.seed.value);
    const multiplier = parseInt(elements.multiplier.value);
    const increment = parseInt(elements.increment.value);
    const modulus = parseInt(elements.modulus.value);
    const count = parseInt(elements.count.value);
    generateNumbers(seed, multiplier, increment, modulus, count);
}

function cancelGeneration() {
    elements.confirmationModal.style.display = 'none';
    showMessage('Generación cancelada', 'error');
}

// Regenerar números
function handleRegenerate() {
    if (currentNumbers.length === 0) return;
    
    const modulus = parseInt(elements.modulus.value);
    const count = parseInt(elements.count.value);
    const baseValue = Date.now();
    
    const newSeed = (baseValue * 1) % modulus;
    const newMultiplier = (baseValue * 3) % (modulus - 1) + 1;
    const newIncrement = (baseValue * 7) % (modulus - 1) + 1;
    
    elements.seed.value = newSeed;
    elements.multiplier.value = newMultiplier;
    elements.increment.value = newIncrement;
    
    generateNumbers(newSeed, newMultiplier, newIncrement, modulus, count);
    showMessage('Nuevos parámetros generados', 'info');
}

// Reiniciar
function handleReset() {
    elements.seed.value = '';
    elements.multiplier.value = '';
    elements.increment.value = '';
    elements.modulus.value = '';
    elements.count.value = '';
    
    currentNumbers = [];
    elements.numbersContainer.innerHTML = '';
    elements.validationSection.innerHTML = '';
    
    if (scatterChart) {
        scatterChart.data.datasets[0].data = [];
        scatterChart.update();
    }
    
    elements.messageDiv.textContent = '';
    elements.regenerateBtn.style.display = 'none';
    
    showMessage('Sistema reiniciado', 'info');
}