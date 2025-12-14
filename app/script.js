// --- Global Variables ---
const API_URL = 'http://127.0.0.1:8000/predict';
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const predictionOutput = document.getElementById('prediction-output');
const scoreBarsContainer = document.querySelector('.score-bars');

let drawing = false;

// --- 1. Initialization and Canvas Setup ---

// Set the drawing style (black brush on a white background)
function initializeCanvas() {
    ctx.lineWidth = 20; // Thick brush size for digit drawing
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Initialize with white background
}

// --- 2. Drawing Event Handlers ---

// Start drawing when the mouse button is pressed
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    // Start drawing at the mouse position
    ctx.moveTo(e.offsetX, e.offsetY);
});

// Continue drawing lines while the mouse button is held down and the mouse moves
canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    // Draw line to the current mouse position
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

// Stop drawing when the mouse button is released
canvas.addEventListener('mouseup', () => {
    drawing = false;
    // Call the prediction function every time the user lifts the pen
    predictDigit();
});

// Stop drawing if the mouse leaves the canvas area
canvas.addEventListener('mouseleave', () => {
    drawing = false;
});


// --- 3. Core Functions (Stage 2/3/4) ---

// Function to clear the canvas (called by the button)
function clearCanvas() {
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Reset to white background
    predictionOutput.textContent = 'Draw a digit to see the prediction!';
    // Also reset visualization
    resetVisualization();
}

// Resets the score bars to 0 height
function resetVisualization() {
    const bars = document.querySelectorAll('.score-bar');
    bars.forEach(bar => {
        bar.style.height = '0%';
        bar.style.backgroundColor = '#ccc';
    });
}


// Function to send the image to the FastAPI backend
async function predictDigit() {
    // 1. Convert the Canvas drawing to a Blob (file-like object, PNG format)
    // We get a promise that resolves with the Blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    // 2. Create FormData object to send the file
    const formData = new FormData();
    // 'image' must match the FastAPI endpoint parameter name
    formData.append('image', blob, 'digit.png');

    predictionOutput.textContent = 'Predicting...';

    try {
        // 3. Send the image to the FastAPI endpoint
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // Handle server errors (e.g., 404, 500)
            const errorData = await response.json();
            throw new Error(`API Error ${response.status}: ${errorData.detail || 'Failed to connect/process.'}`);
        }

        // 4. Parse the JSON response
        const result = await response.json();
        const predicted_digit = result.prediction;
        const scores = result.scores; // This is the list of 10 probabilities

        // 5. Update the prediction display
        const confidence = scores[predicted_digit] * 100;
        predictionOutput.innerHTML =
            `Prediction: <strong>${predicted_digit}</strong> (Confidence: ${confidence.toFixed(2)}%)`;

        // 6. Start the visualization (Stage 4)
        visualizeNetwork(scores, predicted_digit);

    } catch (error) {
        console.error("Prediction failed:", error);
        predictionOutput.textContent = `Prediction Error: ${error.message}. Is the FastAPI server running?`;
        resetVisualization();
    }
}


// --- 4. Visualization Logic (Stage 4) ---

// Function to generate the 10 score bars in the HTML
function generateScoreBars() {
    for (let i = 0; i < 10; i++) {
        const barWrapper = document.createElement('div');
        barWrapper.classList.add('score-bar');
        barWrapper.dataset.index = i; // Store the digit index
        scoreBarsContainer.appendChild(barWrapper);
    }
}

// Function to update the score bars visually
function visualizeNetwork(finalScores, predictedDigit) {
    const bars = document.querySelectorAll('.score-bar');

    finalScores.forEach((score, index) => {
        const bar = bars[index];
        const confidence = score * 100;

        // Update bar height based on confidence
        bar.style.height = `${confidence}%`;

        // Highlight the predicted digit
        if (index === predictedDigit) {
            bar.style.backgroundColor = '#28a745'; // Green for the predicted digit
        } else {
            // A subtle blue color based on score for non-predicted digits
            bar.style.backgroundColor = `rgba(0, 123, 255, ${0.3 + score * 0.7})`;
        }
    });
}


// --- RUNTIME EXECUTION ---
// 1. Initialize the canvas background
initializeCanvas();
// 2. Create the 10 bars in the HTML
generateScoreBars();