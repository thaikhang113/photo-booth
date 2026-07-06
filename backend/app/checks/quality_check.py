import cv2
import numpy as np

from app.services.costume_filter import apply_costume
from app.services.landmark_filter import apply_landmark
from app.services.tet_filter import apply_tet
from app.services.time_travel_filter import apply_time_travel
from app.services.tuong_filter import apply_tuong


FACE_LANDMARKS = [[
    {"x": 0.40, "y": 0.24}, {"x": 0.60, "y": 0.24},
    {"x": 0.34, "y": 0.42}, {"x": 0.66, "y": 0.42},
    {"x": 0.50, "y": 0.52}, {"x": 0.38, "y": 0.68},
    {"x": 0.62, "y": 0.68},
]]


def _portrait():
    image = np.full((240, 320, 3), (185, 180, 170), dtype=np.uint8)
    cv2.rectangle(image, (0, 0), (319, 239), (120, 110, 105), -1)
    cv2.rectangle(image, (95, 112), (225, 235), (210, 210, 210), -1)
    cv2.ellipse(image, (160, 92), (48, 60), 0, 0, 360, (175, 145, 120), -1)
    cv2.circle(image, (143, 86), 5, (30, 30, 30), -1)
    cv2.circle(image, (177, 86), 5, (30, 30, 30), -1)
    cv2.ellipse(image, (160, 113), (18, 7), 0, 0, 180, (80, 60, 60), 2)
    return image


def _changed_ratio(a, b):
    return float(np.mean(np.any(np.abs(a.astype(np.int16) - b.astype(np.int16)) > 10, axis=2)))


def main():
    image = _portrait()
    metadata = {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {}}

    future = apply_time_travel(image, {"filterOptions": {"timeTravelMode": "future"}})
    assert future[:, :, 0].mean() > image[:, :, 0].mean(), "future should add clean blue/cyan light"
    assert future[:, :, 2].mean() > image[:, :, 2].mean() - 5, "future should not crush warm face tones"

    landmark = apply_landmark(image, {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {"landmark": "ha_long"}})
    assert _changed_ratio(image[:60], landmark[:60]) > 0.35, "landmark should replace background"
    assert _changed_ratio(image[70:170, 115:205], landmark[70:170, 115:205]) < 0.65, "landmark should preserve subject"

    tet = apply_tet(image, {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {"tetLocation": "flower_market"}})
    assert _changed_ratio(image[:60], tet[:60]) > 0.35, "tet should replace background"
    assert _changed_ratio(image[70:170, 115:205], tet[70:170, 115:205]) < 0.75, "tet should preserve subject"

    non_la = apply_costume(image, {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {"costume": "non_la"}})
    assert _changed_ratio(image[:115], non_la[:115]) > 0.05, "non la should be placed from face landmarks"
    assert _changed_ratio(image[125:], non_la[125:]) < 0.08, "non la should not cover body/background"

    tuong = apply_tuong(image, metadata)
    assert _changed_ratio(image[50:150, 105:215], tuong[50:150, 105:215]) > 0.12, "tuong should affect detected face"
    assert _changed_ratio(image[:40], tuong[:40]) < 0.08, "tuong should not paint random background"

    print("quality check ok")


if __name__ == "__main__":
    main()
