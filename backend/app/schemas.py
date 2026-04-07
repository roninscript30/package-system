from pydantic import BaseModel
from typing import List, Optional

# ── Start Upload ──────────────────────────────────────────────
class StartUploadRequest(BaseModel):
    file_name: str
    content_type: str = "application/octet-stream"
    size: int = 0

class StartUploadResponse(BaseModel):
    upload_id: str
    file_key: str

# ── Pre-signed URL ────────────────────────────────────────────
class PresignedUrlRequest(BaseModel):
    file_key: str
    upload_id: str
    part_number: int

class PresignedUrlResponse(BaseModel):
    url: str
    part_number: int

# ── Session Management ─────────────────────────────────────────
class UpdatePartRequest(BaseModel):
    file_key: str
    upload_id: str
    part_number: int
    etag: str

class UpdatePartResponse(BaseModel):
    message: str

class UploadPart(BaseModel):
    ETag: str
    PartNumber: int

class ResumeSessionResponse(BaseModel):
    upload_id: str
    file_key: str
    parts_uploaded: List[UploadPart]

# ── Complete Upload ───────────────────────────────────────────
class CompleteUploadRequest(BaseModel):
    file_key: str
    upload_id: str
    file_name: str
    size: int
    parts: List[UploadPart]

class CompleteUploadResponse(BaseModel):
    message: str
    location: str

# ── Abort Upload ──────────────────────────────────────────────
class AbortUploadRequest(BaseModel):
    file_key: str
    upload_id: str

class AbortUploadResponse(BaseModel):
    message: str

# ── File Preview URL ──────────────────────────────────────────
class FileUrlRequest(BaseModel):
    file_key: str

class FileUrlResponse(BaseModel):
    url: str
    file_key: str
