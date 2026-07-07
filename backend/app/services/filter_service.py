from app.services.dong_ho_filter import apply_dong_ho
from app.services.landmark_filter import apply_landmark
from app.services.tet_filter import apply_tet
from app.utils.image_utils import bytes_to_bgr, png_bytes

FILTERS = {
    "dong_ho": "Tranh Đông Hồ",
    "landmark": "Địa Danh Việt Nam",
    "tet": "Tết Việt Nam",
}

FILTER_METADATA = {
    "landmark": {"opts": ["hoi_an", "hue", "ho_guom", "ha_long"]},
    "tet": {"tetLocations": ["home", "street", "flower_market"]},
}

PROCESSORS = {
    "dong_ho": apply_dong_ho,
    "landmark": apply_landmark,
    "tet": apply_tet,
}

def process_image(data: bytes, filter_type: str, metadata: dict | None = None):
    if filter_type not in PROCESSORS:
        raise ValueError("filter_type khong hop le.")
    image = bytes_to_bgr(data)
    result = PROCESSORS[filter_type](image, metadata=metadata)
    return png_bytes(result)
