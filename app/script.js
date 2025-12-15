// --- Global Variables ---
const API_URL = 'http://127.0.0.1:8000/predict';
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const predictionOutput = document.getElementById('prediction-output');
const wireCanvas = document.getElementById('network-wires');
const wireCtx = wireCanvas.getContext('2d');

// --- Network Structure ---
const LAYERS = {
    'layer-input': 784, // 28x28 pixels
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
    // Update the input layer visualization in real-time
    updateInputLayerVisualization();
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
    updateInputLayerVisualization(); // Also clear the input grid
}

function resetVisualization() {
    wireCtx.clearRect(0, 0, wireCanvas.width, wireCanvas.height);
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

function createNetworkNodes() {
    for (const [layerId, nodeCount] of Object.entries(LAYERS)) {
        const layerDiv = document.getElementById(layerId);
        layerDiv.classList.add(layerId.split('-')[1]);

        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.classList.add('node');
            if (layerId === 'layer-output') {
                node.textContent = i;
                node.dataset.index = i;
            }
            layerDiv.appendChild(node);
        }
    }
}

// New function to update the 28x28 input grid
function updateInputLayerVisualization() {
    // Create a temporary 28x28 canvas to downscale the drawing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the 280x280 canvas content onto the 28x28 canvas
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    // Get the pixel data from the downscaled canvas
    const imageData = tempCtx.getImageData(0, 0, 28, 28).data;
    const inputNodes = document.querySelectorAll('.layer-input .node');

    for (let i = 0; i < inputNodes.length; i++) {
        // The model preprocesses by inverting, so we do the same for visualization
        // We look at the red channel (imageData[i * 4]), but it's grayscale so R,G,B are the same
        const pixelValue = imageData[i * 4];
        const invertedValue = 255 - pixelValue; // Invert it
        const intensity = invertedValue / 255; // Normalize to 0-1

        // Update the background color of the node
        inputNodes[i].style.backgroundColor = `rgba(0, 0, 0, ${intensity})`;
    }
}


function visualizeNetwork(scores, predictedDigit) {
    resetVisualization();
    const outputNodes = document.querySelectorAll('.layer-output .node');

    scores.forEach((score, index) => {
        const node = outputNodes[index];
        const confidence = Math.max(0.1, score);
        node.style.backgroundColor = `rgba(0, 123, 255, ${confidence * 0.8 + 0.2})`;
    });

    const predictedNode = document.querySelector(`.layer-output .node[data-index='${predictedDigit}']`);
    if (predictedNode) {
        predictedNode.classList.add('predicted');
    }

    drawConnections(predictedNode);
}


function drawConnections(predictedNode) {
    wireCtx.clearRect(0, 0, wireCanvas.width, wireCanvas.height);

    const layerIds = Object.keys(LAYERS);

    for (let i = 0; i < layerIds.length - 1; i++) {
        const fromLayer = document.getElementById(layerIds[i]);
        const toLayer = document.getElementById(layerIds[i + 1]);

        const fromNodes = fromLayer.querySelectorAll('.node');
        const toNodes = toLayer.querySelectorAll('.node');

        fromNodes.forEach(fromNode => {
            toNodes.forEach(toNode => {
                let strokeStyle = 'rgba(204, 204, 204, 0.05)';
                let lineWidth = 0.5;

                // Highlight connections leading to the predicted output
                if (toNode === predictedNode) {
                    strokeStyle = 'rgba(40, 167, 69, 0.4)';
                    lineWidth = 1.5;
                }
                drawConnector(fromNode, toNode, strokeStyle, lineWidth);
            });
        });
    }
}

function drawConnector(node1, node2, strokeStyle, lineWidth) {
    const rect1 = node1.getBoundingClientRect();
    const rect2 = node2.getBoundingClientRect();
    const containerRect = wireCanvas.getBoundingClientRect();

    const startX = rect1.left + rect1.width / 2 - containerRect.left;
    const startY = rect1.top + rect1.height / 2 - containerRect.top;
    const endX = rect2.left + rect2.width / 2 - containerRect.left;
    const endY = rect2.top + rect2.height / 2 - containerRect.top;

    wireCtx.beginPath();
    wireCtx.moveTo(startX, startY);
    wireCtx.lineTo(endX, endY);
    wireCtx.strokeStyle = strokeStyle;
    wireCtx.lineWidth = lineWidth;
    wireCtx.stroke();
}


// --- RUNTIME EXECUTION ---
initializeCanvas();
createNetworkNodes();
initializeWireCanvas();
updateInputLayerVisualization(); // Initial empty grid

window.addEventListener('resize', () => {
    initializeWireCanvas();
    resetVisualization();
});