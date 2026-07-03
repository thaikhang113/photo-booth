import cv2
import numpy as np
from pathlib import Path

from app.utils.image_utils import detect_faces

ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "backgrounds"

def apply_landmark(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    landmark_id = None
    if metadata:
        landmark_id = (metadata.get("filterOptions") or {}).get("landmark")
    background = _load_background(image.shape[1], image.shape[0], landmark_id)
    mask = _selfie_mask(image)
    if mask is None:
        mask = _opencv_person_mask(image)
    if mask is None:
        mask = _soft_center_mask(image)
    return (image * mask[:, :, None] + background * (1 - mask[:, :, None])).astype(np.uint8)

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

# _opencv_person_mask, _subject_rect, _largest_component, _soft_center_mask giu nguyen
def _opencv_person_mask(image: np.ndarray):
    h, w = image.shape[:2]
    grabcut_mask = np.zeros((h, w), dtype=np.uint8)
    bg_model = np.zeros((1, 65), dtype=np.float64)
    fg_model = np.zeros((1, 65), dtype=np.float64)
    try:
        cv2.grabCut(image, grabcut_mask, _subject_rect(image), bg_model, fg_model, 5, cv2.GC_INIT_WITH_RECT)
    except cv2.error:
        return None
    mask = np.where((grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    mask = _largest_component(mask)
    if float(mask.mean()) < 0.03 or float(mask.mean()) > 0.88:
        return None
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.GaussianBlur(mask.astype(np.float32), (21, 21), 0)
    return np.clip(mask, 0, 1)

def _subject_rect(image: np.ndarray):
    h, w = image.shape[:2]
    faces = detect_faces(image)
    if len(faces):
        x, y, fw, fh = max(faces, key=lambda face: face[2] * face[3])
        left = max(2, x - fw)
        top = max(2, y - int(fh * 1.1))
        right = min(w - 3, x + fw * 2)
        bottom = min(h - 3, y + int(fh * 4.2))
        return (left, top, max(10, right - left), max(10, bottom - top))
    left = max(2, int(w * 0.16))
    top = max(2, int(h * 0.04))
    return (left, top, min(w - left - 3, int(w * 0.68)), min(h - top - 3, int(h * 0.9)))

def _largest_component(mask: np.ndarray) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if count <= 1:
        return mask
    return (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)

def _soft_center_mask(image: np.ndarray) -> np.ndarray:
    h, w = image.shape[:2]
    mask = np.zeros((h, w), dtype=np.float32)
    cv2.ellipse(mask, (w // 2, h // 2), (int(w * 0.32), int(h * 0.46)), 0, 0, 360, 1, -1)
    return cv2.GaussianBlur(mask, (41, 41), 0)

def _selfie_mask(image: np.ndarray):
    try:
        import mediapipe as mp
    except Exception:
        return None
    segmenter = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    mask = segmenter.process(rgb).segmentation_mask
    segmenter.close()
    return cv2.GaussianBlur((mask > 0.25).astype(np.float32), (21, 21), 0)
