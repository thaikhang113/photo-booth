# Hướng Dẫn Chạy Local Và Deploy

## Yêu cầu

- Windows PowerShell.
- Python 3.11.
- Node.js 22 hoặc bản tương thích với Vite hiện tại.
- Webcam nếu muốn test camera thật.

## Chạy backend local

```powershell
cd D:\Dev\photo-booth-vietnam\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Kiểm tra backend:

```powershell
curl.exe http://127.0.0.1:8000/api/health
```

Kết quả đúng:

```json
{"status":"ok"}
```

## Chạy frontend local

Mở terminal PowerShell khác:

```powershell
cd D:\Dev\photo-booth-vietnam\frontend
npm install
$env:VITE_API_BASE="http://127.0.0.1:8000"
npm run dev
```

Mở web:

```text
http://127.0.0.1:5173
```

## Test local

Backend:

```powershell
cd D:\Dev\photo-booth-vietnam\backend
.\venv\Scripts\python.exe -m app.self_check
.\venv\Scripts\python.exe -m app.checks.regression_check
.\venv\Scripts\python.exe -m app.checks.quality_check
```

Frontend:

```powershell
cd D:\Dev\photo-booth-vietnam\frontend
npm run build
```

## Test nhanh trên web

1. Mở `http://127.0.0.1:5173`.
2. Bấm `Start Camera` và cấp quyền camera.
3. Bấm `Capture`.
4. Chọn từng filter.
5. Bấm `Apply Filter`.
6. Kiểm tra ảnh kết quả.
7. Bấm `Download Result`.

## Production hiện tại

- Frontend: https://photo-booth-vietnam.vercel.app
- Backend: https://photo-booth-vn-f387ea3a.azurewebsites.net

Kiểm tra production:

```powershell
curl.exe https://photo-booth-vn-f387ea3a.azurewebsites.net/api/health
curl.exe -I https://photo-booth-vietnam.vercel.app
```

## CI/CD

Workflow: `.github/workflows/ci-cd.yml`.

Khi push lên `master` hoặc `main`:

- Chạy backend checks.
- Build frontend.
- Build và push backend container lên Azure Container Registry.
- Deploy frontend lên Vercel.

Backend Azure đang dùng container image:

```text
photoboothvnf387ea3a.azurecr.io/photo-booth-backend:latest
```

Azure App Service đã bật container continuous deployment để pull image mới sau khi ACR có bản mới.

