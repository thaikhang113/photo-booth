import cv2
import numpy as np

def apply_time_travel(image: np.ndarray, metadata: dict | None = None) -> np.ndarray:
    mode = "1980"
    if metadata:
        mode = (metadata.get("filterOptions") or {}).get("timeTravelMode") or "1980"

    if mode == "modern":
        result = cv2.convertScaleAbs(image, alpha=1.15, beta=6)
        hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)
        hsv[:,:,1] = np.clip(hsv[:,:,1].astype(np.int16) * 1.2, 0, 255).astype(np.uint8)
        result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        return result

    if mode == "future":
        base = cv2.convertScaleAbs(image, alpha=1.08, beta=6)
        cool = np.zeros_like(base)
        cool[:, :, 0] = 42
        cool[:, :, 1] = 12
        cool[:, :, 2] = 18
        result = cv2.addWeighted(base, 0.88, cool, 0.42, 0)
        h, w = result.shape[:2]
        glow = result.copy()
        for i in range(0, w, max(42, w // 8)):
            cv2.line(glow, (i, h), (min(w - 1, i + w // 5), 0), (255, 120, 220), 1)
        cv2.rectangle(glow, (4, 4), (w - 5, h - 5), (255, 210, 80), 2)
        result = cv2.addWeighted(result, 0.86, glow, 0.14, 0)
        return result

    # 1980 default
    ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
    ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
    balanced = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    sepia_kernel = np.array([[0.272, 0.534, 0.131], [0.349, 0.686, 0.168], [0.393, 0.769, 0.189]])
    sepia = cv2.transform(balanced, sepia_kernel)
    sepia = np.clip(sepia, 0, 255).astype(np.uint8)
    noise = np.random.normal(0, 8, sepia.shape).astype(np.int16)
    noisy = np.clip(sepia.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    h, w = image.shape[:2]
    x = np.linspace(-1, 1, w)
    y = np.linspace(-1, 1, h)
    xv, yv = np.meshgrid(x, y)
    vignette = np.clip(1 - 0.55 * (xv * xv + yv * yv), 0.45, 1)
    return (noisy * vignette[:, :, None]).astype(np.uint8)
