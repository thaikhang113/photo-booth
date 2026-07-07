import cv2
import numpy as np
from pathlib import Path

from app.services.subject_utils import face_rects

ASSET_PATH = Path(__file__).resolve().parents[1] / "assets" / "tuong" / "tuong_mask.png"


def apply_tuong(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    faces = _landmark_faces(image, metadata) or _rect_faces(image, metadata)
    if not faces:
        return image.copy()

    result = image.copy()
    texture = _load_tuong_texture()
    for face in faces:
        result = _warp_tuong_texture(result, texture, face)
    return result


def _rect_faces(image: np.ndarray, metadata: dict | None) -> list[dict]:
    faces = []
    for x, y, w, h in face_rects(image, metadata)[:2]:
        x, y, w, h = _tuong_face_area(image, x, y, w, h)
        faces.append({"quad": _rect_quad(x, y, w, h), "mask": _ellipse_mask(image.shape[:2], x, y, w, h)})
    return faces


def _landmark_faces(image: np.ndarray, metadata: dict | None) -> list[dict]:
    landmarks = (metadata or {}).get("faceLandmarks") or []
    h, w = image.shape[:2]
    faces = []
    for face in landmarks[:2]:
        points = np.array(
            [(float(p.get("x", 0)) * w, float(p.get("y", 0)) * h) for p in face if isinstance(p, dict)],
            dtype=np.float32,
        )
        if len(points) < 3:
            continue
        x1, y1 = np.maximum(points.min(axis=0), 0)
        x2, y2 = np.minimum(points.max(axis=0), (w - 1, h - 1))
        fw, fh = x2 - x1, y2 - y1
        if fw < 12 or fh < 12:
            continue
        pad_x = max(10, fw * 0.62)
        pad_top = max(10, fh * 0.66)
        pad_bottom = max(10, fh * 0.30)
        x = max(0, int(x1 - pad_x))
        y = max(0, int(y1 - pad_top))
        right = min(w - 1, int(x2 + pad_x))
        bottom = min(h - 1, int(y2 + pad_bottom))
        faces.append({"quad": _rect_quad(x, y, right - x, bottom - y), "mask": _landmark_mask((h, w), points)})
    return faces


def _tuong_face_area(image: np.ndarray, x: int, y: int, w: int, h: int) -> tuple[int, int, int, int]:
    ih, iw = image.shape[:2]
    nx = max(0, x + int(w * 0.12))
    ny = max(0, y + int(h * 0.16))
    nw = min(iw - nx, max(16, int(w * 0.76)))
    nh = min(ih - ny, max(16, int(h * 0.76)))
    return nx, ny, nw, nh


def _load_tuong_texture() -> np.ndarray:
    texture = cv2.imread(str(ASSET_PATH), cv2.IMREAD_UNCHANGED)
    if texture is not None and texture.shape[2] == 4:
        return texture
    return _fallback_texture()


def _warp_tuong_texture(image: np.ndarray, texture: np.ndarray, face: dict) -> np.ndarray:
    tex_h, tex_w = texture.shape[:2]
    src = np.float32([[0, 0], [tex_w - 1, 0], [tex_w - 1, tex_h - 1], [0, tex_h - 1]])
    dst = face["quad"].astype(np.float32)
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(texture[:, :, :3], matrix, (image.shape[1], image.shape[0]))
    mask = texture[:, :, 3]
    warped_mask = cv2.warpPerspective(mask, matrix, (image.shape[1], image.shape[0]))
    face_mask = face["mask"].astype(np.float32)
    alpha = (warped_mask.astype(np.float32) / 255.0 * face_mask)[:, :, None] * 0.78
    return (warped * alpha + image * (1 - alpha)).astype(np.uint8)


def _rect_quad(x: int, y: int, w: int, h: int) -> np.ndarray:
    return np.array(
        [
            [x + int(w * 0.08), y + int(h * 0.02)],
            [x + int(w * 0.92), y],
            [x + int(w * 0.88), y + int(h * 0.98)],
            [x + int(w * 0.12), y + h],
        ],
        dtype=np.float32,
    )


def _ellipse_mask(shape: tuple[int, int], x: int, y: int, w: int, h: int) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.float32)
    cv2.ellipse(mask, (x + w // 2, y + h // 2), (max(8, w // 2), max(8, h // 2)), 0, 0, 360, 1, -1)
    return cv2.GaussianBlur(mask, (15, 15), 0)


def _landmark_mask(shape: tuple[int, int], points: np.ndarray) -> np.ndarray:
    x, y, w, h = cv2.boundingRect(points.astype(np.int32))
    return _ellipse_mask(shape, x, y, w, h)


def _fallback_texture() -> np.ndarray:
    texture = np.zeros((360, 280, 4), dtype=np.uint8)
    texture[:, :, :3] = (238, 232, 216)
    cv2.ellipse(texture[:, :, 3], (140, 180), (128, 168), 0, 0, 360, 220, -1)
    cv2.line(texture, (140, 28), (140, 330), (0, 0, 180, 230), 12)
    cv2.ellipse(texture, (92, 170), (36, 54), -20, 0, 360, (12, 12, 16, 210), 8)
    cv2.ellipse(texture, (188, 170), (36, 54), 20, 0, 360, (12, 12, 16, 210), 8)
    cv2.polylines(texture, [np.array([(72, 260), (140, 312), (208, 260)], dtype=np.int32)], True, (0, 0, 190, 220), 8)
    return texture
