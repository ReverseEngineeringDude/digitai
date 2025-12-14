// --- Global Variables ---
const API_URL = 'http://127.0.0.1:8000/predict';
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const predictionOutput = document.getElementById('prediction-output');
const wireCanvas = document.getElementById('network-wires');
const wireCtx = wireCanvas.getContext('2d');

// --- Network Structure ---
// Simplified for visualization purposes
const LAYERS = {
    'layer-input': 20,
    'layer-hidden-1': 16,
    'layer-hidden-2': 12,
    'layer-output': 10,
};

let drawing = false;

// --- 1. Initialization and Canvas Setup ---

function initializeCanvas() {
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Set the wire canvas to the full size of its container
function initializeWireCanvas() {
    const container = document.getElementById('network-diagram');
    wireCanvas.width = container.clientWidth;
    wireCanvas.height = container.clientHeight;
}

// --- 2. Drawing Event Handlers ---

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    predictDigit();
});

canvas.addEventListener('mouseleave', () => {
    drawing = false;
});

// --- 3. Core Functions ---

function clearCanvas() {
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    predictionOutput.textContent = 'Draw a digit to see the prediction!';
    resetVisualization();
}

function resetVisualization() {
    // Clear the connection lines
    wireCtx.clearRect(0, 0, wireCanvas.width, wireCanvas.height);

    // Reset output node styles
    const outputNodes = document.querySelectorAll('.layer-output .node');
    outputNodes.forEach(node => {
        node.classList.remove('predicted');
        node.style.backgroundColor = 'rgba(0, 123, 255, 0.3)';
        node.style.transform = 'scale(1)';
    });
}

async function predictDigit() {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const formData = new FormData();
    formData.append('image', blob, 'digit.png');

    predictionOutput.textContent = 'Predicting...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error ${response.status}: ${errorData.detail || 'Failed to connect.'}`);
        }

        const result = await response.json();
        const {
            prediction,
            scores
        } = result;

        const confidence = scores[prediction] * 100;
        predictionOutput.innerHTML =
            `Prediction: <strong>${prediction}</strong> (Confidence: ${confidence.toFixed(2)}%)`;

        visualizeNetwork(scores, prediction);

    } catch (error) {
        console.error("Prediction failed:", error);
        predictionOutput.textContent = `Error: ${error.message}`;
        resetVisualization();
    }
}

// --- 4. Visualization Logic ---

// Function to create the nodes for each layer
function createNetworkNodes() {
    for (const [layerId, nodeCount] of Object.entries(LAYERS)) {
        const layerDiv = document.getElementById(layerId);
        // Add a class to identify the layer type from its ID
        layerDiv.classList.add(layerId.split('-')[1]); // e.g., 'input', 'hidden', 'output'

        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.classList.add('node');
            if (layerId === 'layer-output') {
                node.textContent = i; // Label output nodes 0-9
                node.dataset.index = i;
            }
            layerDiv.appendChild(node);
        }
    }
}

// Main function to draw the network visualization
function visualizeNetwork(scores, predictedDigit) {
    // 1. Clear previous state
    resetVisualization();

    const outputNodes = document.querySelectorAll('.layer-output .node');

    // 2. Update output node styles based on scores
    scores.forEach((score, index) => {
        const node = outputNodes[index];
        const confidence = Math.max(0.1, score); // Ensure even low scores are slightly visible
        node.style.backgroundColor = `rgba(0, 123, 255, ${confidence})`;
    });

    // 3. Highlight the predicted node
    const predictedNode = document.querySelector(`.layer-output .node[data-index='${predictedDigit}']`);
    if (predictedNode) {
        predictedNode.classList.add('predicted');
        predictedNode.style.backgroundColor = '#28a745'; // Override with prediction color
    }

    // 4. Draw connection wires
    drawConnections(predictedNode);
}


// Function to draw the connection lines on the canvas
function drawConnections(predictedNode) {
    wireCtx.clearRect(0, 0, wireCanvas.width, wireCanvas.height);
    wireCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    wireCtx.lineWidth = 1;

    const layerIds = Object.keys(LAYERS);

    for (let i = 0; i < layerIds.length - 1; i++) {
        const fromLayer = document.getElementById(layerIds[i]);
        const toLayer = document.getElementById(layerIds[i + 1]);

        const fromNodes = fromLayer.querySelectorAll('.node');
        const toNodes = toLayer.querySelectorAll('.node');

        fromNodes.forEach(fromNode => {
            toNodes.forEach(toNode => {
                // Highlight connections leading to the predicted output
                if (toNode === predictedNode) {
                    wireCtx.strokeStyle = 'rgba(40, 167, 69, 0.5)'; // Greenish, semi-transparent
                    wireCtx.lineWidth = 2;
                } else {
                    wireCtx.strokeStyle = 'rgba(204, 204, 204, 0.2)'; // Faint gray
                    wireCtx.lineWidth = 1;
                }
                drawConnector(fromNode, toNode);
            });
        });
    }
}


// Helper to draw a single line between two node elements
function drawConnector(node1, node2) {
    const rect1 = node1.getBoundingClientRect();
    const rect2 = node2.getBoundingClientRect();
    const containerRect = wireCanvas.getBoundingClientRect();

    // Calculate centers relative to the canvas
    const startX = rect1.left + rect1.width / 2 - containerRect.left;
    const startY = rect1.top + rect1.height / 2 - containerRect.top;
    const endX = rect2.left + rect2.width / 2 - containerRect.left;
    const endY = rect2.top + rect2.height / 2 - containerRect.top;

    wireCtx.beginPath();
    wireCtx.moveTo(startX, startY);
    wireCtx.lineTo(endX, endY);
    wireCtx.stroke();
}


// --- RUNTIME EXECUTION ---
// 1. Setup the drawing area
initializeCanvas();
// 2. Create the HTML nodes for the network diagram
createNetworkNodes();
// 3. Setup the canvas for drawing the connection lines
initializeWireCanvas();
// 4. Redraw lines if window is resized
window.addEventListener('resize', () => {
    initializeWireCanvas();
    // Optionally, redraw the last state if you store it, or just clear
    resetVisualization();
});