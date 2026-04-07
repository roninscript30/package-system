from pymongo import MongoClient
from app.config import get_settings

settings = get_settings()

client = MongoClient(settings.MONGO_URI)
db = client["medivault"]
users_collection = db["users"]
upload_sessions_collection = db["upload_sessions"]
uploads_collection = db["uploads"]
