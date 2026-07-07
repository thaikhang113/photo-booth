import cv2
import numpy as np

from app.services.dong_ho_filter import _nearest_palette, apply_dong_ho
from app.services.landmark_filter import apply_landmark
from app.services.subject_utils import subject_mask
from app.services.tet_filter import apply_tet


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
    palette_probe = np.array([(214, 224, 236), (33, 28, 24)], dtype=np.uint8)
    mapped = _nearest_palette(np.array([[[255, 255, 255], [0, 0, 0]]], dtype=np.uint8), palette_probe)
    assert tuple(mapped[0, 0]) == (214, 224, 236), "dong ho palette should map white to ivory, not black"
    assert tuple(mapped[0, 1]) == (33, 28, 24), "dong ho palette should map black to woodblock black"

    image = _portrait()
    metadata = {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {}}

    dong_ho = apply_dong_ho(image, metadata)
    palette_size = len(np.unique(dong_ho.reshape(-1, 3), axis=0))
    border = np.concatenate([dong_ho[:8].reshape(-1, 3), dong_ho[-8:].reshape(-1, 3), dong_ho[:, :8].reshape(-1, 3), dong_ho[:, -8:].reshape(-1, 3)])
    dark_ratio = float(np.mean(np.all(dong_ho < 55, axis=2)))
    paper_ratio = float(np.mean((dong_ho[:, :, 0] > 190) & (dong_ho[:, :, 1] > 195) & (dong_ho[:, :, 2] > 205)))
    mask = subject_mask(image, metadata) > 0.55
    background = ~mask
    background[:12, :] = False
    background[-12:, :] = False
    background[:, :12] = False
    background[:, -12:] = False
    background_dark_ratio = float(np.mean(np.all(dong_ho[background] < 55, axis=1)))
    subject_dark_ratio = float(np.mean(np.all(dong_ho[mask] < 55, axis=1)))
    background_paper_ratio = float(np.mean((dong_ho[background, 0] > 190) & (dong_ho[background, 1] > 195) & (dong_ho[background, 2] > 205)))
    cool_gray_ratio = float(np.mean(
        (np.abs(dong_ho[:, :, 0].astype(np.int16) - dong_ho[:, :, 1].astype(np.int16)) < 18)
        & (np.abs(dong_ho[:, :, 1].astype(np.int16) - dong_ho[:, :, 2].astype(np.int16)) < 18)
        & (dong_ho.mean(axis=2) > 65)
        & (dong_ho.mean(axis=2) < 180)
    ))
    red_ink = (dong_ho[:, :, 2] > 100) & (dong_ho[:, :, 1] < 90) & (dong_ho[:, :, 0] < 90)
    lower_caption_ratio = float(np.mean(red_ink[-45:-12, 36:-36]))
    upper_subject_ratio = float(np.mean(red_ink[30:110, 72:-72]))
    assert 12 <= palette_size < 120, "dong ho should use restrained colors plus subtle diep-paper texture"
    assert float(border.mean()) < float(dong_ho.mean()) - 20, "dong ho should add a dark folk-art border"
    assert dark_ratio > 0.05, "dong ho should have visible black woodcut lines"
    assert paper_ratio > 0.08, "dong ho should preserve ivory diep-paper tones"
    assert background_paper_ratio > 0.70, "dong ho should replace busy background with ivory diep paper"
    assert background_dark_ratio < subject_dark_ratio * 0.65, "dong ho should keep background cleaner than the subject"
    assert cool_gray_ratio < 0.12, "dong ho should not be dominated by cool classroom grays"
    assert lower_caption_ratio > 0.01, "dong ho caption/red ink should sit in the lower folk border"
    assert upper_subject_ratio < 0.005, "dong ho caption should not cover the face/top subject area"

    landmark = apply_landmark(image, {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {"landmark": "ha_long"}})
    assert _changed_ratio(image[:60], landmark[:60]) > 0.35, "landmark should replace background"
    assert _changed_ratio(image[70:170, 115:205], landmark[70:170, 115:205]) < 0.65, "landmark should preserve subject"

    tet = apply_tet(image, {"faceLandmarks": FACE_LANDMARKS, "filterOptions": {"tetLocation": "flower_market"}})
    assert _changed_ratio(image[:60], tet[:60]) > 0.35, "tet should replace background"
    assert _changed_ratio(image[70:170, 115:205], tet[70:170, 115:205]) < 0.75, "tet should preserve subject"

    print("quality check ok")


if __name__ == "__main__":
    main()
