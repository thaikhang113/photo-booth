from app.services.costume_filter import apply_costume
from app.services.dong_ho_filter import apply_dong_ho
from app.services.landmark_filter import apply_landmark
from app.services.tet_filter import apply_tet
from app.services.time_travel_filter import apply_time_travel
from app.services.tuong_filter import apply_tuong
from app.utils.image_utils import bytes_to_bgr, png_bytes

FILTERS = {
    "dong_ho": "Tranh Đông Hồ",
    "time_travel": "Du Hành Thời Gian",
    "landmark": "Địa Danh Việt Nam",
    "costume": "Trang Phục Truyền Thống",
    "tet": "Tết Việt Nam",
    "tuong": "Nghệ Thuật Tuồng",
}

FILTER_METADATA = {
    "time_travel": {"modes": ["1980", "modern", "future"]},
    "landmark": {"opts": ["hoi_an", "hue", "ho_guom", "ha_long"]},
    "costume": {"opts": ["non_la", "khan_dong", "khan_ran"]},
    "tet": {"tetLocations": ["home", "street", "flower_market"]},
}

PROCESSORS = {
    "dong_ho": apply_dong_ho,
    "time_travel": apply_time_travel,
    "landmark": apply_landmark,
    "costume": apply_costume,
    "tet": apply_tet,
    "tuong": apply_tuong,
}

def process_image(data: bytes, filter_type: str, metadata: dict | None = None):
    if filter_type not in PROCESSORS:
        raise ValueError("filter_type khong hop le.")
    image = bytes_to_bgr(data)
    result = PROCESSORS[filter_type](image, metadata=metadata)
    return png_bytes(result)
