import cv2
import numpy as np


def apply_time_travel(image: np.ndarray) -> np.ndarray:
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

