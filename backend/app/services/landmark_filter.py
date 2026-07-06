import cv2
import numpy as np
from pathlib import Path

from app.services.subject_utils import subject_mask

ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "backgrounds"

def apply_landmark(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    landmark_id = None
    if metadata:
        landmark_id = (metadata.get("filterOptions") or {}).get("landmark")
    background = _load_background(image.shape[1], image.shape[0], landmark_id)
    mask = subject_mask(image, metadata)
    color_fix = cv2.convertScaleAbs(image, alpha=1.04, beta=2)
    mask = np.clip(mask * 1.08, 0, 1)
    return (color_fix * mask[:, :, None] + background * (1 - mask[:, :, None])).astype(np.uint8)

def _load_background(width: int, height: int, landmark_id: str | None = None) -> np.ndarray:
    fname = f"{landmark_id}.jpg" if landmark_id else ""
    if fname:
        path = ASSET_DIR / fname
        if path.exists():
            bg = cv2.imread(str(path))
            if bg is not None:
                return cv2.resize(bg, (width, height), interpolation=cv2.INTER_AREA)

    for name in ("hoi_an.jpg", "hue.jpg", "ho_guom.jpg", "ha_long.jpg"):
        path = ASSET_DIR / name
        if path.exists():
            bg = cv2.imread(str(path))
            if bg is not None:
                return cv2.resize(bg, (width, height), interpolation=cv2.INTER_AREA)

    bg = np.zeros((height, width, 3), dtype=np.uint8)
    if landmark_id == "hoi_an":
        bg[:] = (60, 140, 200)
        cv2.putText(bg, "HOI AN", (width//3, height//2), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (180, 210, 255), 3)
    elif landmark_id == "hue":
        bg[:] = (150, 80, 120)
        cv2.putText(bg, "HUE", (width//3, height//2), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (200, 200, 255), 3)
    elif landmark_id == "ho_guom":
        bg[:] = (140, 180, 60)
        cv2.circle(bg, (width//2, height//2), min(width, height)//4, (200, 220, 100), -1)
        cv2.putText(bg, "HO GUOM", (width//4, height//2+40), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 200), 3)
    elif landmark_id == "ha_long":
        bg[:] = (140, 200, 100)
        for i in range(3):
            cx = width//4 + i*width//4
            cv2.rectangle(bg, (cx-12, height//3), (cx+12, height), (80, 140, 60), -1)
        cv2.putText(bg, "HA LONG", (width//3, height//3-10), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 220), 3)
    else:
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        xv, yv = np.meshgrid(x, y)
        bg[:, :, 0] = (120 + 60 * yv).astype(np.uint8)
        bg[:, :, 1] = (150 + 70 * xv).astype(np.uint8)
        bg[:, :, 2] = (190 + 45 * (1 - yv)).astype(np.uint8)
        for i in range(0, width, 80):
            cv2.line(bg, (i, height), (i + 80, int(height * 0.55)), (80, 120, 150), 2)
    return bg
