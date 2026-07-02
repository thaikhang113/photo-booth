from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.image_routes import router as image_router

app = FastAPI(title="Photo Booth Van Hoa Viet Nam", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router, prefix="/api")


@app.get("/")
def root():
    return {"name": "Photo Booth Van Hoa Viet Nam", "docs": "/docs"}

