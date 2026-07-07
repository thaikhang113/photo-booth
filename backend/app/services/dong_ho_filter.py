import cv2
import numpy as np

from app.services.subject_utils import subject_mask


def _nearest_palette(image: np.ndarray, palette: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).reshape((-1, 1, 3)).astype(np.int32)
    pal_lab = cv2.cvtColor(palette.reshape((-1, 1, 3)), cv2.COLOR_BGR2LAB).reshape((1, -1, 3)).astype(np.int32)
    labels = np.argmin(np.sum((lab - pal_lab) ** 2, axis=2), axis=1)
    return palette[labels].reshape(image.shape)


def _paper_background(h: int, w: int) -> np.ndarray:
    yy, xx = np.indices((h, w))
    paper_variants = np.array([
        (204, 216, 229), (208, 220, 233), (212, 223, 235),
        (216, 226, 238), (220, 229, 240), (224, 232, 242),
        (210, 217, 226), (218, 224, 232), (226, 233, 241),
    ], dtype=np.uint8)
    variant_index = ((xx // 5 + yy // 7 + (xx * 3 + yy * 5) % 9) % len(paper_variants)).astype(np.uint8)
    paper = paper_variants[variant_index].copy()
    speckles = ((xx * 17 + yy * 31) % 113 == 0) | ((xx * 11 + yy * 19) % 157 == 0)
    paper[speckles] = (190, 204, 219)
    return paper


def _clean_edges(edges: np.ndarray, min_area: int) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats((edges > 0).astype(np.uint8), connectivity=8)
    clean = np.zeros(edges.shape, dtype=np.uint8)
    for idx in range(1, count):
        if stats[idx, cv2.CC_STAT_AREA] >= min_area:
            clean[labels == idx] = 255
    return clean


def _draw_folk_motifs(result: np.ndarray, border: int) -> None:
    h, w = result.shape[:2]
    red = (62, 72, 164)
    green = (74, 116, 58)
    line = max(1, border // 5)
    for sx in (1, -1):
        cx = border * 5 if sx == 1 else w - border * 5
        cy = border * 5
        cv2.ellipse(result, (cx, cy), (border * 3, border), 0, 0, 180, red, line, cv2.LINE_8)
        cv2.ellipse(result, (cx + sx * border * 3, cy + border), (border * 2, border), 0, 0, 180, red, line, cv2.LINE_8)
    flower_y = max(border * 7, h - border * 9)
    for sx in (1, -1):
        cx = border * 5 if sx == 1 else w - border * 5
        cv2.circle(result, (cx, flower_y), max(2, border // 2), red, -1, cv2.LINE_8)
        for angle in (0, 60, 120, 180, 240, 300):
            rad = np.deg2rad(angle)
            px = int(cx + np.cos(rad) * border * 2)
            py = int(flower_y + np.sin(rad) * border * 2)
            cv2.ellipse(result, (px, py), (max(2, border), max(2, border // 2)), angle, 0, 360, red, line, cv2.LINE_8)
        cv2.line(result, (cx, flower_y + border * 2), (cx, flower_y + border * 5), green, line, cv2.LINE_8)


def apply_dong_ho(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    h, w = image.shape[:2]
    smooth = cv2.bilateralFilter(image, d=9, sigmaColor=80, sigmaSpace=80)
    palette = np.array([
        (214, 224, 236),  # ivory diep paper
        (33, 28, 24),     # woodblock black
        (44, 48, 142),    # son red
        (46, 134, 190),   # ochre yellow
        (74, 116, 58),    # leaf green
        (54, 90, 126),    # earth brown
        (92, 112, 152),   # warm clay
    ], dtype=np.uint8)

    color_layer = _nearest_palette(smooth, palette)
    shift = np.float32([[1, 0, 1], [0, 1, 0]])
    color_layer = cv2.warpAffine(color_layer, shift, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_REFLECT)
    paper = _paper_background(h, w)
    try:
        alpha = subject_mask(image, metadata)
    except Exception:
        alpha = np.zeros((h, w), dtype=np.float32)
    if float(alpha.mean()) < 0.03 or float(alpha.mean()) > 0.92:
        alpha = np.zeros((h, w), dtype=np.float32)
        paper = cv2.addWeighted(_nearest_palette(cv2.GaussianBlur(smooth, (21, 21), 0), palette), 0.25, paper, 0.75, 0)
    alpha = (alpha > 0.42).astype(np.float32)
    alpha = cv2.morphologyEx(alpha.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=1).astype(np.float32)
    edge_source = smooth
    if h >= 180 and w >= 260 and 0.03 < float(alpha.mean()) < 0.92:
        border_for_layout = max(6, min(h, w) // 34)
        inset_for_layout = border_for_layout * 2
        band_height = max(32, border_for_layout * 5)
        band_top = max(inset_for_layout * 3, h - inset_for_layout - band_height)
        ys = np.where(alpha > 0)[0]
        if ys.size:
            shift_up = max(0, int(ys.max() - (band_top - border_for_layout)))
            shift_up = min(shift_up, int(h * 0.22))
            if shift_up:
                matrix = np.float32([[1, 0, 0], [0, 1, -shift_up]])
                alpha = cv2.warpAffine(alpha, matrix, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
                color_layer = cv2.warpAffine(color_layer, matrix, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
                edge_source = cv2.warpAffine(smooth, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    alpha3 = np.repeat(alpha[:, :, None], 3, axis=2)
    result = (color_layer.astype(np.float32) * alpha3 + paper.astype(np.float32) * (1 - alpha3)).astype(np.uint8)

    gray = cv2.cvtColor(edge_source, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 55, 135)
    carved = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 17, 5)
    edge_nearby = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)
    edges = cv2.bitwise_or(edges, cv2.bitwise_and(carved, edge_nearby))
    edges = cv2.bitwise_and(edges, (alpha > 0.22).astype(np.uint8) * 255)
    edges = _clean_edges(edges, max(4, min(h, w) // 42))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=2)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
    result[edges > 0] = (28, 24, 21)

    border = max(6, min(h, w) // 34)
    inset = border * 2
    _draw_folk_motifs(result, border)
    cv2.rectangle(result, (0, 0), (w - 1, h - 1), (28, 24, 21), border)
    if w > inset * 3 and h > inset * 3:
        cv2.rectangle(result, (inset, inset), (w - inset - 1, h - inset - 1), (44, 48, 142), max(2, border // 3))
    if h >= 180 and w >= 260:
        text = "VINH HOA PHU QUY"
        font_scale = 0.58
        thickness = 2
        text_size, _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        band_height = max(32, border * 5)
        band_top = max(inset * 3, h - inset - band_height)
        band_left = inset + border
        band_right = w - inset - border
        band_bottom = h - inset
        band_layer = result.copy()
        band_layer[band_top:band_bottom, band_left:band_right] = (216, 226, 238)
        cv2.rectangle(band_layer, (band_left, band_top), (band_right - 1, band_bottom - 1), (44, 48, 142), max(1, border // 4))
        x = max(border * 2, (w - text_size[0]) // 2)
        y = band_top + (band_height + text_size[1]) // 2
        cv2.putText(band_layer, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (44, 48, 142), thickness, cv2.LINE_8)
        band_background = alpha < 0.35
        result[band_background] = band_layer[band_background]

    return result
