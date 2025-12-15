# Interactive MNIST Digit Recognizer with Neural Network Visualization

This project is an interactive web application that recognizes handwritten digits (0-9) drawn on a canvas. It uses a trained Convolutional Neural Network (CNN) to make predictions and visualizes the network's structure and decision-making process in real-time.

## Features

- **Interactive Drawing Canvas:** Draw any digit from 0 to 9 on a digital canvas.
- **Real-time Input Visualization:** A 28x28 grid updates as you draw, showing the exact input the model receives.
- **Live Neural Network Visualization:** See a graphical representation of the neural network, including the input layer, hidden layers, and output layer.
- **Prediction Highlighting:** The output node corresponding to the predicted digit glows, and the connections leading to it are emphasized.
- **Confidence Score:** The model's confidence in its prediction is displayed.
- **FastAPI Backend:** The powerful FastAPI framework serves the TensorFlow/Keras model.

## Example
![](./gif/red_digitai.gif)

## How to Run

Follow these steps to run the project locally.

### 1. Prerequisites

- Python 3.8+
- An internet connection to download dependencies.

### 2. Clone the Repository

```bash
git clone https://github.com/ReverseEngineeringDude/digitai.git
cd digitai
```

### 3. Set up a Python Virtual Environment

It's highly recommended to use a virtual environment to manage dependencies.

```bash
# Create a virtual environment
python -m venv env

# Activate the virtual environment
# On Windows
env\Scripts\activate
# On macOS/Linux
source env/bin/activate
```

### 4. Install Dependencies

Install all the required Python packages using the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

### 5. Download the Model

The pre-trained model `mnist_cnn.h5` is included in this repository. If it's missing, you can generate it by running the `training_script.py`.

### 6. Run the FastAPI Backend

Start the web server from the root directory of the project.

```bash
uvicorn app:app --reload
```

The server will be running at `http://127.0.0.1:8000`.

### 7. Open the Frontend

Open the `app/index.html` file directly in your web browser. The application should now be running and connected to the backend.

## Project Structure

```
.
├── app/
│   ├── index.html         # Main HTML file for the frontend
│   ├── script.js          # JavaScript for canvas drawing and visualization
│   └── styles.css         # CSS for styling the application
├── app.py                 # FastAPI backend server
├── mnist_cnn.h5           # Pre-trained Keras CNN model
├── training_script.py     # Script to train the CNN model (optional)
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

- **`app/`**: This directory contains all the frontend files (HTML, CSS, and JavaScript).
- **`app.py`**: A Python script that runs a FastAPI server to handle image prediction requests. It loads the pre-trained `mnist_cnn.h5` model.
- **`mnist_cnn.h5`**: The saved, pre-trained TensorFlow/Keras model for classifying MNIST digits.
- **`training_script.py`**: A script to build, train, and save the CNN model. You do not need to run this unless you want to retrain the model.
- **`requirements.txt`**: A list of all Python packages required to run the backend.
