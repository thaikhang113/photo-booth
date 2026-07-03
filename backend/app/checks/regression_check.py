import cv2
import numpy as np

from app.services.filter_service import FILTERS, process_image


def main():
    sample = np.full((96, 128, 3), (100, 140, 190), dtype=np.uint8)
    ok, encoded = cv2.imencode(".png", sample)
    assert ok, "sample encode failed"
    assert set(FILTERS) == {"dong_ho", "time_travel", "landmark", "costume", "tet", "tuong"}
    cases = [
        ("dong_ho", {}),
        ("time_travel", {"filterOptions": {"timeTravelMode": "1980"}}),
        ("time_travel", {"filterOptions": {"timeTravelMode": "modern"}}),
        ("time_travel", {"filterOptions": {"timeTravelMode": "future"}}),
        ("landmark", {"filterOptions": {"landmark": "hoi_an"}}),
        ("landmark", {"filterOptions": {"landmark": "hue"}}),
        ("landmark", {"filterOptions": {"landmark": "ho_guom"}}),
        ("landmark", {"filterOptions": {"landmark": "ha_long"}}),
        ("costume", {"filterOptions": {"costume": "non_la"}}),
        ("costume", {"filterOptions": {"costume": "khan_dong"}}),
        ("costume", {"filterOptions": {"costume": "khan_ran"}}),
        ("tet", {}),
        ("tuong", {}),
    ]
    for filter_type, metadata in cases:
        payload = process_image(encoded.tobytes(), filter_type, metadata)
        assert payload.startswith(b"\x89PNG"), filter_type
    print("regression check ok")


if __name__ == "__main__":
    main()
