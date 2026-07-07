# Photo Booth Văn Hóa Việt Nam

Ứng dụng web Photo Booth cho phép mở webcam, chụp ảnh, chọn bộ lọc văn hóa Việt Nam, gửi ảnh sang backend FastAPI để xử lý bằng OpenCV/MediaPipe/NumPy/Pillow, hiển thị kết quả và tải ảnh PNG về máy.

## Tính năng

- Webcam preview, capture, apply filter, live preview, reset, download result.
- 3 bộ lọc: Tranh Đông Hồ, Địa Danh Việt Nam, Tết Việt Nam.
- Tách người/nền cho Địa Danh và Tết bằng MediaPipe Selfie Segmentation, fallback OpenCV GrabCut.
- Tranh Đông Hồ dùng giấy điệp, màu dân gian, nét khắc gỗ, viền/caption.
- Nhận diện mặt/face landmarks từ browser MediaPipe để hỗ trợ mask người/nền và metadata xử lý ảnh.
- Nhận diện cử chỉ tay để đổi filter, apply, reset.
- Backend không lưu ảnh đã xử lý trên server.

## Công nghệ

- Frontend: React + Vite + MediaPipe Tasks Vision.
- Backend: Python FastAPI + OpenCV + MediaPipe + NumPy + Pillow.
- Deploy: frontend trên Vercel, backend container trên Azure App Service + Azure Container Registry.
- CI/CD: GitHub Actions.

## Cấu trúc

```text
photo-booth-vietnam/
  backend/
    app/
      assets/
      checks/
      routes/
      services/
      utils/
    Dockerfile
    requirements.txt
  frontend/
    src/
    package.json
  docs/
    RUN_GUIDE.vi.md
    RUN_GUIDE.en.md
    docx-requirements-checklist.md
  README.md
  README.vi.md
  README.en.md
```

## Hướng dẫn chạy

Xem file riêng: [docs/RUN_GUIDE.vi.md](docs/RUN_GUIDE.vi.md).

## API chính

- `GET /api/health`: kiểm tra backend.
- `GET /api/filters`: lấy metadata bộ lọc và options.
- `POST /api/process-image`: nhận `multipart/form-data` gồm `image`, `filter_type`, `metadata`; trả PNG bytes.
- `POST /api/save-result`: placeholder, không lưu ảnh.

## Kiểm thử

```powershell
cd backend
.\venv\Scripts\python.exe -m app.self_check
.\venv\Scripts\python.exe -m app.checks.regression_check
.\venv\Scripts\python.exe -m app.checks.quality_check
cd ..\frontend
npm test
npm run build
```

## Trạng thái theo DOCX

Checklist nằm ở [docs/docx-requirements-checklist.md](docs/docx-requirements-checklist.md).
