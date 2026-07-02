from pathlib import Path

import cv2
import numpy as np

from app.utils.image_utils import detect_faces, overlay_png

ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "costumes"


def apply_costume(image: np.ndarray) -> np.ndarray:
    result = image.copy()
    faces = detect_faces(image)
    overlay = _read_overlay()
    if len(faces) == 0:
        _draw_non_la(result, result.shape[1] // 2, int(result.shape[0] * 0.18), int(result.shape[1] * 0.32))
        return result

    for (x, y, w, h) in faces:
        if overlay is not None:
            result = overlay_png(result, overlay, x - w // 3, y - int(h * 0.75), int(w * 1.7))
        else:
            _draw_non_la(result, x + w // 2, y - int(h * 0.22), int(w * 0.95))
    return result


def _read_overlay():
    for name in ("non_la.png", "khan_dong.png"):
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

