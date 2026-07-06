import cv2
import numpy as np
from pathlib import Path

from app.services.subject_utils import face_rects
from app.utils.image_utils import overlay_png

ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "costumes"

def apply_costume(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    costume_type = None
    if metadata:
        costume_type = (metadata.get("filterOptions") or {}).get("costume")
    result = image.copy()
    faces = face_rects(image, metadata)

    if costume_type == "khan_ran":
        for (x, y, w, h) in faces:
            _draw_khan_ran(result, x - w // 2, y - h // 8, w * 2, max(16, h // 2))
        return result

    overlay = _read_overlay(costume_type)
    if len(faces) == 0:
        return result

    for (x, y, w, h) in faces:
        if overlay is not None:
            result = overlay_png(result, overlay, x - int(w * 0.40), y - int(h * 1.02), int(w * 1.80))
        elif costume_type == "khan_dong":
            _draw_khan_dong(result, x + w // 2, y + h // 8, w)
        else:
            _draw_non_la(result, x + w // 2, y - int(h * 0.28), int(w * 0.78))
    return result

def _read_overlay(costume_type: str | None = None):
    if costume_type == "khan_dong":
        candidates = ("khan_dong.png",)
    else:
        candidates = ("non_la.png", "khan_dong.png")
    for name in candidates:
        path = ASSET_DIR / name
        if path.exists():
            return cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    return None

def _draw_non_la(image: np.ndarray, cx: int, cy: int, size: int):
    pts = np.array([[cx, cy - size], [cx - size, cy + size // 3], [cx + size, cy + size // 3]], np.int32)
    cv2.fillConvexPoly(image, pts, (188, 205, 210))
    cv2.polylines(image, [pts], True, (90, 110, 110), 3)
    for dx in (-size // 2, 0, size // 2):
        cv2.line(image, (cx, cy - size), (cx + dx, cy + size // 3), (120, 140, 140), 1)

def _draw_khan_dong(image: np.ndarray, cx: int, cy: int, width: int):
    pts = np.array([[cx, cy], [cx - width // 2, cy + width // 4], [cx + width // 2, cy + width // 4]], np.int32)
    cv2.fillConvexPoly(image, pts, (80, 80, 80))
    cv2.polylines(image, [pts], True, (40, 40, 40), 2)

def _draw_khan_ran(image: np.ndarray, x: int, y: int, w: int, h: int):
    if w < 10 or h < 10:
        return
    y = max(y, 0)
    h = min(h, image.shape[0] - y)
    for row in range(y, y + h, 6):
        for col in range(x, x + w, 6):
            val = 180 if ((row - y) // 6 + (col - x) // 6) % 2 == 0 else 100
            cv2.rectangle(image, (col, row), (min(col + 5, image.shape[1] - 1), min(row + 5, image.shape[0] - 1)), (val, val, val), -1)
