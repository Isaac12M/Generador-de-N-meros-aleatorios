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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    
    // Event listeners
    generateBtn.addEventListener('click', handleGenerate);
    resetBtn.addEventListener('click', handleReset);
    confirmYesBtn.addEventListener('click', confirmGeneration);
    confirmNoBtn.addEventListener('click', cancelGeneration);
    
    // Prevenir números negativos en todos los inputs
    preventNegativeInputs();
});

// Prevenir que se ingresen números negativos
function preventNegativeInputs() {
    const inputs = [seedInput, multiplierInput, incrementInput, modulusInput, countInput];
    
    inputs.forEach(input => {
        // Prevenir entrada de caracteres negativos
        input.addEventListener('keydown', function(e) {
            // Prevenir el signo negativo y la letra 'e' (notación científica)
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        });
        
        // Corregir si se pega un valor negativo
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = Math.abs(this.value); // Convertir a positivo
            }
        });
        
        // Validar cuando pierde el foco
        input.addEventListener('blur', function() {
            if (this.value < 0) {
                this.value = '';
                showMessage('Se ha eliminado un valor negativo', 'error');
            }
        });
    });
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
    if (seed < 0 || seed >= modulus) {
        showMessage('Error: La semilla debe cumplir 0 ≤ semilla < módulo', 'error');
        return;
    }
    
    // Si se generan más de 100 números, pedir confirmación
    if (count > 100) {
        showConfirmationModal();
    } else {
        generateNumbers(seed, multiplier, increment, modulus, count);
    }
}

// Validar las entradas
function validateInputs() {
    // Verificar que todos los campos tengan valores
    const inputs = [seedInput, multiplierInput, incrementInput, modulusInput, countInput];
    
    for (let input of inputs) {
        if (input.value === '') {
            showMessage('Error: Todos los campos deben estar completos', 'error');
            return false;
        }
        
        const value = parseFloat(input.value);
        
        // Verificar si es un número válido y positivo
        if (isNaN(value) || !Number.isInteger(value) || value < 0) {
            showMessage('Error: Todos los parámetros deben ser números enteros positivos', 'error');
            return false;
        }
    }
    
    // Verificar que el módulo sea mayor que 1
    if (parseInt(modulusInput.value) <= 1) {
        showMessage('Error: El módulo debe ser mayor que 1', 'error');
        return false;
    }
    
    // Verificar que la cantidad sea positiva
    if (parseInt(countInput.value) <= 0) {
        showMessage('Error: La cantidad debe ser mayor que 0', 'error');
        return false;
    }
    
    return true;
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
        
        // Normalizar: uₖ = Xₖ / m
        const normalized = x / modulus;
        
        currentNumbers.push({
            index: i + 1,
            value: x,
            normalized: normalized
        });
    }
    
    // Mostrar resultados
    displayNumbers();
    updateChart();
    showMessage(`Se generaron ${count} números aleatorios correctamente`, 'success');
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
    
    // Limpiar resultados
    currentNumbers = [];
    numbersContainer.innerHTML = '';
    scatterChart.data.datasets[0].data = [];
    scatterChart.update();
    
    // Limpiar mensajes
    messageDiv.textContent = '';
    messageDiv.className = '';
}