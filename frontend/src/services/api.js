const LOCAL_API_BASE = "http://localhost:8000";
const PRODUCTION_API_BASE = "https://photo-booth-vn-f387ea3a.azurewebsites.net";
const isLocalHost = ["localhost", "127.0.0.1"].includes(globalThis.location?.hostname);
const API_BASE = import.meta.env.VITE_API_BASE || (isLocalHost ? LOCAL_API_BASE : PRODUCTION_API_BASE);

export async function fetchFilters() {
  const res = await fetch(`${API_BASE}/api/filters`);
  if (!res.ok) throw new Error("Không tải được danh sách bộ lọc.");
  return res.json();
}

export async function processImage(imageBlob, filterType, metadata = {}) {
  const form = new FormData();
  form.append("image", imageBlob, "capture.png");
  form.append("filter_type", filterType);
  form.append("metadata", JSON.stringify(metadata));
  let res;
  try {
    res = await fetch(`${API_BASE}/api/process-image`, { method: "POST", body: form });
  } catch {
    throw new Error("Không kết nối được backend. Hãy chạy FastAPI tại cổng 8000.");
  }
  if (!res.ok) {
    let message = "Xử lý ảnh thất bại.";
    try { const body = await res.json(); message = body.detail || message; } catch {}
    throw new Error(message);
  }
  return res.blob();
}
