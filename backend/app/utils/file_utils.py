from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
RESULTS_DIR = BASE_DIR / "results"


def ensure_results_dir() -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    return RESULTS_DIR


def timestamped_result_path(filter_type: str) -> Path:
    safe_filter = "".join(ch for ch in filter_type if ch.isalnum() or ch in ("-", "_"))
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return ensure_results_dir() / f"{stamp}_{safe_filter or 'filter'}.png"

