// Variables globales
let currentNumbers = [];
let scatterChart = null;

// Configuración de elementos DOM
const elements = {
    seed: document.getElementById('seed'),
    multiplier: document.getElementById('multiplier'),
    increment: document.getElementById('increment'),
    modulus: document.getElementById('modulus'),
    count: document.getElementById('count'),
    generateBtn: document.getElementById('generateBtn'),
    resetBtn: document.getElementById('resetBtn'),
    numbersContainer: document.getElementById('numbersContainer'),
    messageDiv: document.getElementById('message'),
    confirmationModal: document.getElementById('confirmationModal'),
    confirmYes: document.getElementById('confirmYes'),
    confirmNo: document.getElementById('confirmNo')
};

// Utilidades
const utils = {
    isPowerOfTwo: n => n > 0 && (n & (n - 1)) === 0,
    
    calculateModulus: count => {
        let modulus = 2;
        while (modulus < count) modulus *= 2;
        return modulus;
    },
    
    showMessage: (message, type = 'info') => {
        elements.messageDiv.textContent = message;
        elements.messageDiv.className = type;
        if (type !== 'error') {
            setTimeout(() => elements.messageDiv.textContent = '', 5000);
        }
    },
    
    showIndividualError: (input, message) => {
        utils.clearIndividualError(input);
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        input.parentNode.appendChild(errorElement);
        input.classList.add('error-field');
    },
    
    clearIndividualError: input => {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
        input.classList.remove('error-field');
    },
    
    clearAllErrors: () => {
        Object.values(elements).forEach(element => {
            if (element && element.tagName === 'INPUT') {
                utils.clearIndividualError(element);
            }
        });
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    elements.generateBtn.addEventListener('click', handleGenerate);
    elements.resetBtn.addEventListener('click', handleReset);
    elements.confirmYes.addEventListener('click', confirmGeneration);
    elements.confirmNo.addEventListener('click', cancelGeneration);
    
    // Validaciones en tiempo real
    setupValidations();
}

// Configurar validaciones
function setupValidations() {
    const validations = {
        seed: { min: 0, message: 'La semilla debe ser un número ≥ 0' },
        multiplier: { min: 0, message: 'El multiplicador debe ser un número ≥ 0' },
        increment: { min: 0, message: 'El incremento debe ser un número ≥ 0' },
        count: { min: 100, message: 'La cantidad debe ser ≥ 100' }
    };
    
    Object.entries(validations).forEach(([key, config]) => {
        elements[key].addEventListener('blur', () => validateField(elements[key], config));
    });
    
    // Módulo bloqueado
    elements.modulus.addEventListener('focus', () => elements.modulus.blur());
    elements.count.addEventListener('input', updateModulusFromCount);
}

// Validar campo individual
function validateField(input, { min, message }) {
    const value = parseInt(input.value);
    if (input.value !== '' && (isNaN(value) || value < min)) {
        utils.showIndividualError(input, message);
    } else {
        utils.clearIndividualError(input);
    }
}

// Actualizar módulo automáticamente
function updateModulusFromCount() {
    const count = parseInt(elements.count.value);
    
    if (!isNaN(count) && count >= 100) {
        const modulus = utils.calculateModulus(count);
        elements.modulus.value = modulus;
        utils.clearIndividualError(elements.modulus);
        utils.showMessage(`Módulo actualizado automáticamente a: ${modulus} (2^${Math.log2(modulus)})`, 'info');
    } else if (elements.count.value !== '') {
        utils.showIndividualError(elements.count, 'La cantidad debe ser ≥ 100');
        elements.modulus.value = '';
    } else {
        elements.modulus.value = '';
    }
}

// Inicializar gráfico
function initializeChart() {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Números Aleatorios',
                data: [],
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: 'rgba(56, 142, 60, 1)',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2,
                pointBorderColor: '#1b5e20'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    title: { display: true, text: 'Índice', color: '#2e7d32', font: { weight: 'bold', size: 14 } },
                    min: 0, grid: { color: 'rgba(76, 175, 80, 0.1)' }, ticks: { color: '#1b5e20' }
                },
                y: {
                    title: { display: true, text: 'Valor Normalizado', color: '#2e7d32', font: { weight: 'bold', size: 14 } },
                    min: 0, max: 1, grid: { color: 'rgba(76, 175, 80, 0.1)' }, ticks: { color: '#1b5e20' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Números Aleatorios Generados',
                    color: '#2e7d32',
                    font: { size: 16, weight: 'bold' },
                    padding: { bottom: 20 }
                },
                legend: {
                    labels: { color: '#1b5e20', font: { size: 14, weight: 'bold' } }
                }
            }
        }
    });
}

// Manejar generación
function handleGenerate() {
    utils.clearAllErrors();
    
    if (!validateInputs()) return;
    
    const seed = parseInt(elements.seed.value);
    const multiplier = parseInt(elements.multiplier.value);
    const increment = parseInt(elements.increment.value);
    const modulus = parseInt(elements.modulus.value);
    const count = parseInt(elements.count.value);
    
    if (seed < 0) {
        utils.showIndividualError(elements.seed, 'La semilla debe ser un número ≥ 0');
        return;
    }
    
    if (count < 100) {
        utils.showIndividualError(elements.count, 'La cantidad mínima de números a generar es 100');
        return;
    }
    
    count > 100 ? showConfirmationModal() : generateNumbers(seed, multiplier, increment, modulus, count);
}

// Validar entradas
function validateInputs() {
    let isValid = true;
    
    Object.values(elements).forEach(element => {
        if (element && element.tagName === 'INPUT' && element.value === '') {
            utils.showIndividualError(element, 'Este campo es requerido');
            isValid = false;
        }
    });
    
    return isValid;
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
    utils.showMessage('Generación cancelada', 'error');
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
    updateChart();
    utils.showMessage(`Se generaron ${count} números aleatorios (módulo: ${modulus})`, 'success');
}

// Mostrar números
function displayNumbers() {
    elements.numbersContainer.innerHTML = '';
    currentNumbers.forEach(num => {
        const numberItem = document.createElement('div');
        numberItem.className = 'number-item';
        numberItem.textContent = num.normalized.toFixed(4);
        elements.numbersContainer.appendChild(numberItem);
    });
}

// Actualizar gráfico
function updateChart() {
    scatterChart.data.datasets[0].data = currentNumbers.map(num => ({
        x: num.index,
        y: num.normalized
    }));
    scatterChart.update();
}

// Reiniciar
function handleReset() {
    Object.values(elements).forEach(element => {
        if (element && element.tagName === 'INPUT') element.value = '';
    });
    
    utils.clearAllErrors();
    currentNumbers = [];
    elements.numbersContainer.innerHTML = '';
    scatterChart.data.datasets[0].data = [];
    scatterChart.update();
    elements.messageDiv.textContent = '';
}