from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
import json

from app.services.filter_service import FILTERS, process_image

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/filters")
def filters():
    return {"filters": [{"type": key, "name": value} for key, value in FILTERS.items()]}

@router.post("/process-image")
async def process_uploaded_image(
    image: UploadFile = File(...),
    filter_type: str = Form(...),
    metadata: str = Form("{}"),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File upload phai la anh.")

    data = await image.read()
    try:
        meta = json.loads(metadata)
    except json.JSONDecodeError:
        meta = {}
    try:
        result = process_image(data, filter_type, meta)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Xu ly anh that bai: {exc}") from exc

    return Response(result, media_type="image/png")

@router.post("/save-result")
def save_result_placeholder():
    return {"message": "Anh chi duoc xu ly tam thoi, khong luu tren server."}
