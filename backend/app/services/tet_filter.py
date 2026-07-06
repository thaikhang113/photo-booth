import cv2
import numpy as np
from pathlib import Path

from app.services.subject_utils import subject_mask
from app.utils.image_utils import put_vietnamese_text

ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "tet"


def apply_tet(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    location = "home"
    if metadata:
        location = (metadata.get("filterOptions") or {}).get("tetLocation") or location
    result = _compose_location(image, metadata, location)
    h, w = result.shape[:2]
    border = int(min(w, h) * 0.035)

    cv2.rectangle(result, (0, 0), (w - 1, h - 1), (22, 26, 185), border)
    cv2.rectangle(result, (border, border), (w - border, h - border), (0, 215, 255), 2)

    for i in range(6):
        x = int((i + 0.5) * w / 6)
        if i % 2 == 0:
            _lantern(result, x, border + 36)
        else:
            _flower(result, x, border + 30, 14, (0, 225, 255))

    result = put_vietnamese_text(result, "Chuc Mung Nam Moi", (border + 14, h - border - 50), 25, (255, 235, 70))
    return result


def _compose_location(image: np.ndarray, metadata: dict | None, location: str) -> np.ndarray:
    h, w = image.shape[:2]
    bg = cv2.convertScaleAbs(_tet_background(w, h, location), alpha=1.05, beta=5)
    mask = np.clip(subject_mask(image, metadata) * 1.10, 0, 1)
    subject = image
    return (subject * mask[:, :, None] + bg * (1 - mask[:, :, None])).astype(np.uint8)


def _tet_background(width: int, height: int, location: str) -> np.ndarray:
    asset = _load_tet_asset(width, height, location)
    if asset is not None:
        return asset

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


def _load_tet_asset(width: int, height: int, location: str):
    names = {
        "flower_market": ("flower_market.jpg",),
        "street": ("street.jpg",),
        "home": ("home.jpg",),
    }.get(location, ("flower_market.jpg",))
    for name in names:
        path = ASSET_DIR / name
        if path.exists():
            image = cv2.imread(str(path))
            if image is not None:
                return _cover_resize(image, width, height)
    return None


def _cover_resize(image: np.ndarray, width: int, height: int) -> np.ndarray:
    ih, iw = image.shape[:2]
    scale = max(width / max(iw, 1), height / max(ih, 1))
    resized = cv2.resize(image, (max(width, int(iw * scale)), max(height, int(ih * scale))), interpolation=cv2.INTER_AREA)
    rh, rw = resized.shape[:2]
    x = max(0, (rw - width) // 2)
    y = max(0, (rh - height) // 2)
    return resized[y:y + height, x:x + width]


def _flower(image, cx, cy, r, color):
    for angle in range(0, 360, 72):
        rad = np.deg2rad(angle)
        px = int(cx + np.cos(rad) * r)
        py = int(cy + np.sin(rad) * r)
        cv2.circle(image, (px, py), max(2, r // 2), color, -1)
    cv2.circle(image, (cx, cy), max(2, r // 3), (0, 120, 255), -1)


def _lantern(image, cx, cy):
    cv2.line(image, (cx, cy - 20), (cx, cy - 5), (0, 220, 255), 2)
    cv2.ellipse(image, (cx, cy + 10), (16, 24), 0, 0, 360, (0, 0, 210), -1)
    cv2.ellipse(image, (cx, cy + 10), (16, 24), 0, 0, 360, (0, 215, 255), 2)
