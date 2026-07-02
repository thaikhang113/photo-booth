import cv2
import numpy as np

from app.utils.image_utils import put_vietnamese_text


def apply_tet(image: np.ndarray) -> np.ndarray:
    result = cv2.convertScaleAbs(image, alpha=1.08, beta=8)
    h, w = result.shape[:2]
    border = max(18, min(w, h) // 22)
    cv2.rectangle(result, (0, 0), (w - 1, h - 1), (24, 24, 190), border)
    cv2.rectangle(result, (border, border), (w - border, h - border), (0, 210, 255), 3)

    for i in range(7):
        x = int((i + 0.5) * w / 7)
        _flower(result, x, border + 18, 16, (0, 230, 255))
        if i % 2 == 0:
            _lantern(result, x, h - border - 34)

    result = put_vietnamese_text(result, "Chúc Mừng Năm Mới", (border + 16, h - border - 58), 34, (255, 230, 60))
    return result


def _flower(image, cx, cy, r, color):
    for angle in range(0, 360, 72):
        rad = np.deg2rad(angle)
        px = int(cx + np.cos(rad) * r)
        py = int(cy + np.sin(rad) * r)
        cv2.circle(image, (px, py), r // 2, color, -1)
    cv2.circle(image, (cx, cy), r // 3, (0, 120, 255), -1)


def _lantern(image, cx, cy):
    cv2.line(image, (cx, cy - 22), (cx, cy - 4), (0, 210, 255), 2)
    cv2.ellipse(image, (cx, cy + 10), (18, 28), 0, 0, 360, (0, 0, 210), -1)
    cv2.ellipse(image, (cx, cy + 10), (18, 28), 0, 0, 360, (0, 210, 255), 2)
