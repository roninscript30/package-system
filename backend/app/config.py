from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str = ""
    PRESIGNED_URL_EXPIRY: int = 3600  # 1 hour
    
    # MongoDB + Auth Config
    MONGO_URI: str = "mongodb://localhost:27017" # default local mongo
    JWT_SECRET_KEY: str = "supersecretkey" # REPLACE in production
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "allow"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
