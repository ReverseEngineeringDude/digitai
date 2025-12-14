import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

# --- 1. Model Loading (Runs only once at startup) ---
# Global variable to hold the model
model = None

try:
    # Load your trained model (Make sure 'mnist_cnn.h5' is in the same directory)
    model = tf.keras.models.load_model('mnist_cnn.h5', compile=False) 
    print("MNIST CNN Model Loaded Successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    # If the model fails to load, the API will still run, but /predict will fail.

# Initialize the FastAPI application
app = FastAPI()

# Configure CORS (Crucial for allowing your frontend to access the API)
# You should update origins to match your frontend's URL when deploying
origins = [
    "*", # Allow all origins for development ease
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Root Endpoint (For testing server status) ---
@app.get("/")
def read_root():
    return {"status": "ok", "model_loaded": model is not None, "message": "Prediction API is running."}

# --- 3. Prediction Endpoint ---
@app.post("/predict")
async def predict_digit(image: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded on server.")
        
    # Read the image data from the UploadFile
    image_data = await image.read()
    
    # Process the image using PIL and NumPy
    try:
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert PIL Image to a NumPy array (Grayscale)
        img_np = np.array(pil_image.convert('L')) 

        # --- 4. Preprocessing (Matches your original script) ---
        
        # Resize the image to 28x28
        img = cv2.resize(img_np, (28, 28), interpolation=cv2.INTER_AREA)
        
        # Invert the image (Important step for drawing on white canvas)
        img = 255 - img
        
        # Normalize to 0-1 range
        img = img / 255.0
        
        # Reshape for model input (1, 28, 28)
        img = img.reshape(1, 28, 28)

        # --- 5. Prediction ---
        prediction = model.predict(img, verbose=0)
        
        # Convert numpy array of prediction scores to a list for JSON serialization
        scores = prediction[0].tolist() 
        
        # Get the predicted digit (index with the highest score)
        predicted_digit = int(np.argmax(prediction[0]))

        # --- 6. Return Results ---
        return {
            'prediction': predicted_digit,
            'scores': scores
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during prediction: {e}")