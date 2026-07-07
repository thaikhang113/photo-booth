# Photo Booth Vietnam Culture

A web Photo Booth app that opens the webcam, captures a photo, lets users select Vietnamese cultural filters, sends the image to a FastAPI backend for OpenCV/MediaPipe/NumPy/Pillow processing, displays the result, and downloads it as a PNG.

## Features

- Webcam preview, capture, apply filter, live preview, reset, and download result.
- 6 filters: Dong Ho Painting, Time Travel, Vietnam Landmarks, Traditional Costumes, Vietnamese Tet, and Tuong Art.
- Person/background segmentation for Landmark and Tet filters using MediaPipe Selfie Segmentation, with OpenCV GrabCut fallback.
- Browser MediaPipe face landmarks for hat/scarf placement and Tuong face effects.
- Hand gesture recognition for filter navigation, apply, and reset.
- Processed photos are returned in memory and are not persisted on the server.

## Stack

- Frontend: React + Vite + MediaPipe Tasks Vision.
- Backend: Python FastAPI + OpenCV + MediaPipe + NumPy + Pillow.
- Deployment: Vercel frontend, Azure App Service backend container, Azure Container Registry.
- CI/CD: GitHub Actions.

## Project Structure

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

## Run Instructions

See the separate guide: [docs/RUN_GUIDE.en.md](docs/RUN_GUIDE.en.md).

## Main API

- `GET /api/health`: backend health check.
- `GET /api/filters`: filter metadata and options.
- `POST /api/process-image`: accepts `multipart/form-data` with `image`, `filter_type`, and `metadata`; returns PNG bytes.
- `POST /api/save-result`: placeholder endpoint; does not persist photos.

## Verification

```powershell
cd backend
.\venv\Scripts\python.exe -m app.self_check
.\venv\Scripts\python.exe -m app.checks.regression_check
.\venv\Scripts\python.exe -m app.checks.quality_check
cd ..\frontend
npm run build
```

## DOCX Status

See [docs/docx-requirements-checklist.md](docs/docx-requirements-checklist.md).

