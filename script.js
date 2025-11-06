// Variables globales
let currentNumbers = [];
let scatterChart = null;

// Elementos del DOM
const seedInput = document.getElementById('seed');
const multiplierInput = document.getElementById('multiplier');
const incrementInput = document.getElementById('increment');
const modulusInput = document.getElementById('modulus');
const countInput = document.getElementById('count');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const numbersContainer = document.getElementById('numbersContainer');
const messageDiv = document.getElementById('message');
const confirmationModal = document.getElementById('confirmationModal');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');

// FUNCIÓN PARA CALCULAR LA POTENCIA DE 2 MÁS CERCANA
function calculateModulus(count) {
    // Encontrar la potencia de 2 más cercana que sea mayor o igual al count
    let modulus = 2;
    while (modulus < count) {
        modulus *= 2;
    }
    return modulus;
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    
    // Event listeners
    generateBtn.addEventListener('click', handleGenerate);
    resetBtn.addEventListener('click', handleReset);
    confirmYesBtn.addEventListener('click', confirmGeneration);
    confirmNoBtn.addEventListener('click', cancelGeneration);
    
    // Validaciones individuales en tiempo real
    setupIndividualValidations();
    
    // Actualizar módulo automáticamente cuando cambie la cantidad
    countInput.addEventListener('input', updateModulusFromCount);
});

// Configurar validaciones individuales para cada campo
function setupIndividualValidations() {
    // Semilla: debe ser ≥ 0
    seedInput.addEventListener('blur', function() {
        const value = parseInt(this.value);
        if (this.value !== '' && (isNaN(value) || value < 0)) {
            showIndividualError(this, 'La semilla debe ser un número ≥ 0');
        } else {
            clearIndividualError(this);
        }
    });
    
    // Multiplicador: debe ser ≥ 0
    multiplierInput.addEventListener('blur', function() {
        const value = parseInt(this.value);
        if (this.value !== '' && (isNaN(value) || value < 0)) {
            showIndividualError(this, 'El multiplicador debe ser un número ≥ 0');
        } else {
            clearIndividualError(this);
        }
    });
    
    // Incremento: debe ser ≥ 0
    incrementInput.addEventListener('blur', function() {
        const value = parseInt(this.value);
        if (this.value !== '' && (isNaN(value) || value < 0)) {
            showIndividualError(this, 'El incremento debe ser un número ≥ 0');
        } else {
            clearIndividualError(this);
        }
    });
    
    // Módulo: BLOQUEADO - se calcula automáticamente
    modulusInput.addEventListener('focus', function() {
        this.blur(); // Previene que el usuario pueda enfocar el campo
    });
    
    // Cantidad: debe ser ≥ 100
    countInput.addEventListener('blur', function() {
        const value = parseInt(this.value);
        if (this.value !== '' && (isNaN(value) || value < 100)) {
            showIndividualError(this, 'La cantidad debe ser ≥ 100');
        } else {
            clearIndividualError(this);
        }
    });
}

// ACTUALIZAR MÓDULO AUTOMÁTICAMENTE BASADO EN LA CANTIDAD
function updateModulusFromCount() {
    const count = parseInt(countInput.value);
    
    if (!isNaN(count) && count >= 100) {
        const modulus = calculateModulus(count);
        modulusInput.value = modulus;
        clearIndividualError(modulusInput);
        
        // Mostrar información al usuario
        showMessage(`Módulo actualizado automáticamente a: ${modulus} (2^${Math.log2(modulus)})`, 'info');
    } else if (countInput.value !== '') {
        showIndividualError(countInput, 'La cantidad debe ser ≥ 100');
        modulusInput.value = '';
    } else {
        modulusInput.value = '';
    }
}

// Mostrar error individual para un campo específico
function showIndividualError(input, message) {
    // Remover error anterior si existe
    clearIndividualError(input);
    
    // Crear elemento de error
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Insertar después del input
    input.parentNode.appendChild(errorElement);
    input.classList.add('error-field');
}

// Limpiar error individual
function clearIndividualError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    input.classList.remove('error-field');
}

// Inicializar el gráfico con colores verdes
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
                    title: {
                        display: true,
                        text: 'Índice',
                        color: '#2e7d32',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    min: 0,
                    grid: {
                        color: 'rgba(76, 175, 80, 0.1)'
                    },
                    ticks: {
                        color: '#1b5e20'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor Normalizado',
                        color: '#2e7d32',
                        font: {
                            weight: 'bold',
                            size: 14
                        }
                    },
                    min: 0,
                    max: 1,
                    grid: {
                        color: 'rgba(76, 175, 80, 0.1)'
                    },
                    ticks: {
                        color: '#1b5e20'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Números Aleatorios Generados',
                    color: '#2e7d32',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                legend: {
                    labels: {
                        color: '#1b5e20',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// Manejar la generación de números
function handleGenerate() {
    // Limpiar todos los errores individuales primero
    clearAllIndividualErrors();
    
    // Validar entradas
    if (!validateInputs()) {
        return;
    }
    
    const seed = parseInt(seedInput.value);
    const multiplier = parseInt(multiplierInput.value);
    const increment = parseInt(incrementInput.value);
    const modulus = parseInt(modulusInput.value);
    const count = parseInt(countInput.value);
    
    // Verificar si la semilla está en el rango correcto
    if (seed < 0) {
        showIndividualError(seedInput, 'La semilla debe ser un número ≥ 0');
        return;
    }
    
    // Verificar que la cantidad sea al menos 100
    if (count < 100) {
        showIndividualError(countInput, 'La cantidad mínima de números a generar es 100');
        return;
    }
    
    // SIEMPRE pedir confirmación para más de 100 números
    if (count > 100) {
        showConfirmationModal();
    } else {
        generateNumbers(seed, multiplier, increment, modulus, count);
    }
}

// Limpiar todos los errores individuales
function clearAllIndividualErrors() {
    const inputs = [seedInput, multiplierInput, incrementInput, modulusInput, countInput];
    inputs.forEach(input => clearIndividualError(input));
}

// Validar las entradas
function validateInputs() {
    let isValid = true;
    
    // Verificar que todos los campos tengan valores
    const inputs = [seedInput, multiplierInput, incrementInput, modulusInput, countInput];
    
    for (let input of inputs) {
        if (input.value === '') {
            showIndividualError(input, 'Este campo es requerido');
            isValid = false;
        }
    }
    
    return isValid;
}

// Mostrar mensaje
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    
    // Auto-ocultar mensajes después de 5 segundos (excepto errores críticos)
    if (type !== 'error' || !message.includes('Error:')) {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }
}

// Mostrar modal de confirmación
function showConfirmationModal() {
    confirmationModal.style.display = 'flex';
}

// Confirmar generación
function confirmGeneration() {
    confirmationModal.style.display = 'none';
    const seed = parseInt(seedInput.value);
    const multiplier = parseInt(multiplierInput.value);
    const increment = parseInt(incrementInput.value);
    const modulus = parseInt(modulusInput.value);
    const count = parseInt(countInput.value);
    generateNumbers(seed, multiplier, increment, modulus, count);
}

// Cancelar generación
function cancelGeneration() {
    confirmationModal.style.display = 'none';
    showMessage('Generación cancelada', 'error');
}

// Generar números usando LCG
function generateNumbers(seed, multiplier, increment, modulus, count) {
    currentNumbers = [];
    let x = seed;
    
    for (let i = 0; i < count; i++) {
        // Aplicar LCG: Xₖ₊₁ = (a * Xₖ + c) mod m
        x = (multiplier * x + increment) % modulus;
        
        // Normalizar: uₖ = Xₖ / (m - 1) - SEGÚN TU FÓRMULA
        const normalized = x / (modulus - 1);
        
        currentNumbers.push({
            index: i + 1,
            value: x,
            normalized: normalized
        });
    }
    
    // Mostrar resultados
    displayNumbers();
    updateChart();
    showMessage(`Se generaron ${count} números aleatorios (módulo: ${modulus})`, 'success');
}

// Mostrar números en el contenedor
function displayNumbers() {
    numbersContainer.innerHTML = '';
    
    currentNumbers.forEach(num => {
        const numberItem = document.createElement('div');
        numberItem.className = 'number-item';
        numberItem.textContent = num.normalized.toFixed(4);
        numbersContainer.appendChild(numberItem);
    });
}

// Actualizar el gráfico
function updateChart() {
    const dataPoints = currentNumbers.map(num => ({
        x: num.index,
        y: num.normalized
    }));
    
    scatterChart.data.datasets[0].data = dataPoints;
    scatterChart.update();
}

// Manejar el reinicio
function handleReset() {
    // Limpiar todos los campos (dejarlos en blanco)
    seedInput.value = '';
    multiplierInput.value = '';
    incrementInput.value = '';
    modulusInput.value = '';
    countInput.value = '';
    
    // Limpiar errores individuales
    clearAllIndividualErrors();
    
    // Limpiar resultados
    currentNumbers = [];
    numbersContainer.innerHTML = '';
    scatterChart.data.datasets[0].data = [];
    scatterChart.update();
    
    // Limpiar mensajes
    messageDiv.textContent = '';
    messageDiv.className = '';
}