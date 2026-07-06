import cv2
import numpy as np

from app.services.subject_utils import face_rects


def apply_tuong(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    result = cv2.convertScaleAbs(image, alpha=1.05, beta=2)
    faces = face_rects(image, metadata)
    if len(faces) == 0:
        return result

    for (x, y, w, h) in faces:
        x, y, w, h = _tuong_face_area(image, x, y, w, h)
        result = _warp_tuong_texture(result, x, y, w, h)
        center = (x + w // 2, y + h // 2)
        cv2.ellipse(result, center, (w // 2, h // 2), 0, 0, 360, (245, 245, 245), 2)
        cv2.line(result, (x + w // 2, y + h // 7), (x + w // 2, y + h - h // 9), (0, 0, 220), max(2, w // 35))
        cv2.ellipse(result, (x + w // 3, y + h // 2), (w // 7, h // 5), -20, 0, 360, (0, 0, 210), 2)
        cv2.ellipse(result, (x + 2 * w // 3, y + h // 2), (w // 7, h // 5), 20, 0, 360, (0, 0, 210), 2)
        points = np.array([(x + w // 2, y + h // 2), (x + w // 3, y + 3 * h // 4), (x + 2 * w // 3, y + 3 * h // 4)])
        cv2.polylines(result, [points], True, (0, 210, 255), 2)
    return result


def _tuong_face_area(image: np.ndarray, x: int, y: int, w: int, h: int) -> tuple[int, int, int, int]:
    ih, iw = image.shape[:2]
    nx = max(0, x + int(w * 0.12))
    ny = max(0, y + int(h * 0.16))
    nw = min(iw - nx, max(16, int(w * 0.76)))
    nh = min(ih - ny, max(16, int(h * 0.76)))
    return nx, ny, nw, nh


def _warp_tuong_texture(image: np.ndarray, x: int, y: int, w: int, h: int) -> np.ndarray:
    tex_w, tex_h = max(24, w), max(24, h)
    texture = np.zeros((tex_h, tex_w, 3), dtype=np.uint8)
    texture[:] = (238, 238, 246)
    cv2.ellipse(texture, (tex_w // 2, tex_h // 2), (tex_w // 2 - 2, tex_h // 2 - 2), 0, 0, 360, (246, 246, 250), -1)
    cv2.line(texture, (tex_w // 2, 4), (tex_w // 2, tex_h - 4), (0, 0, 220), max(2, tex_w // 24))
    cv2.circle(texture, (tex_w // 3, tex_h // 2), max(3, tex_w // 10), (0, 0, 190), 2)
    cv2.circle(texture, (2 * tex_w // 3, tex_h // 2), max(3, tex_w // 10), (0, 0, 190), 2)
    for i in range(0, tex_w, max(8, tex_w // 10)):
        cv2.line(texture, (tex_w // 2, 0), (i, tex_h), (0, 190, 230), 1)

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
    alpha = (warped_mask.astype(np.float32) / 255.0)[:, :, None] * 0.38
    return (warped * alpha + image * (1 - alpha)).astype(np.uint8)
