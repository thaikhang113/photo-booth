# Local Run And Deployment Guide

## Requirements

- Windows PowerShell.
- Python 3.11.
- Node.js 22 or a version compatible with the current Vite setup.
- Webcam for real camera testing.

## Run Backend Locally

```powershell
cd D:\Dev\photo-booth-vietnam\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check backend:

```powershell
curl.exe http://127.0.0.1:8000/api/health
```

Expected result:

```json
{"status":"ok"}
```

## Run Frontend Locally

Open another PowerShell terminal:

```powershell
cd D:\Dev\photo-booth-vietnam\frontend
npm install
$env:VITE_API_BASE="http://127.0.0.1:8000"
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Local Tests

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

## Browser Smoke Test

1. Open `http://127.0.0.1:5173`.
2. Click `Start Camera` and allow camera permission.
3. Click `Capture`.
4. Select each filter.
5. Click `Apply Filter`.
6. Check the output image.
7. Click `Download Result`.

## Current Production

- Frontend: https://photo-booth-vietnam.vercel.app
- Backend: https://photo-booth-vn-f387ea3a.azurewebsites.net

Production checks:

```powershell
curl.exe https://photo-booth-vn-f387ea3a.azurewebsites.net/api/health
curl.exe -I https://photo-booth-vietnam.vercel.app
```

## CI/CD

Workflow: `.github/workflows/ci-cd.yml`.

On push to `master` or `main`:

- Run backend checks.
- Build frontend.
- Build and push backend container to Azure Container Registry.
- Deploy frontend to Vercel.

Azure backend container image:

```text
photoboothvnf387ea3a.azurecr.io/photo-booth-backend:latest
```

Azure App Service container continuous deployment is enabled so the app pulls the new image after ACR receives it.

