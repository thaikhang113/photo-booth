import numpy as np
import cv2
from pathlib import Path

from app.services.filter_service import PROCESSORS, process_image
from app.services.landmark_filter import _opencv_person_mask

RESULTS_DIR = Path(__file__).resolve().parents[1] / "results"


def main():
    sample = np.full((180, 240, 3), (120, 170, 210), dtype=np.uint8)
    for name, processor in PROCESSORS.items():
        result = processor(sample.copy())
        assert result.shape == sample.shape, f"{name}: wrong shape"
        assert result.dtype == np.uint8, f"{name}: wrong dtype"
    subject = np.zeros((220, 180, 3), dtype=np.uint8)
    subject[:] = (40, 180, 40)
    subject[35:185, 60:120] = (220, 220, 230)
    mask = _opencv_person_mask(subject)
    assert mask is not None, "opencv fallback mask missing"
    assert mask[110, 90] > 0.7, "subject center not preserved"
    assert mask[10, 10] < 0.25, "background corner not removed"

    ok, png = cv2.imencode(".png", sample)
    assert ok, "sample encode failed"
    before = set(RESULTS_DIR.glob("*.png")) if RESULTS_DIR.exists() else set()
    payload = process_image(png.tobytes(), "dong_ho")
    after = set(RESULTS_DIR.glob("*.png")) if RESULTS_DIR.exists() else set()
    assert isinstance(payload, bytes), "process_image should return in-memory PNG bytes"
    assert after == before, "process_image should not persist result files"
    print("backend self-check ok")


if __name__ == "__main__":
    main()
