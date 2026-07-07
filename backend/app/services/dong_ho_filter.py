import cv2
import numpy as np

def apply_dong_ho(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    h, w = image.shape[:2]
    smooth = cv2.bilateralFilter(image, d=9, sigmaColor=80, sigmaSpace=80)
    palette = np.array([
        (214, 224, 236),  # ivory diep paper
        (33, 28, 24),     # woodblock black
        (44, 48, 142),    # son red
        (55, 158, 202),   # ochre yellow
        (74, 116, 58),    # leaf green
        (48, 88, 126),    # earth brown
        (108, 118, 132),  # muted blue-gray
    ], dtype=np.uint8)

    lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB).reshape((-1, 1, 3)).astype(np.int16)
    pal_lab = cv2.cvtColor(palette.reshape((-1, 1, 3)), cv2.COLOR_BGR2LAB).reshape((1, -1, 3)).astype(np.int16)
    labels = np.argmin(np.sum((lab - pal_lab) ** 2, axis=2), axis=1)
    result = palette[labels].reshape(image.shape)

    hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV)
    paper_mask = ((hsv[:, :, 1] < 58) & (hsv[:, :, 2] > 105)) | (hsv[:, :, 2] > 190)
    yy, xx = np.indices((h, w))
    paper_variants = np.array([(214, 224, 236), (207, 219, 232), (220, 228, 239)], dtype=np.uint8)
    variant_index = ((xx + yy * 2) % 11 > 7).astype(np.uint8) + ((xx * 3 + yy) % 23 == 0).astype(np.uint8)
    result[paper_mask] = paper_variants[variant_index][paper_mask]

    gray = cv2.cvtColor(smooth, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 55, 135)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
    result[edges > 0] = (28, 24, 21)

    border = max(6, min(h, w) // 34)
    inset = border * 2
    cv2.rectangle(result, (0, 0), (w - 1, h - 1), (28, 24, 21), border)
    if w > inset * 3 and h > inset * 3:
        cv2.rectangle(result, (inset, inset), (w - inset - 1, h - inset - 1), (44, 48, 142), max(2, border // 3))
    if h >= 180 and w >= 260:
        cv2.putText(result, "VINH HOA PHU QUY", (border * 2, border * 4), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (44, 48, 142), 2, cv2.LINE_8)

    return result
