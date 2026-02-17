from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # classic, special, vegetarian, dessert
    image_url: Optional[str] = None
    is_featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    is_featured: bool = False

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    address: str = "123 Pizza Street, Little Italy, NY 10001"
    phone: str = "+1 (555) 123-4567"
    email: str = "ciao@littleeatitaly.com"
    hours: dict = Field(default_factory=lambda: {
        "monday": "11:00 AM - 10:00 PM",
        "tuesday": "11:00 AM - 10:00 PM",
        "wednesday": "11:00 AM - 10:00 PM",
        "thursday": "11:00 AM - 10:00 PM",
        "friday": "11:00 AM - 11:00 PM",
        "saturday": "12:00 PM - 11:00 PM",
        "sunday": "12:00 PM - 9:00 PM"
    })
    about_text: str = "Born in the streets of Naples, raised in the heart of the city. Little Eat Italy brings authentic Neapolitan pizza with an urban twist. We don't just make pizza - we create edible art."

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Little Eat Italy API", "status": "running"}

# Menu endpoints
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find({}, {"_id": 0}).to_list(100)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.get("/menu/featured", response_model=List[MenuItem])
async def get_featured_menu():
    items = await db.menu_items.find({"is_featured": True}, {"_id": 0}).to_list(10)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.get("/menu/category/{category}", response_model=List[MenuItem])
async def get_menu_by_category(category: str):
    items = await db.menu_items.find({"category": category}, {"_id": 0}).to_list(50)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(input: MenuItemCreate):
    item = MenuItem(**input.model_dump())
    doc = item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.menu_items.insert_one(doc)
    return item

# Contact endpoints
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(input: ContactMessageCreate):
    message = ContactMessage(**input.model_dump())
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    return message

@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages():
    messages = await db.contact_messages.find({}, {"_id": 0}).to_list(100)
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

# Settings endpoints
@api_router.get("/settings", response_model=SiteSettings)
async def get_settings():
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        default = SiteSettings()
        doc = default.model_dump()
        await db.settings.insert_one(doc)
        return default
    return SiteSettings(**settings)

# Seed data endpoint
@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing = await db.menu_items.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}
    
    # Seed menu items
    menu_items = [
        # Classic Pizzas
        {
            "id": str(uuid.uuid4()),
            "name": "MARGHERITA",
            "description": "San Marzano tomatoes, fresh mozzarella, basil, extra virgin olive oil",
            "price": 16.00,
            "category": "classic",
            "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=85&w=800&auto=format&fit=crop",
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "MARINARA",
            "description": "San Marzano tomatoes, garlic, oregano, extra virgin olive oil",
            "price": 14.00,
            "category": "classic",
            "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "QUATTRO FORMAGGI",
            "description": "Mozzarella, gorgonzola, parmesan, fontina cheese blend",
            "price": 19.00,
            "category": "classic",
            "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=800&auto=format&fit=crop",
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Special Pizzas
        {
            "id": str(uuid.uuid4()),
            "name": "DIAVOLA",
            "description": "Spicy salami, San Marzano tomatoes, mozzarella, chili oil",
            "price": 18.00,
            "category": "special",
            "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=85&w=800&auto=format&fit=crop",
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "CAPRICCIOSA",
            "description": "Ham, mushrooms, artichokes, olives, mozzarella, tomato sauce",
            "price": 20.00,
            "category": "special",
            "image_url": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "PROSCIUTTO E RUCOLA",
            "description": "Prosciutto di Parma, fresh arugula, shaved parmesan, mozzarella",
            "price": 22.00,
            "category": "special",
            "image_url": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Vegetarian
        {
            "id": str(uuid.uuid4()),
            "name": "ORTOLANA",
            "description": "Grilled zucchini, eggplant, peppers, cherry tomatoes, mozzarella",
            "price": 17.00,
            "category": "vegetarian",
            "image_url": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "FUNGHI PORCINI",
            "description": "Porcini mushrooms, truffle oil, mozzarella, parmesan",
            "price": 21.00,
            "category": "vegetarian",
            "image_url": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=85&w=800&auto=format&fit=crop",
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Desserts
        {
            "id": str(uuid.uuid4()),
            "name": "NUTELLA CALZONE",
            "description": "Warm folded pizza dough filled with Nutella and mascarpone",
            "price": 10.00,
            "category": "dessert",
            "image_url": "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "TIRAMISU",
            "description": "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone",
            "price": 9.00,
            "category": "dessert",
            "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=85&w=800&auto=format&fit=crop",
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.menu_items.insert_many(menu_items)
    
    # Seed settings
    settings = SiteSettings().model_dump()
    await db.settings.insert_one(settings)
    
    return {"message": "Data seeded successfully", "menu_items": len(menu_items)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
