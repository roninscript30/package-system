from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.auth_routes import router as auth_router

app = FastAPI(
    title="Medical File Upload API",
    description="Resilient multipart upload system for large medical files",
    version="1.0.0",
)

# CORS — allow the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "medical-upload-api"}
