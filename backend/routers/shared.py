"""
Shared models, utilities and database connection for Little Eat Italy
"""
import os
import uuid
import jwt
import bcrypt
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'little-eat-italy-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Default admin credentials
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "LittleEatItaly2024!"

# ============ AUTH MODELS ============

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminRegister(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# ============ AUTH FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(username: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": username,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify admin token"""
    return await verify_token(credentials)

async def get_or_create_admin():
    admin = await db.admins.find_one({"username": DEFAULT_ADMIN_USERNAME})
    if not admin:
        admin = {
            "username": DEFAULT_ADMIN_USERNAME,
            "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin)

# ============ STAFF AUTH ============

class StaffPinLogin(BaseModel):
    pin: str

class StaffTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 43200

async def verify_staff_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify staff token and return role"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role")
        if role not in ["staff", "admin"]:
            raise HTTPException(status_code=401, detail="Invalid token")
        return role
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ CUSTOMER AUTH ============

class CustomerRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

def create_customer_token(customer_id: str, email: str) -> str:
    """Create JWT token for customer"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=72)
    payload = {
        "sub": customer_id,
        "email": email,
        "type": "customer",
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_customer_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify customer JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "customer":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"id": payload.get("sub"), "email": payload.get("email")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ COMMON MODELS ============

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str = ""
    name: str
    phone: str
    total_orders: int = 0
    total_reservations: int = 0
    total_spent: float = 0.0
    last_order_date: Optional[datetime] = None
    last_reservation_date: Optional[datetime] = None
    loyalty_points: int = 0
    lifetime_points: int = 0
    points_history: List[Dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class CustomerInfo(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: str
    is_new: bool = True
    total_orders: int = 0
    total_reservations: int = 0
    total_spent: float = 0.0
    last_order_date: Optional[str] = None
    last_reservation_date: Optional[str] = None
    has_account: bool = False
    loyalty_points: int = 0

# ============ LOYALTY MODELS ============

class LoyaltyReward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    points_required: int
    category: str = "general"
    is_active: bool = True
    sort_order: int = 0

class LoyaltySettings(BaseModel):
    enabled: bool = True
    points_per_euro: float = 1.0
    min_purchase_for_points: float = 0.0
    points_expiry_months: int = 12
    welcome_bonus_points: int = 0
    rewards: List[LoyaltyReward] = []

class PointsTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    amount: int
    type: str
    description: str
    order_id: Optional[str] = None
    staff_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class AddPointsRequest(BaseModel):
    customer_id: str
    purchase_amount: float
    description: str = "Vor-Ort-Verzehr"
