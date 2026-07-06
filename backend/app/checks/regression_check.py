import cv2
import numpy as np

from app.routes.image_routes import filters
from app.services.filter_service import FILTERS, process_image


def main():
    sample = np.full((96, 128, 3), (100, 140, 190), dtype=np.uint8)
    ok, encoded = cv2.imencode(".png", sample)
    assert ok, "sample encode failed"
    assert set(FILTERS) == {"dong_ho", "time_travel", "landmark", "costume", "tet", "tuong"}
    filter_meta = {item["type"]: item for item in filters()["filters"]}
    assert filter_meta["time_travel"]["modes"] == ["1980", "modern", "future"]
    assert filter_meta["landmark"]["opts"] == ["hoi_an", "hue", "ho_guom", "ha_long"]
    assert filter_meta["costume"]["opts"] == ["non_la", "khan_dong", "khan_ran"]
    assert filter_meta["tet"]["tetLocations"] == ["home", "street", "flower_market"]
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
        ("tet", {"filterOptions": {"tetLocation": "home"}}),
        ("tet", {"filterOptions": {"tetLocation": "street"}}),
        ("tet", {"filterOptions": {"tetLocation": "flower_market"}}),
        ("tuong", {"faceLandmarks": [[
            {"x": 0.38, "y": 0.34}, {"x": 0.62, "y": 0.34},
            {"x": 0.50, "y": 0.52}, {"x": 0.36, "y": 0.70},
            {"x": 0.64, "y": 0.70},
        ]]}),
    ]
    for filter_type, metadata in cases:
        payload = process_image(encoded.tobytes(), filter_type, metadata)
        assert payload.startswith(b"\x89PNG"), filter_type
    base_tet = process_image(encoded.tobytes(), "tet", {"filterOptions": {"tetLocation": "home"}})
    street_tet = process_image(encoded.tobytes(), "tet", {"filterOptions": {"tetLocation": "street"}})
    assert base_tet != street_tet, "tet location should change output"
    base_tuong = process_image(encoded.tobytes(), "tuong", {})
    landmark_tuong = process_image(encoded.tobytes(), "tuong", cases[-1][1])
    assert base_tuong != landmark_tuong, "tuong landmarks should drive perspective texture"
    print("regression check ok")


if __name__ == "__main__":
    main()
