import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from botocore.exceptions import ClientError, BotoCoreError
from app.schemas import (
    StartUploadRequest, StartUploadResponse,
    PresignedUrlRequest, PresignedUrlResponse,
    CompleteUploadRequest, CompleteUploadResponse,
    AbortUploadRequest, AbortUploadResponse,
    FileUrlRequest, FileUrlResponse,
    UpdatePartRequest, UpdatePartResponse,
    ResumeSessionResponse, UploadPart
)
from app.s3_client import (
    initiate_multipart_upload,
    generate_presigned_url,
    complete_multipart_upload,
    abort_multipart_upload,
    generate_presigned_get_url,
)
from app.auth import get_current_user
from app.database import upload_sessions_collection, uploads_collection
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

def _handle_s3_error(action: str, e: Exception):
    logger.error(f"{action} failed: {e}")
    if isinstance(e, ClientError):
        code = e.response["Error"]["Code"]
        msg = e.response["Error"]["Message"]
        status = 400 if code in ("NoSuchUpload", "NoSuchKey", "InvalidPart") else 502
        raise HTTPException(status_code=status, detail=f"S3 {code}: {msg}")
    if isinstance(e, BotoCoreError):
        raise HTTPException(status_code=502, detail=f"AWS error: {str(e)}")
    raise HTTPException(status_code=500, detail=f"{action} failed: {str(e)}")


@router.post("/start-upload", response_model=StartUploadResponse)
async def start_upload(payload: StartUploadRequest, username: str = Depends(get_current_user)):
    try:
        result = initiate_multipart_upload(payload.file_name, payload.content_type)
        
        upload_sessions_collection.insert_one({
            "user_id": username,
            "filename": payload.file_name,
            "upload_id": result["upload_id"],
            "file_key": result["file_key"],
            "parts_uploaded": [],
            "status": "in_progress",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return result
    except Exception as e:
        _handle_s3_error("Start upload", e)


@router.get("/resume-session", response_model=ResumeSessionResponse)
async def resume_session(filename: str, username: str = Depends(get_current_user)):
    session = upload_sessions_collection.find_one({
        "user_id": username,
        "filename": filename,
        "status": "in_progress"
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
        
    return {
        "upload_id": session["upload_id"],
        "file_key": session["file_key"],
        "parts_uploaded": session["parts_uploaded"]
    }


@router.post("/update-part", response_model=UpdatePartResponse)
async def update_part(payload: UpdatePartRequest, username: str = Depends(get_current_user)):
    session = upload_sessions_collection.find_one({
        "upload_id": payload.upload_id,
        "user_id": username,
        "status": "in_progress"
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    part_data = {"PartNumber": payload.part_number, "ETag": payload.etag}
    
    # Avoid duplicate parts
    parts = session.get("parts_uploaded", [])
    if not any(p["PartNumber"] == payload.part_number for p in parts):
        upload_sessions_collection.update_one(
            {"upload_id": payload.upload_id},
            {"$push": {"parts_uploaded": part_data}}
        )
        
    return {"message": "Part updated"}


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_url(payload: PresignedUrlRequest, username: str = Depends(get_current_user)):
    try:
        url = generate_presigned_url(payload.file_key, payload.upload_id, payload.part_number)
        return {"url": url, "part_number": payload.part_number}
    except Exception as e:
        _handle_s3_error("Presigned URL", e)


@router.post("/complete-upload", response_model=CompleteUploadResponse)
async def complete_upload(payload: CompleteUploadRequest, username: str = Depends(get_current_user)):
    try:
        parts = [p.model_dump() for p in payload.parts]
        result = complete_multipart_upload(payload.file_key, payload.upload_id, parts)
        
        upload_sessions_collection.update_one(
            {"upload_id": payload.upload_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Save record in MongoDB for upload history
        uploads_collection.insert_one({
            "user_id": username,
            "filename": getattr(payload, "file_name", "unknown"),
            "size": getattr(payload, "size", 0),
            "bucket": get_settings().S3_BUCKET_NAME,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return result
    except Exception as e:
        _handle_s3_error("Complete upload", e)

@router.get("/uploads")
async def get_upload_history(username: str = Depends(get_current_user)):
    records = list(uploads_collection.find({"user_id": username}).sort("created_at", -1))
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records


@router.post("/get-file-url", response_model=FileUrlResponse)
async def get_file_url(payload: FileUrlRequest, username: str = Depends(get_current_user)):
    try:
        url = generate_presigned_get_url(payload.file_key)
        return {"url": url, "file_key": payload.file_key}
    except Exception as e:
        _handle_s3_error("Get file URL", e)
