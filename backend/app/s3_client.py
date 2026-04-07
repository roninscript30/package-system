import boto3
import uuid
from datetime import datetime, timezone
from typing import List, Dict
from functools import lru_cache
from botocore.config import Config
from app.config import get_settings


@lru_cache()
def _get_s3_client():
    """Create and cache a boto3 S3 client with explicit regional endpoints."""
    settings = get_settings()
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'virtual'}
        )
    )


def initiate_multipart_upload(file_name: str, content_type: str) -> dict:
    """Start a multipart upload → returns upload_id + file_key."""
    settings = get_settings()
    s3 = _get_s3_client()

    date_prefix = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    unique_id = uuid.uuid4().hex[:12]
    file_key = f"medical-uploads/{date_prefix}/{unique_id}_{file_name}"

    response = s3.create_multipart_upload(
        Bucket=settings.S3_BUCKET_NAME,
        Key=file_key,
        ContentType=content_type,
    )

    return {"upload_id": response["UploadId"], "file_key": file_key}


def generate_presigned_url(file_key: str, upload_id: str, part_number: int) -> str:
    """Generate a pre-signed PUT URL for one chunk."""
    settings = get_settings()
    s3 = _get_s3_client()

    return s3.generate_presigned_url(
        ClientMethod="upload_part",
        Params={
            "Bucket": settings.S3_BUCKET_NAME,
            "Key": file_key,
            "UploadId": upload_id,
            "PartNumber": part_number,
        },
        ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
    )


def complete_multipart_upload(
    file_key: str, upload_id: str, parts: List[Dict]
) -> dict:
    """Finalize the upload by sending sorted ETags to S3."""
    settings = get_settings()
    s3 = _get_s3_client()

    sorted_parts = sorted(parts, key=lambda p: p["PartNumber"])

    response = s3.complete_multipart_upload(
        Bucket=settings.S3_BUCKET_NAME,
        Key=file_key,
        UploadId=upload_id,
        MultipartUpload={"Parts": sorted_parts},
    )

    return {
        "message": "Upload completed successfully",
        "location": response.get("Location", ""),
    }


def abort_multipart_upload(file_key: str, upload_id: str) -> dict:
    """Abort an in-progress upload and clean up S3 parts."""
    settings = get_settings()
    s3 = _get_s3_client()

    s3.abort_multipart_upload(
        Bucket=settings.S3_BUCKET_NAME,
        Key=file_key,
        UploadId=upload_id,
    )

    return {"message": "Upload aborted successfully"}


def generate_presigned_get_url(file_key: str) -> str:
    """Generate a pre-signed GET URL so the browser can fetch the file directly."""
    settings = get_settings()
    s3 = _get_s3_client()

    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.S3_BUCKET_NAME,
            "Key": file_key,
        },
        ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
    )
