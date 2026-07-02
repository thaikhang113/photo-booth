import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def bytes_to_bgr(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Khong doc duoc file anh.")
    return image


def save_png(image: np.ndarray, path):
    ok = cv2.imwrite(str(path), image)
    if not ok:
        raise ValueError("Khong luu duoc anh ket qua.")


def overlay_png(base: np.ndarray, overlay: np.ndarray, x: int, y: int, width: int) -> np.ndarray:
    if overlay is None or overlay.shape[2] < 4:
        return base
    h, w = overlay.shape[:2]
    scale = width / max(w, 1)
    resized = cv2.resize(overlay, (width, max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
    oh, ow = resized.shape[:2]
    x1, y1 = max(x, 0), max(y, 0)
    x2, y2 = min(x + ow, base.shape[1]), min(y + oh, base.shape[0])
    if x1 >= x2 or y1 >= y2:
        return base
    crop = resized[y1 - y : y2 - y, x1 - x : x2 - x]
    alpha = crop[:, :, 3:4] / 255.0
    base[y1:y2, x1:x2] = (alpha * crop[:, :, :3] + (1 - alpha) * base[y1:y2, x1:x2]).astype(np.uint8)
    return base


def detect_faces(image: np.ndarray):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        return []
    return cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))


def put_vietnamese_text(image: np.ndarray, text: str, xy, size: int, color) -> np.ndarray:
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(rgb)
    draw = ImageDraw.Draw(pil_image)
    font = ImageFont.truetype("arial.ttf", size) if _has_arial() else ImageFont.load_default()
    draw.text(xy, text, fill=color, font=font)
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def _has_arial() -> bool:
    try:
        ImageFont.truetype("arial.ttf", 12)
        return True
    except OSError:
        return False

