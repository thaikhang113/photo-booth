# DOCX Requirements Audit

Audit date: 2026-07-07

Scope: compare current working tree with `C:\Users\qqspe\Downloads\2302700142_2302700102_2302700129.docx` after narrowing the demo to three public filters.

Status legend: `PASS` = code path and runtime proof exist; `PARTIAL` = works but with limitation; `UNVERIFIED` = cannot prove in current browser/device state.

## Overall Result

| Area | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Web app runs locally | PASS | `npm run build`; browser smoke on `http://127.0.0.1:5173/`. | CORS config targets `5173`. |
| Backend API runs | PASS | `GET /api/health` returns `200`; `GET /api/filters` returns 3 filters. | FastAPI local/prod path unchanged. |
| Public cultural filters | PASS | `backend/app/services/filter_service.py`, `frontend/src/App.jsx`, `frontend/src/components/FilterPanel.jsx`. | Only `dong_ho`, `landmark`, `tet` remain public. |
| Removed filters rejected | PASS | `backend/app/checks/regression_check.py`; API smoke expects `400` for `time_travel`, `costume`, `tuong`. | Removed from backend registry, frontend fallback, and UI. |
| Filter options metadata | PASS | Landmark keeps `hoi_an`, `hue`, `ho_guom`, `ha_long`; Tet keeps `home`, `street`, `flower_market`. | Time Travel and Costume options removed. |
| Webcam preview/capture/download | PARTIAL | `frontend/src/components/CameraBooth.jsx`, `frontend/src/components/ResultPreview.jsx`. | Code path exists; live camera depends on browser permission/device. |
| Mirror camera | PASS | Capture canvas flips horizontally with `ctx.scale(-1, 1)`. | Behavior kept. |
| Face detection and landmarks | PARTIAL | Browser MediaPipe face landmark setup remains in `CameraBooth`. | Real webcam accuracy still requires live camera access. |
| Hand gesture recognition | PARTIAL | Browser MediaPipe gesture setup remains; `gesture-next` cycles the remaining filters and changes Tet location while Tet selected. | Real gesture accuracy still requires live camera access. |
| Segmentation | PASS | `subject_mask` feeds Landmark, Tet, and Dong Ho subject/background separation. | MediaPipe Selfie Segmentation with fallbacks. |
| Canny edge / quantization / morphology | PASS | Dong Ho filter uses fixed palette, Canny edges, morphology, paper background, border/caption. | Quality check covers the kept Dong Ho path. |
| Alpha blending | PASS | Dong Ho, Landmark, and Tet blend subject/background layers. | Removed Tuong overlay no longer part of scope. |
| Địa Danh background replacement | PASS | Landmark quality check verifies background replacement and subject preservation. | Four landmark options remain. |
| Tết background replacement | PASS | Tet quality check verifies background replacement and subject preservation. | Three Tet locations remain. |
| Live preview processing | PARTIAL | Frontend still sends request/response preview frames. | Not true GPU/high-FPS rendering. |
| 4/6 photobooth flow | PASS, extra | Booth self-checks cover manual slot/session flow. | Extra beyond DOCX, kept. |

## Verification Commands

| Check | Result |
| --- | --- |
| `backend\venv\Scripts\python.exe -m app.self_check` | PASS expected |
| `backend\venv\Scripts\python.exe -m app.checks.regression_check` | PASS expected |
| `backend\venv\Scripts\python.exe -m app.checks.quality_check` | PASS expected |
| `cd frontend; npm test` | PASS expected |
| `cd frontend; npm run build` | PASS expected |
| API smoke | Must confirm 3 kept filters return `200 image/png`; removed filters return `400`. |
| Browser smoke | Must confirm UI shows only Tranh Đông Hồ, Địa Danh Việt Nam, Tết Việt Nam. |

## Remaining Gaps

| Gap | Status | Why |
| --- | --- | --- |
| Real webcam capture | UNVERIFIED | Browser/device permission required. |
| Real face/hand accuracy | UNVERIFIED | Requires live camera frames. |
| Production verification | UNVERIFIED in this file until deploy run finishes | Needs fresh CI/CD deploy and live smoke. |

## Conclusion

Project public scope now keeps three filters only: Tranh Đông Hồ, Địa Danh Việt Nam, Tết Việt Nam. Time Travel, Costume, and Tuồng are intentionally removed from public API/UI/tests/docs.
