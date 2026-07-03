# Backend FastAPI

## Chay local Windows

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API

- `GET /api/health`
- `GET /api/filters`
- `POST /api/process-image`
- `POST /api/save-result`

Anh ket qua duoc tra ve trong response, khong luu file tren server.

## Assets

- `app/assets/backgrounds`: `hoi_an.jpg`, `hue.jpg`, `ho_guom.jpg`, `ha_long.jpg`
- `app/assets/costumes`: `non_la.png`, `khan_dong.png`
- `app/assets/tet`: PNG trang tri Tet
- `app/assets/tuong`: PNG/texture Tuong
