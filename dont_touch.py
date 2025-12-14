import os
import cv2
import numpy as np
from matplotlib import pyplot as plt
import tensorflow as tf


model = tf.keras.models.load_model('mnist_cnn.h5')

image_dir = 'digits'
image_num = 1

while True:
    img_path = f'{image_dir}/test{image_num}.png'
    if not os.path.exists(img_path):
        break

    try:
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

        if img is None:
            raise ValueError("Image not loaded")

        img = cv2.resize(img, (28, 28))
        img = 255 - img                  # invert
        img = img / 255.0                # normalize
        img = img.reshape(1, 28, 28)     # model input shape

        prediction = model.predict(img, verbose=0)
        print(f'Prediction for test{image_num}.png: {np.argmax(prediction)}')

        plt.imshow(img[0], cmap=plt.cm.binary)
        plt.title(f'Predicted: {np.argmax(prediction)}')
        plt.axis('off')
        plt.show()

    except Exception as e:
        print(f'Error processing test{image_num}.png:', e)

    image_num += 1
