import cv2
import numpy as np


def apply_dong_ho(image: np.ndarray) -> np.ndarray:
    smooth = cv2.bilateralFilter(image, d=9, sigmaColor=90, sigmaSpace=90)
    pixels = smooth.reshape((-1, 3)).astype(np.float32)
    _, labels, centers = cv2.kmeans(
        pixels,
        8,
        None,
        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0),
        3,
        cv2.KMEANS_PP_CENTERS,
    )
    quantized = centers.astype(np.uint8)[labels.flatten()].reshape(image.shape)

    # Canny tao net vien den, blend lai de co cam giac tranh dan gian.
    gray = cv2.cvtColor(quantized, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 160)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
    result = quantized.copy()
    result[edges > 0] = (35, 25, 20)
    return cv2.convertScaleAbs(result, alpha=1.08, beta=8)

