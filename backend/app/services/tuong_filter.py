import cv2
import numpy as np

from app.utils.image_utils import detect_faces

def apply_tuong(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(np.int16) * 1.35, 0, 255).astype(np.uint8)
    result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    result = cv2.convertScaleAbs(result, alpha=1.15, beta=4)

    landmark_faces = _landmark_faces(image, metadata)
    faces = landmark_faces or list(detect_faces(image))
    if len(faces) == 0:
        h, w = image.shape[:2]
        faces = [(w // 4, h // 5, w // 2, int(h * 0.55))]

    for (x, y, w, h) in faces:
        result = _warp_tuong_texture(result, x, y, w, h)
        center = (x + w // 2, y + h // 2)
        cv2.ellipse(result, center, (w // 2, h // 2), 0, 0, 360, (245, 245, 245), 2)
        cv2.line(result, (x + w // 2, y + h // 6), (x + w // 2, y + h - h // 8), (0, 0, 220), 4)
        cv2.ellipse(result, (x + w // 3, y + h // 2), (w // 7, h // 5), -20, 0, 360, (0, 0, 210), 3)
        cv2.ellipse(result, (x + 2 * w // 3, y + h // 2), (w // 7, h // 5), 20, 0, 360, (0, 0, 210), 3)
        cv2.polylines(result, [np.array([(x + w // 2, y + h // 2), (x + w // 3, y + 3 * h // 4), (x + 2 * w // 3, y + 3 * h // 4)])], True, (0, 200, 255), 3)
    return result

def _landmark_faces(image: np.ndarray, metadata: dict | None):
    landmarks = (metadata or {}).get("faceLandmarks") or []
    if not landmarks:
        return []
    h, w = image.shape[:2]
    faces = []
    for face in landmarks[:2]:
        points = [(float(p.get("x", 0)) * w, float(p.get("y", 0)) * h) for p in face if isinstance(p, dict)]
        if len(points) < 3:
            continue
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        x1, x2 = max(0, int(min(xs))), min(w - 1, int(max(xs)))
        y1, y2 = max(0, int(min(ys))), min(h - 1, int(max(ys)))
        pad_x = max(8, int((x2 - x1) * 0.55))
        pad_y = max(8, int((y2 - y1) * 0.45))
        left = max(0, x1 - pad_x)
        top = max(0, y1 - pad_y)
        right = min(w - 1, x2 + pad_x)
        bottom = min(h - 1, y2 + pad_y)
        if right - left > 12 and bottom - top > 12:
            faces.append((left, top, right - left, bottom - top))
    return faces

def _warp_tuong_texture(image: np.ndarray, x: int, y: int, w: int, h: int) -> np.ndarray:
    tex_w, tex_h = max(24, w), max(24, h)
    texture = np.zeros((tex_h, tex_w, 3), dtype=np.uint8)
    texture[:] = (235, 235, 245)
    cv2.ellipse(texture, (tex_w // 2, tex_h // 2), (tex_w // 2 - 2, tex_h // 2 - 2), 0, 0, 360, (245, 245, 245), -1)
    cv2.line(texture, (tex_w // 2, 4), (tex_w // 2, tex_h - 4), (0, 0, 220), max(2, tex_w // 20))
    cv2.circle(texture, (tex_w // 3, tex_h // 2), max(3, tex_w // 10), (0, 0, 190), 2)
    cv2.circle(texture, (2 * tex_w // 3, tex_h // 2), max(3, tex_w // 10), (0, 0, 190), 2)
    for i in range(0, tex_w, max(6, tex_w // 12)):
        cv2.line(texture, (i, 0), (tex_w - i // 2, tex_h), (0, 190, 230), 1)

    src = np.float32([[0, 0], [tex_w - 1, 0], [tex_w - 1, tex_h - 1], [0, tex_h - 1]])
    dst = np.float32([
        [x + int(w * 0.08), y + int(h * 0.04)],
        [x + int(w * 0.92), y],
        [x + int(w * 0.86), y + int(h * 0.96)],
        [x + int(w * 0.14), y + h],
    ])
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(texture, matrix, (image.shape[1], image.shape[0]))
    mask = np.zeros((tex_h, tex_w), dtype=np.uint8)
    cv2.ellipse(mask, (tex_w // 2, tex_h // 2), (tex_w // 2 - 2, tex_h // 2 - 2), 0, 0, 360, 210, -1)
    warped_mask = cv2.warpPerspective(mask, matrix, (image.shape[1], image.shape[0]))
    alpha = (warped_mask.astype(np.float32) / 255.0)[:, :, None] * 0.58
    return (warped * alpha + image * (1 - alpha)).astype(np.uint8)
