import cv2
import numpy as np

from app.utils.image_utils import detect_faces

def apply_tuong(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(np.int16) * 1.35, 0, 255).astype(np.uint8)
    result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    result = cv2.convertScaleAbs(result, alpha=1.15, beta=4)

    faces = detect_faces(image)
    if len(faces) == 0:
        h, w = image.shape[:2]
        faces = [(w // 4, h // 5, w // 2, int(h * 0.55))]

    for (x, y, w, h) in faces:
        center = (x + w // 2, y + h // 2)
        cv2.ellipse(result, center, (w // 2, h // 2), 0, 0, 360, (245, 245, 245), 2)
        cv2.line(result, (x + w // 2, y + h // 6), (x + w // 2, y + h - h // 8), (0, 0, 220), 4)
        cv2.ellipse(result, (x + w // 3, y + h // 2), (w // 7, h // 5), -20, 0, 360, (0, 0, 210), 3)
        cv2.ellipse(result, (x + 2 * w // 3, y + h // 2), (w // 7, h // 5), 20, 0, 360, (0, 0, 210), 3)
        cv2.polylines(result, [np.array([(x + w // 2, y + h // 2), (x + w // 3, y + 3 * h // 4), (x + 2 * w // 3, y + 3 * h // 4)])], True, (0, 200, 255), 3)
    return result
