# He thong Photo Booth Van hoa Viet Nam ung dung xu ly anh

Web MVP cho phep mo webcam, chup anh, chon bo loc van hoa Viet Nam, gui anh sang backend Python FastAPI xu ly bang OpenCV/NumPy/Pillow, hien thi ket qua va tai anh ve may.

## Cong nghe

- Frontend: React + Vite
- Backend: Python FastAPI
- Xu ly anh: OpenCV, NumPy, Pillow
- Optional: MediaPipe Selfie Segmentation neu cai rieng duoc
- Khong dung database trong MVP

## Cau truc thu muc

```text
photo-booth-vietnam/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/image_routes.py
│   │   ├── services/
│   │   ├── utils/
│   │   └── assets/
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── README.md
└── .gitignore
```

## Chay backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Kiem tra nhanh:

```powershell
python -m app.self_check
```

## Chay frontend

```powershell
cd frontend
npm install
npm run dev
```

Mo `http://localhost:5173`. Backend mac dinh: `http://localhost:8000`.

## API

- `GET /api/health`: health check.
- `GET /api/filters`: danh sach bo loc.
- `POST /api/process-image`: nhan `multipart/form-data` gom `image` va `filter_type`, tra ve anh PNG trong response, khong luu file tren server.
- `POST /api/save-result`: placeholder, khong luu anh tren server.

`filter_type` hop le:

- `dong_ho`
- `time_travel`
- `landmark`
- `costume`
- `tet`
- `tuong`

## Huong dan them assets

Them file vao cac folder sau, backend se tu dung neu tim thay:

- `backend/app/assets/backgrounds/`: `hoi_an.jpg`, `hue.jpg`, `ho_guom.jpg`, `ha_long.jpg`
- `backend/app/assets/costumes/`: `non_la.png`, `khan_dong.png` nen co nen trong suot
- `backend/app/assets/tet/`: hoa mai, hoa dao, den long PNG neu muon nang cap frame
- `backend/app/assets/tuong/`: mat na/texture Tuong PNG neu muon nang cap

Neu thieu assets, code tu ve placeholder bang OpenCV de app van chay. Neu khong cai MediaPipe, backend dung OpenCV GrabCut de tach chu the nguoi; khi GrabCut khong nhan duoc chu the moi quay ve mask trung tam.

## Nhung phan da lam

- UI React co header, camera preview ben trai, panel filter ben phai, ket qua ben duoi.
- Start Camera, Capture, Apply Filter, Download Result, Reset.
- Capture frame bang canvas.
- Gui anh + `filter_type` sang FastAPI bang multipart/form-data.
- Backend xu ly va tra blob/image, khong luu ket qua tren server.
- Error state cho backend chua chay, webcam bi tu choi quyen, chua chup anh.
- 6 bo loc MVP:
  - Tranh Dong Ho: bilateral filter, k-means quantization, Canny edge blend.
  - Du Hanh Thoi Gian: sepia, noise, vignette, histogram equalization.
- Dia Danh Viet Nam: MediaPipe optional, fallback OpenCV GrabCut + gradient/pattern background.
  - Trang Phuc Truyen Thong: Haar Cascade face detect, overlay PNG neu co, fallback ve non la.
  - Tet Viet Nam: frame do/vang, hoa, den long, chu chuc Tet.
  - Nghe Thuat Tuong: face detect, ve pattern mat, tang saturation/contrast.

## Nang cap sau

- Realtime websocket.
- Hand gesture recognition.
- Face landmark chinh xac hon.
- Segmentation bang MediaPipe cai rieng.
- Quan ly gallery bang database.

## MediaPipe optional

Khong dat `mediapipe` trong `requirements.txt` de tranh loi cai tren Windows. Neu muon thu segmentation:

```powershell
pip install mediapipe
```

Neu cai loi, bo qua. Filter `landmark` van co fallback OpenCV.

## DOCX Completion Notes

The app now includes browser-side MediaPipe face landmarks and gesture recognition, gesture control, metadata-backed filter options, lightweight live preview, and a regression checklist at `docs/docx-requirements-checklist.md`. Processed photos remain in memory and are not persisted on the server.
