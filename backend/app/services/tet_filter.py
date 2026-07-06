import cv2
import numpy as np

from app.utils.image_utils import put_vietnamese_text

def apply_tet(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    location = "home"
    if metadata:
        location = (metadata.get("filterOptions") or {}).get("tetLocation") or location
    result = _compose_location(image, location)
    result = cv2.convertScaleAbs(result, alpha=1.08, beta=8)
    h, w = result.shape[:2]
    border = int(min(w, h) * 0.045)

    cv2.rectangle(result, (0, 0), (w - 1, h - 1), (24, 24, 190), border)
    cv2.rectangle(result, (border, border), (w - border, h - border), (0, 210, 255), 3)

    for i in range(7):
        x = int((i + 0.5) * w / 7)
        _flower(result, x, border + 18, 16, (0, 230, 255))
        if i % 2 == 0:
            _lantern(result, x, h - border - 34)

    # Cau doi / Chu Phuc
    result = put_vietnamese_text(result, "Chuc Mung Nam Moi", (border + 16, h - border - 58), 28, (255, 230, 60))
    if h > border + 100:
        result = put_vietnamese_text(result, "Phuc", (w // 2 - 24, border + 50), 36, (255, 215, 0))

    return result

def _compose_location(image: np.ndarray, location: str) -> np.ndarray:
    h, w = image.shape[:2]
    bg = _tet_background(w, h, location)
    mask = np.zeros((h, w), dtype=np.float32)
    cv2.ellipse(mask, (w // 2, int(h * 0.55)), (int(w * 0.34), int(h * 0.48)), 0, 0, 360, 1, -1)
    mask = cv2.GaussianBlur(mask, (31, 31), 0)
    return (image * mask[:, :, None] + bg * (1 - mask[:, :, None])).astype(np.uint8)

def _tet_background(width: int, height: int, location: str) -> np.ndarray:
    bg = np.zeros((height, width, 3), dtype=np.uint8)
    if location == "street":
        bg[:] = (35, 45, 170)
        for x in range(0, width, max(width // 6, 1)):
            _lantern(bg, x + width // 12, height // 4)
        cv2.line(bg, (0, int(height * 0.72)), (width, int(height * 0.72)), (80, 170, 210), 3)
    elif location == "flower_market":
        bg[:] = (45, 120, 170)
        for x in range(0, width, max(width // 8, 1)):
            _flower(bg, x + width // 16, int(height * 0.72), max(8, width // 28), (0, 230, 255))
            _flower(bg, x + width // 20, int(height * 0.84), max(7, width // 32), (180, 60, 255))
    else:
        bg[:] = (30, 35, 150)
        cv2.rectangle(bg, (width // 12, height // 5), (width - width // 12, height - height // 8), (45, 50, 190), -1)
        cv2.rectangle(bg, (width // 8, height // 4), (width - width // 8, height - height // 5), (0, 210, 255), 2)
    return bg

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
