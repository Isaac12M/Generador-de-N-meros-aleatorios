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
let correlationChart = null;

// Configuración
const CONFIG = {
    alpha: 0.05,
    z_alpha_2: 1.96
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

    correlationChart = new Chart(document.getElementById('correlationChart'), {
        type: 'scatter',
        data: { datasets: [{
            label: 'Correlación',
            data: [],
            backgroundColor: 'rgba(33, 150, 243, 0.7)',
            pointRadius: 4
        }]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'X_i' }, min: 0, max: 1 },
                y: { title: { display: true, text: 'X_{i+1}' }, min: 0, max: 1 }
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

    const correlationData = [];
    for (let i = 0; i < currentNumbers.length - 1; i++) {
        correlationData.push({
            x: currentNumbers[i].normalized,
            y: currentNumbers[i + 1].normalized
        });
    }
    correlationChart.data.datasets[0].data = correlationData;
    correlationChart.update();
}

// Pruebas de validación
function runValidationTests() {
    const tests = [
        testUniformityMean(),
        testUniformityVariance(),
        testIndependence()
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
            mean: mean.toFixed(4),
            lowerLimit: lowerLimit.toFixed(4),
            upperLimit: upperLimit.toFixed(4)
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
            variance: variance.toFixed(4),
            lowerLimit: lowerLimit.toFixed(4),
            upperLimit: upperLimit.toFixed(4)
        }
    };
}

function testIndependence() {
    const n = currentNumbers.length;
    const data = currentNumbers.map(num => num.normalized);
    
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n - 1; i++) {
        const x = data[i], y = data[i + 1];
        sumXY += x * y;
        sumX += x;
        sumY += y;
        sumX2 += x * x;
        sumY2 += y * y;
    }
    
    const numerator = (n - 1) * sumXY - sumX * sumY;
    const denominator = Math.sqrt(((n - 1) * sumX2 - sumX * sumX) * ((n - 1) * sumY2 - sumY * sumY));
    const correlation = numerator / denominator;
    
    const lowerLimit = -CONFIG.z_alpha_2 / Math.sqrt(n);
    const upperLimit = CONFIG.z_alpha_2 / Math.sqrt(n);
    
    return {
        name: "Prueba de Independencia - Correlación",
        passes: correlation >= lowerLimit && correlation <= upperLimit,
        details: {
            correlation: correlation.toFixed(4),
            lowerLimit: lowerLimit.toFixed(4),
            upperLimit: upperLimit.toFixed(4)
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
        const checkbox = test.passes ? '☑' : '☐';
        
        testElement.innerHTML = `
            <div class="test-header">
                <span class="checkbox">${checkbox}</span>
                <strong>${test.name}</strong>
            </div>
            <div class="test-details-list">
                <div>Valor calculado: ${Object.values(test.details)[0]}</div>
                <div>Límite inferior: ${test.details.lowerLimit}</div>
                <div>Límite superior: ${test.details.upperLimit}</div>
                <div class="test-result ${test.passes ? 'result-pass' : 'result-fail'}">
                    Resultado: ${test.passes ? '☑ APRUEBA' : '☐ NO APRUEBA'}
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
        <div class="final-checkbox">${allPass ? '☑' : '☐'}</div>
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
    Object.values(elements).forEach(element => {
        if (element && element.tagName === 'INPUT') element.value = '';
    });
    
    currentNumbers = [];
    elements.numbersContainer.innerHTML = '';
    elements.validationSection.innerHTML = '';
    scatterChart.data.datasets[0].data = [];
    scatterChart.update();
    correlationChart.data.datasets[0].data = [];
    correlationChart.update();
    elements.messageDiv.textContent = '';
    elements.regenerateBtn.style.display = 'none';
}