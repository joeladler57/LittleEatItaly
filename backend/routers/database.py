"""
Database connection and shared utilities
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "little_eat_italy")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "little-eat-italy-secret-key-2024")
JWT_ALGORITHM = "HS256"
