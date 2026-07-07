import cv2
import numpy as np

from app.utils.image_utils import detect_faces


def face_rects(image: np.ndarray, metadata: dict | None = None) -> list[tuple[int, int, int, int]]:
    rects = _landmark_rects(image, metadata)
    if rects:
        return rects
    rects = _mediapipe_face_rects(image)
    if rects:
        return rects
    return [tuple(map(int, face)) for face in detect_faces(image)]


def subject_mask(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    mp_mask = _mediapipe_subject_mask(image)
    if mp_mask is not None:
        return mp_mask

    h, w = image.shape[:2]
    rects = face_rects(image, metadata)
    seed = np.full((h, w), cv2.GC_PR_BGD, dtype=np.uint8)
    border = max(2, min(w, h) // 70)
    seed[:border, :] = cv2.GC_BGD
    seed[-border:, :] = cv2.GC_BGD
    seed[:, :border] = cv2.GC_BGD
    seed[:, -border:] = cv2.GC_BGD

    if rects:
        for x, y, fw, fh in rects[:2]:
            _mark_person_seed(seed, x, y, fw, fh)
    else:
        cx = w // 2
        cv2.ellipse(seed, (cx, int(h * 0.36)), (int(w * 0.20), int(h * 0.24)), 0, 0, 360, cv2.GC_PR_FGD, -1)
        cv2.ellipse(seed, (cx, int(h * 0.70)), (int(w * 0.30), int(h * 0.28)), 0, 0, 360, cv2.GC_PR_FGD, -1)

    bg_model = np.zeros((1, 65), dtype=np.float64)
    fg_model = np.zeros((1, 65), dtype=np.float64)
    try:
        cv2.grabCut(image, seed, None, bg_model, fg_model, 4, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return _seed_to_alpha(seed)

    mask = np.where((seed == cv2.GC_FGD) | (seed == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    mask = _largest_component(mask)
    if mask.mean() < 0.02 or mask.mean() > 0.90:
        return _geometry_alpha(image, rects)
    return _smooth(mask)


def _landmark_rects(image: np.ndarray, metadata: dict | None) -> list[tuple[int, int, int, int]]:
    landmarks = (metadata or {}).get("faceLandmarks") or []
    h, w = image.shape[:2]
    rects = []
    for face in landmarks[:2]:
        points = [(float(p.get("x", 0)) * w, float(p.get("y", 0)) * h) for p in face if isinstance(p, dict)]
        if len(points) < 3:
            continue
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        x1, x2 = max(0, int(min(xs))), min(w - 1, int(max(xs)))
        y1, y2 = max(0, int(min(ys))), min(h - 1, int(max(ys)))
        pad_x = max(10, int((x2 - x1) * 0.60))
        pad_y_top = max(10, int((y2 - y1) * 0.62))
        pad_y_bottom = max(10, int((y2 - y1) * 0.28))
        left = max(0, x1 - pad_x)
        top = max(0, y1 - pad_y_top)
        right = min(w - 1, x2 + pad_x)
        bottom = min(h - 1, y2 + pad_y_bottom)
        if right - left > 12 and bottom - top > 12:
            rects.append((left, top, right - left, bottom - top))
    return rects


def _mediapipe_subject_mask(image: np.ndarray) -> np.ndarray | None:
    try:
        import mediapipe as mp
    except Exception:
        return None

    try:
        segmenter = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = segmenter.process(rgb)
        segmenter.close()
    except Exception:
        return None

    raw = getattr(result, "segmentation_mask", None)
    if raw is None:
        return None

    mask = (raw > 0.25).astype(np.uint8)
    mask = _largest_component(mask)
    coverage = float(mask.mean())
    if coverage < 0.02 or coverage > 0.88:
        return None
    return _smooth(mask)


def _mediapipe_face_rects(image: np.ndarray) -> list[tuple[int, int, int, int]]:
    try:
        import mediapipe as mp
    except Exception:
        return []

    try:
        detector = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.45)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = detector.process(rgb)
        detector.close()
    except Exception:
        return []

    h, w = image.shape[:2]
    rects = []
    for detection in getattr(result, "detections", None) or []:
        box = detection.location_data.relative_bounding_box
        x = max(0, int(box.xmin * w))
        y = max(0, int(box.ymin * h))
        rw = min(w - x, max(1, int(box.width * w)))
        rh = min(h - y, max(1, int(box.height * h)))
        if rw >= 24 and rh >= 24:
            rects.append((x, y, rw, rh))
    return rects


def _mark_person_seed(seed: np.ndarray, x: int, y: int, w: int, h: int) -> None:
    ih, iw = seed.shape[:2]
    cx = x + w // 2
    face_cy = y + h // 2
    body_cy = min(ih - 1, y + int(h * 2.15))
    head_axes = (max(8, int(w * 0.46)), max(8, int(h * 0.56)))
    body_axes = (max(14, int(w * 0.72)), max(18, int(h * 1.42)))
    cv2.ellipse(seed, (cx, face_cy), head_axes, 0, 0, 360, cv2.GC_PR_FGD, -1)
    cv2.ellipse(seed, (cx, body_cy), body_axes, 0, 0, 360, cv2.GC_PR_FGD, -1)
    cv2.rectangle(
        seed,
        (max(0, x + int(w * 0.20)), max(0, y + int(h * 0.15))),
        (min(iw - 1, x + int(w * 0.80)), min(ih - 1, y + int(h * 0.86))),
        cv2.GC_FGD,
        -1,
    )


def _seed_to_alpha(seed: np.ndarray) -> np.ndarray:
    mask = np.where((seed == cv2.GC_FGD) | (seed == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
    return _smooth(mask)


def _geometry_alpha(image: np.ndarray, rects: list[tuple[int, int, int, int]]) -> np.ndarray:
    h, w = image.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    if not rects:
        cv2.ellipse(mask, (w // 2, int(h * 0.42)), (int(w * 0.22), int(h * 0.28)), 0, 0, 360, 1, -1)
        cv2.ellipse(mask, (w // 2, int(h * 0.76)), (int(w * 0.30), int(h * 0.24)), 0, 0, 360, 1, -1)
        return _smooth(mask)
    for x, y, fw, fh in rects[:2]:
        cx = x + fw // 2
        face_cy = y + fh // 2
        body_cy = min(h - 1, y + int(fh * 2.05))
        cv2.ellipse(mask, (cx, face_cy), (max(8, int(fw * 0.38)), max(8, int(fh * 0.50))), 0, 0, 360, 1, -1)
        cv2.ellipse(mask, (cx, body_cy), (max(12, int(fw * 0.46)), max(14, int(fh * 1.05))), 0, 0, 360, 1, -1)
    return _smooth(mask)


def _largest_component(mask: np.ndarray) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if count <= 1:
        return mask
    return (labels == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)


def _smooth(mask: np.ndarray) -> np.ndarray:
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (17, 17), 0)
    return np.clip(alpha, 0, 1)
