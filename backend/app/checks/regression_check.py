import cv2
import numpy as np

from app.routes.image_routes import filters
from app.services.filter_service import FILTERS, process_image


def main():
    sample = np.full((96, 128, 3), (100, 140, 190), dtype=np.uint8)
    ok, encoded = cv2.imencode(".png", sample)
    assert ok, "sample encode failed"
    assert set(FILTERS) == {"dong_ho", "landmark", "tet"}
    filter_meta = {item["type"]: item for item in filters()["filters"]}
    assert filter_meta["landmark"]["opts"] == ["hoi_an", "hue", "ho_guom", "ha_long"]
    assert filter_meta["tet"]["tetLocations"] == ["home", "street", "flower_market"]
    cases = [
        ("dong_ho", {}),
        ("landmark", {"filterOptions": {"landmark": "hoi_an"}}),
        ("landmark", {"filterOptions": {"landmark": "hue"}}),
        ("landmark", {"filterOptions": {"landmark": "ho_guom"}}),
        ("landmark", {"filterOptions": {"landmark": "ha_long"}}),
        ("tet", {"filterOptions": {"tetLocation": "home"}}),
        ("tet", {"filterOptions": {"tetLocation": "street"}}),
        ("tet", {"filterOptions": {"tetLocation": "flower_market"}}),
    ]
    for filter_type, metadata in cases:
        payload = process_image(encoded.tobytes(), filter_type, metadata)
        assert payload.startswith(b"\x89PNG"), filter_type
    base_tet = process_image(encoded.tobytes(), "tet", {"filterOptions": {"tetLocation": "home"}})
    street_tet = process_image(encoded.tobytes(), "tet", {"filterOptions": {"tetLocation": "street"}})
    assert base_tet != street_tet, "tet location should change output"
    for removed in ("time_travel", "costume", "tuong"):
        try:
            process_image(encoded.tobytes(), removed, {})
        except ValueError as exc:
            assert str(exc) == "filter_type khong hop le."
        else:
            raise AssertionError(f"{removed} should be rejected")
    print("regression check ok")


if __name__ == "__main__":
    main()
