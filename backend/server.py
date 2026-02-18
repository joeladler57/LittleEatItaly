from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GlobalFood API Configuration
GLOBALFOOD_API_URL = "https://pos.globalfoodsoft.com/pos/menu"
GLOBALFOOD_API_KEY = os.environ.get('GLOBALFOOD_API_KEY', 'pQ5d8UmzbClR90Y1DR')

# Resend Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Web Push Configuration
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY_FILE = os.environ.get('VAPID_PRIVATE_KEY_FILE', 'vapid_private.pem')
VAPID_CLAIMS_EMAIL = os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@little-eat-italy.de')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'little-eat-italy-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Default admin credentials (change password on first login!)
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "LittleEatItaly2024!"  # Change this!

# ============ AUTH MODELS ============

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCredentials(BaseModel):
    id: str = "admin_credentials"
    username: str
    password_hash: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = JWT_EXPIRATION_HOURS * 3600

# ============ AUTH FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

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

async def get_or_create_admin():
    admin = await db.admin_credentials.find_one({"id": "admin_credentials"}, {"_id": 0})
    if not admin:
        # Create default admin
        admin = {
            "id": "admin_credentials",
            "username": DEFAULT_ADMIN_USERNAME,
            "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD)
        }
        await db.admin_credentials.insert_one(admin)
    return admin

# ============ MODELS ============

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
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
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str

# ============ SHOP MENU MODELS ============

class ShopMenuOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float = 0.0

class ShopMenuOptionGroup(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    required: bool = False
    multiple: bool = False
    options: List[ShopMenuOption] = []

class ShopMenuSize(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    default: bool = False

class ShopMenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    tags: List[str] = []  # VEGETARIAN, VEGAN, HOT, GLUTEN_FREE
    sizes: List[ShopMenuSize] = []
    groups: List[ShopMenuOptionGroup] = []
    available: bool = True
    sort_order: int = 0

class ShopMenuCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    items: List[ShopMenuItem] = []
    addon_group_ids: List[str] = []  # IDs of global addon groups assigned to this category
    sort_order: int = 0
    available: bool = True

class ShopMenu(BaseModel):
    id: str = "shop_menu"
    categories: List[ShopMenuCategory] = []
    addon_groups: List[ShopMenuOptionGroup] = []  # Global addon groups
    currency: str = "EUR"

# ============ ORDER MODELS ============

class OrderItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    size: Optional[str] = None
    size_name: Optional[str] = None
    options: List[Dict[str, str]] = []  # [{group_name, option_name, price}]
    unit_price: float
    total_price: float
    notes: str = ""

class OrderCreate(BaseModel):
    items: List[OrderItem]
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    pickup_time: str  # ISO format or "ASAP"
    payment_method: str = "Barzahlung"  # Barzahlung or Kartenzahlung
    notes: str = ""

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: int = 0
    items: List[OrderItem]
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    pickup_time: str
    payment_method: str = "Barzahlung"
    notes: str = ""
    subtotal: float = 0.0
    total: float = 0.0
    status: str = "pending"  # pending, confirmed, preparing, ready, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ RESERVATION MODELS ============

class ReservationCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    guests: int
    notes: str = ""

class Reservation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reservation_number: int = 0
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    date: str
    time: str
    guests: int
    notes: str = ""
    status: str = "pending"  # pending, confirmed, cancelled, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ SHOP SETTINGS MODEL ============

class ShopSettings(BaseModel):
    id: str = "shop_settings"
    pickup_enabled: bool = True
    reservation_enabled: bool = True
    min_pickup_time_minutes: int = 30  # Minimum lead time
    max_pickup_days_ahead: int = 7
    max_reservation_days_ahead: int = 30
    opening_hours: Dict[str, Dict[str, str]] = {
        "monday": {"open": "12:00", "close": "22:00"},
        "tuesday": {"open": "12:00", "close": "22:00"},
        "wednesday": {"open": "12:00", "close": "22:00"},
        "thursday": {"open": "12:00", "close": "22:00"},
        "friday": {"open": "12:00", "close": "00:00"},
        "saturday": {"open": "12:00", "close": "00:00"},
        "sunday": {"open": "16:00", "close": "22:00"},
    }
    closed_days: List[str] = []  # List of dates YYYY-MM-DD
    restaurant_name: str = "Little Eat Italy"
    restaurant_address: str = "Europastrasse 8, 57072 Siegen"
    restaurant_phone: str = "0271 31924461"
    restaurant_email: str = "bestellung@little-eat-italy.de"
    staff_pin: str = "1234"  # 4-digit PIN for staff login

# ============ STAFF AUTH MODELS ============

class StaffPinLogin(BaseModel):
    pin: str

class StaffTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 43200  # 12 hours

# ============ CMS CONTENT MODELS ============

class ActionButton(BaseModel):
    id: str
    label: str
    url: str
    is_active: bool = True
    icon: Optional[str] = None

class HeroContent(BaseModel):
    background_image: str = "https://images.unsplash.com/photo-1601913463731-cfba9fd31ed3?q=85&w=1920&auto=format&fit=crop"
    subtitle: str = "Authentische neapolitanische Pizza mit urbaner Seele. Holzofenperfektion aus den Straßen von Neapel."
    buttons: List[ActionButton] = []

class FeatureItem(BaseModel):
    icon: str
    title: str
    description: str

class FeaturesContent(BaseModel):
    items: List[FeatureItem] = []

class MenuPageContent(BaseModel):
    title: str = "UNSERE"
    title_highlight: str = "SPEISEKARTE"
    subtitle: str = "Von klassischen neapolitanischen Traditionen bis zu unseren einzigartigen urbanen Kreationen"
    bottom_title: str = "KANNST DICH NICHT ENTSCHEIDEN?"
    bottom_text: str = "Unsere Favoriten sind die Margherita für Puristen, Diavola für Schärfe-Fans und Funghi Porcini für Abenteurer."

class AboutPageContent(BaseModel):
    hero_title: str = "UNSERE"
    hero_title_highlight: str = "GESCHICHTE"
    hero_subtitle: str = "Von Neapel mit Liebe, auf die Straßen mit Leidenschaft"
    story_title: str = "GEBOREN IN"
    story_title_highlight: str = "NEAPEL"
    story_paragraphs: List[str] = []
    stats: List[Dict[str, str]] = []
    philosophy_title: str = "UNSERE"
    philosophy_title_highlight: str = "PHILOSOPHIE"
    philosophy_items: List[Dict[str, str]] = []
    quote_text: str = "PIZZA IST NICHT NUR ESSEN. ES IST EINE"
    quote_highlight: str = "SPRACHE"
    quote_author: str = "— MARCO ROSSI, GRÜNDER"

class ContactPageContent(BaseModel):
    hero_title: str = "KONTAKTIERE"
    hero_title_highlight: str = "UNS"
    hero_subtitle: str = "Fragen, Feedback oder einfach nur Ciao sagen? Wir hören zu."
    address_title: str = "ADRESSE"
    address_line1: str = "Pizzastraße 123"
    address_line2: str = "Little Italy, 10001"
    phone_title: str = "TELEFON"
    phone: str = "+49 (0) 123 456789"
    email_title: str = "E-MAIL"
    email: str = "ciao@littleeatitaly.de"
    hours_title: str = "ÖFFNUNGSZEITEN"
    hours: List[Dict[str, str]] = []
    form_title: str = "SCHREIBE EINE"
    form_title_highlight: str = "NACHRICHT"
    form_name_label: str = "DEIN NAME"
    form_name_placeholder: str = "Gib deinen Namen ein"
    form_email_label: str = "DEINE E-MAIL"
    form_email_placeholder: str = "Gib deine E-Mail ein"
    form_phone_label: str = "DEINE TELEFONNUMMER"
    form_phone_placeholder: str = "Gib deine Telefonnummer ein"
    form_phone_enabled: bool = True
    form_subject_label: str = "BETREFF"
    form_subject_placeholder: str = "Worum geht es?"
    form_subject_enabled: bool = True
    form_message_label: str = "DEINE NACHRICHT"
    form_message_placeholder: str = "Was liegt dir auf dem Herzen?"
    form_submit_text: str = "NACHRICHT SENDEN"
    form_success_message: str = "Nachricht gesendet! Wir melden uns bald bei dir."
    form_note: str = "Wir antworten normalerweise innerhalb von 24 Stunden. Für dringende Angelegenheiten ruf uns an oder komm einfach vorbei – die Pizza ist immer heiß!"

class ImpressumContent(BaseModel):
    title: str = "IMPRESSUM"
    content: str = """**Angaben gemäß § 5 TMG:**

Little Eat Italy GmbH
Pizzastraße 123
10001 Little Italy
Deutschland

**Vertreten durch:**
Marco Rossi (Geschäftsführer)

**Kontakt:**
Telefon: +49 (0) 123 456789
E-Mail: ciao@littleeatitaly.de

**Registereintrag:**
Eingetragen im Handelsregister.
Registergericht: Amtsgericht Musterstadt
Registernummer: HRB 12345

**Umsatzsteuer-ID:**
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
DE 123456789

**Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:**
Marco Rossi
Pizzastraße 123
10001 Little Italy

**Streitschlichtung:**
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/
Unsere E-Mail-Adresse finden Sie oben im Impressum.

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

**Haftung für Inhalte:**
Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

**Haftung für Links:**
Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

**Urheberrecht:**
Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."""

class SocialLink(BaseModel):
    id: str
    platform: str
    url: str
    is_active: bool = True

class InstagramFeed(BaseModel):
    enabled: bool = True
    username: str = ""
    posts: List[Dict[str, str]] = []  # Manual posts: {image_url, caption, link}

class FooterContent(BaseModel):
    marquee_text: str = "AUTHENTISCH NEAPOLITANISCH • STREET VIBES • LITTLE EAT ITALY • HOLZOFEN • HANDGEMACHTER TEIG • "
    brand_description: str = "Geboren auf den Straßen von Neapel, aufgewachsen im Herzen der Stadt. Authentische neapolitanische Pizza mit urbanem Twist."
    nav_title: str = "NAVIGATION"
    contact_title: str = "HIER FINDEST DU UNS"
    address: str = "Pizzastraße 123, Little Italy, 10001"
    phone: str = "+49 (0) 123 456789"
    email: str = "ciao@littleeatitaly.de"
    copyright: str = "© 2024 Little Eat Italy. Alle Rechte vorbehalten."
    made_with: str = "Mit ♥ gemacht"
    social_links: List[SocialLink] = [
        SocialLink(id="instagram", platform="instagram", url="https://instagram.com/littleeatitaly", is_active=True),
        SocialLink(id="facebook", platform="facebook", url="https://facebook.com/littleeatitaly", is_active=True),
        SocialLink(id="tiktok", platform="tiktok", url="", is_active=False),
    ]
    instagram_feed: InstagramFeed = Field(default_factory=InstagramFeed)

class NavContent(BaseModel):
    links: List[Dict[str, str]] = []

class SiteContent(BaseModel):
    id: str = "site_content"
    hero: HeroContent = Field(default_factory=HeroContent)
    features: FeaturesContent = Field(default_factory=FeaturesContent)
    about_page: AboutPageContent = Field(default_factory=AboutPageContent)
    contact_page: ContactPageContent = Field(default_factory=ContactPageContent)
    impressum: ImpressumContent = Field(default_factory=ImpressumContent)
    footer: FooterContent = Field(default_factory=FooterContent)
    nav: NavContent = Field(default_factory=NavContent)

class SiteContentUpdate(BaseModel):
    hero: Optional[HeroContent] = None
    features: Optional[FeaturesContent] = None
    about_page: Optional[AboutPageContent] = None
    contact_page: Optional[ContactPageContent] = None
    impressum: Optional[ImpressumContent] = None
    footer: Optional[FooterContent] = None
    nav: Optional[NavContent] = None

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Little Eat Italy API", "status": "running"}

# ============ GLOBALFOOD MENU API ============

@api_router.get("/globalfood/menu")
async def get_globalfood_menu():
    """Fetch menu from GlobalFood API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                GLOBALFOOD_API_URL,
                headers={
                    "Authorization": GLOBALFOOD_API_KEY,
                    "Accept": "application/json",
                    "Glf-Api-Version": "2"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"GlobalFood API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GlobalFood API error: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="GlobalFood API timeout")
    except httpx.RequestError as e:
        logger.error(f"GlobalFood API request error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"GlobalFood API connection error: {str(e)}")

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/login", response_model=TokenResponse)
async def admin_login(credentials: AdminLogin):
    admin = await get_or_create_admin()
    
    if credentials.username != admin["username"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(credentials.username)
    return TokenResponse(access_token=token)

@api_router.get("/auth/verify")
async def verify_admin(username: str = Depends(verify_token)):
    return {"authenticated": True, "username": username}

@api_router.post("/auth/change-password")
async def change_admin_password(data: ChangePassword, username: str = Depends(verify_token)):
    admin = await get_or_create_admin()
    
    if not verify_password(data.current_password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    new_hash = hash_password(data.new_password)
    await db.admin_credentials.update_one(
        {"id": "admin_credentials"},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

# ============ SHOP MENU ENDPOINTS ============

@api_router.get("/shop/menu")
async def get_shop_menu():
    """Get the shop menu for ordering"""
    menu = await db.shop_menu.find_one({"id": "shop_menu"}, {"_id": 0})
    if not menu:
        # Return empty menu structure
        return {"id": "shop_menu", "categories": [], "currency": "EUR"}
    return menu

@api_router.put("/shop/menu")
async def update_shop_menu(menu: ShopMenu, username: str = Depends(verify_token)):
    """Update the entire shop menu (admin only)"""
    menu_dict = menu.model_dump()
    await db.shop_menu.update_one(
        {"id": "shop_menu"},
        {"$set": menu_dict},
        upsert=True
    )
    return {"message": "Menu updated successfully"}

@api_router.post("/shop/menu/category")
async def add_menu_category(category: ShopMenuCategory, username: str = Depends(verify_token)):
    """Add a new category to the menu"""
    menu = await db.shop_menu.find_one({"id": "shop_menu"}, {"_id": 0})
    if not menu:
        menu = {"id": "shop_menu", "categories": [], "currency": "EUR"}
    
    category_dict = category.model_dump()
    menu["categories"].append(category_dict)
    
    await db.shop_menu.update_one(
        {"id": "shop_menu"},
        {"$set": menu},
        upsert=True
    )
    return {"message": "Category added", "category": category_dict}

@api_router.put("/shop/menu/category/{category_id}")
async def update_menu_category(category_id: str, category: ShopMenuCategory, username: str = Depends(verify_token)):
    """Update a category"""
    menu = await db.shop_menu.find_one({"id": "shop_menu"}, {"_id": 0})
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    for i, cat in enumerate(menu["categories"]):
        if cat["id"] == category_id:
            menu["categories"][i] = category.model_dump()
            menu["categories"][i]["id"] = category_id
            break
    else:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.shop_menu.update_one({"id": "shop_menu"}, {"$set": menu})
    return {"message": "Category updated"}

@api_router.delete("/shop/menu/category/{category_id}")
async def delete_menu_category(category_id: str, username: str = Depends(verify_token)):
    """Delete a category"""
    await db.shop_menu.update_one(
        {"id": "shop_menu"},
        {"$pull": {"categories": {"id": category_id}}}
    )
    return {"message": "Category deleted"}

# ============ SHOP SETTINGS ENDPOINTS ============

@api_router.get("/shop/settings")
async def get_shop_settings():
    """Get shop settings"""
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        default_settings = ShopSettings().model_dump()
        await db.shop_settings.insert_one(default_settings)
        return default_settings
    return settings

@api_router.put("/shop/settings")
async def update_shop_settings(settings: ShopSettings, username: str = Depends(verify_token)):
    """Update shop settings (admin only)"""
    settings_dict = settings.model_dump()
    await db.shop_settings.update_one(
        {"id": "shop_settings"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"message": "Settings updated"}

# ============ STAFF AUTH ENDPOINTS ============

def create_staff_token() -> str:
    """Create a JWT token for staff"""
    payload = {
        "sub": "staff",
        "role": "staff",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_staff_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify staff or admin JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role", payload.get("sub"))
        if role not in ["staff", "admin"] and payload.get("sub") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
        return role
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/staff/login", response_model=StaffTokenResponse)
async def staff_login(login_data: StaffPinLogin):
    """Staff login with PIN"""
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    stored_pin = settings.get("staff_pin", "1234")
    
    if login_data.pin != stored_pin:
        raise HTTPException(status_code=401, detail="Falscher PIN")
    
    token = create_staff_token()
    return StaffTokenResponse(access_token=token)

@api_router.get("/staff/verify")
async def verify_staff_session(role: str = Depends(verify_staff_token)):
    """Verify staff session"""
    return {"valid": True, "role": role}

@api_router.get("/staff/orders")
async def get_staff_orders(status: Optional[str] = None, role: str = Depends(verify_staff_token)):
    """Get orders for staff view"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/staff/orders/{order_id}/status")
async def update_staff_order_status(
    order_id: str, 
    status: str, 
    prep_time_minutes: Optional[int] = None,
    role: str = Depends(verify_staff_token)
):
    """Update order status (staff)"""
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate pickup time for ASAP orders
    pickup_time = None
    if status == "confirmed" and order.get("pickup_time") == "So schnell wie möglich" and prep_time_minutes:
        pickup_time = (datetime.now(timezone.utc) + timedelta(minutes=prep_time_minutes)).strftime("%H:%M")
        update_data["confirmed_pickup_time"] = pickup_time
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Get settings for email
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    # Send email notification on confirmation
    if status == "confirmed":
        updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        asyncio.create_task(send_order_status_email(updated_order, settings, "confirmed", pickup_time))
    
    return {"message": f"Status updated to {status}", "pickup_time": pickup_time}

@api_router.get("/staff/reservations")
async def get_staff_reservations(status: Optional[str] = None, date: Optional[str] = None, role: str = Depends(verify_staff_token)):
    """Get reservations for staff view"""
    query = {}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return reservations

@api_router.put("/staff/reservations/{reservation_id}/status")
async def update_staff_reservation_status(reservation_id: str, status: str, role: str = Depends(verify_staff_token)):
    """Update reservation status (staff)"""
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
    
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send email notification
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    if status == "confirmed":
        updated_reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
        asyncio.create_task(send_reservation_confirmation_email(updated_reservation, settings, confirmed=True))
    
    return {"message": f"Status updated to {status}"}

# ============ ORDER ENDPOINTS ============

async def get_next_order_number():
    """Get the next order number"""
    counter = await db.counters.find_one_and_update(
        {"id": "order_number"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    return counter.get("value", 1)

async def send_order_confirmation_email(order: dict, settings: dict):
    """Send order confirmation email"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    items_html = ""
    for item in order["items"]:
        options_str = ""
        if item.get("options"):
            options_str = "<br><small>" + ", ".join([f"{o['option_name']}" for o in item["options"]]) + "</small>"
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                {item['quantity']}x {item['item_name']}
                {f"<br><small>{item['size_name']}</small>" if item.get('size_name') else ""}
                {options_str}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                {item['total_price']:.2f} €
            </td>
        </tr>
        """
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #FF1F1F;">
            <h1 style="color: #FF1F1F; margin: 0;">Little Eat Italy</h1>
            <p style="color: #999; margin: 5px 0;">Bestellbestätigung</p>
        </div>
        
        <div style="padding: 20px 0;">
            <h2 style="color: #FF1F1F;">Bestellung #{order['order_number']}</h2>
            <p>Hallo {order['customer_name']},</p>
            <p>vielen Dank für deine Bestellung! Hier sind die Details:</p>
            
            <div style="background: #262626; padding: 15px; margin: 15px 0; border-left: 3px solid #FF1F1F;">
                <strong>Abholzeit:</strong> {order['pickup_time']}<br>
                <strong>Zahlungsart:</strong> Barzahlung bei Abholung
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #FF1F1F; color: #fff;">
                        <th style="padding: 10px; text-align: left;">Artikel</th>
                        <th style="padding: 10px; text-align: right;">Preis</th>
                    </tr>
                </thead>
                <tbody style="background: #262626;">
                    {items_html}
                </tbody>
                <tfoot>
                    <tr style="background: #333;">
                        <td style="padding: 15px; font-weight: bold;">Gesamt</td>
                        <td style="padding: 15px; text-align: right; font-weight: bold; color: #FF1F1F; font-size: 18px;">
                            {order['total']:.2f} €
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            {f"<p><strong>Anmerkungen:</strong> {order['notes']}</p>" if order.get('notes') else ""}
            
            <div style="background: #262626; padding: 15px; margin: 20px 0;">
                <h3 style="color: #FF1F1F; margin-top: 0;">Abholadresse</h3>
                <p style="margin: 0;">
                    {settings.get('restaurant_name', 'Little Eat Italy')}<br>
                    {settings.get('restaurant_address', 'Europastrasse 8, 57072 Siegen')}<br>
                    Tel: {settings.get('restaurant_phone', '0271 31924461')}
                </p>
            </div>
            
            <p style="color: #999; font-size: 12px;">
                Bei Fragen zu deiner Bestellung erreichst du uns unter {settings.get('restaurant_phone', '0271 31924461')}.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #333; color: #666; font-size: 12px;">
            © 2024 Little Eat Italy. Alle Rechte vorbehalten.
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [order["customer_email"]],
            "subject": f"Bestellbestätigung #{order['order_number']} - Little Eat Italy",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order confirmation email sent to {order['customer_email']}")
    except Exception as e:
        logger.error(f"Failed to send order email: {str(e)}")

@api_router.post("/shop/orders")
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    # Get settings
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    if not settings.get("pickup_enabled", True):
        raise HTTPException(status_code=400, detail="Bestellungen sind derzeit nicht möglich")
    
    # Calculate totals
    subtotal = sum(item.total_price for item in order_data.items)
    total = subtotal
    
    # Get next order number
    order_number = await get_next_order_number()
    
    # Create order
    order = Order(
        order_number=order_number,
        items=[item.model_dump() for item in order_data.items],
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        pickup_time=order_data.pickup_time,
        payment_method=order_data.payment_method,
        notes=order_data.notes,
        subtotal=subtotal,
        total=total,
        status="pending"
    )
    
    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Send confirmation email (non-blocking)
    asyncio.create_task(send_order_confirmation_email(order_dict, settings))
    
    # Send push notification to admin devices
    asyncio.create_task(send_push_notification(
        title="🍕 Neue Bestellung!",
        body=f"#{order_number} • {order_data.customer_name} • {total:.2f}€",
        url="/admin/shop",
        tag=f"order-{order_number}"
    ))
    
    return {
        "message": "Bestellung erfolgreich aufgegeben!",
        "order_number": order_number,
        "order_id": order.id
    }

@api_router.get("/shop/orders")
async def get_orders(status: Optional[str] = None, username: str = Depends(verify_token)):
    """Get all orders (admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.get("/shop/orders/{order_id}")
async def get_order(order_id: str, username: str = Depends(verify_token)):
    """Get a specific order (admin only)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/shop/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, prep_time_minutes: Optional[int] = None, username: str = Depends(verify_token)):
    """Update order status (admin only). For ASAP orders, specify prep_time_minutes when confirming."""
    valid_statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get the order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
    
    # If confirming an ASAP order with prep time, calculate pickup time
    if status == "confirmed" and prep_time_minutes and order.get("pickup_time") == "So schnell wie möglich":
        pickup_time = datetime.now(timezone.utc) + timedelta(minutes=prep_time_minutes)
        pickup_time_str = pickup_time.strftime("%H:%M") + " Uhr"
        update_data["pickup_time"] = pickup_time_str
        update_data["prep_time_minutes"] = prep_time_minutes
        
        # Send updated email with pickup time
        settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
        if not settings:
            settings = ShopSettings().model_dump()
        
        order["pickup_time"] = pickup_time_str
        order["status"] = "confirmed"
        asyncio.create_task(send_order_ready_email(order, settings, prep_time_minutes))
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {"message": f"Order status updated to {status}", "pickup_time": update_data.get("pickup_time")}

async def send_order_ready_email(order: dict, settings: dict, prep_time_minutes: int):
    """Send email with actual pickup time for ASAP orders"""
    if not RESEND_API_KEY:
        return
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #FF1F1F;">
            <h1 style="color: #FF1F1F; margin: 0;">Little Eat Italy</h1>
        </div>
        
        <div style="padding: 20px 0;">
            <h2 style="color: #28a745;">✓ Bestellung #{order['order_number']} bestätigt!</h2>
            <p>Hallo {order['customer_name']},</p>
            <p>deine Bestellung wird jetzt zubereitet.</p>
            
            <div style="background: #28a745; color: #fff; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 14px;">DEINE ABHOLZEIT</p>
                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">{order['pickup_time']}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">in ca. {prep_time_minutes} Minuten</p>
            </div>
            
            <div style="background: #262626; padding: 15px; margin: 20px 0;">
                <h3 style="color: #FF1F1F; margin-top: 0;">Abholadresse</h3>
                <p style="margin: 0;">
                    {settings.get('restaurant_name', 'Little Eat Italy')}<br>
                    {settings.get('restaurant_address', 'Europastrasse 8, 57072 Siegen')}<br>
                    Tel: {settings.get('restaurant_phone', '0271 31924461')}
                </p>
            </div>
            
            <p style="background: #FF1F1F; color: #fff; padding: 15px; text-align: center; font-weight: bold;">
                💵 Zahlung: Barzahlung bei Abholung
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #333; color: #666; font-size: 12px;">
            © 2024 Little Eat Italy. Alle Rechte vorbehalten.
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [order["customer_email"]],
            "subject": f"Bestellung #{order['order_number']} bestätigt - Abholung um {order['pickup_time']}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Order ready email sent to {order['customer_email']}")
    except Exception as e:
        logger.error(f"Failed to send order ready email: {str(e)}")

# ============ RESERVATION ENDPOINTS ============

async def get_next_reservation_number():
    """Get the next reservation number"""
    counter = await db.counters.find_one_and_update(
        {"id": "reservation_number"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    return counter.get("value", 1)

async def send_reservation_confirmation_email(reservation: dict, settings: dict, confirmed: bool = False):
    """Send reservation confirmation email"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    status_text = "bestätigt" if confirmed else "eingegangen und wird geprüft"
    status_color = "#28a745" if confirmed else "#ffc107"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #FF1F1F;">
            <h1 style="color: #FF1F1F; margin: 0;">Little Eat Italy</h1>
            <p style="color: #999; margin: 5px 0;">Reservierungsbestätigung</p>
        </div>
        
        <div style="padding: 20px 0;">
            <h2 style="color: #FF1F1F;">Reservierung #{reservation['reservation_number']}</h2>
            <p>Hallo {reservation['customer_name']},</p>
            <p>deine Reservierung ist {status_text}.</p>
            
            <div style="background: #262626; padding: 20px; margin: 20px 0; border-left: 3px solid {status_color};">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 5px 0; color: #999;">Datum:</td>
                        <td style="padding: 5px 0; font-weight: bold;">{reservation['date']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #999;">Uhrzeit:</td>
                        <td style="padding: 5px 0; font-weight: bold;">{reservation['time']} Uhr</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #999;">Personen:</td>
                        <td style="padding: 5px 0; font-weight: bold;">{reservation['guests']}</td>
                    </tr>
                </table>
            </div>
            
            {f"<p><strong>Anmerkungen:</strong> {reservation['notes']}</p>" if reservation.get('notes') else ""}
            
            <div style="background: #262626; padding: 15px; margin: 20px 0;">
                <h3 style="color: #FF1F1F; margin-top: 0;">Restaurant</h3>
                <p style="margin: 0;">
                    {settings.get('restaurant_name', 'Little Eat Italy')}<br>
                    {settings.get('restaurant_address', 'Europastrasse 8, 57072 Siegen')}<br>
                    Tel: {settings.get('restaurant_phone', '0271 31924461')}
                </p>
            </div>
            
            <p style="color: #999; font-size: 12px;">
                Bei Änderungen oder Stornierung bitte unter {settings.get('restaurant_phone', '0271 31924461')} anrufen.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #333; color: #666; font-size: 12px;">
            © 2024 Little Eat Italy. Alle Rechte vorbehalten.
        </div>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [reservation["customer_email"]],
            "subject": f"Reservierung #{reservation['reservation_number']} {'bestätigt' if confirmed else 'eingegangen'} - Little Eat Italy",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Reservation email sent to {reservation['customer_email']}")
    except Exception as e:
        logger.error(f"Failed to send reservation email: {str(e)}")

@api_router.post("/shop/reservations")
async def create_reservation(reservation_data: ReservationCreate):
    """Create a new reservation"""
    # Get settings
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    if not settings.get("reservation_enabled", True):
        raise HTTPException(status_code=400, detail="Reservierungen sind derzeit nicht möglich")
    
    # Get next reservation number
    reservation_number = await get_next_reservation_number()
    
    # Create reservation
    reservation = Reservation(
        reservation_number=reservation_number,
        customer_name=reservation_data.customer_name,
        customer_email=reservation_data.customer_email,
        customer_phone=reservation_data.customer_phone,
        date=reservation_data.date,
        time=reservation_data.time,
        guests=reservation_data.guests,
        notes=reservation_data.notes,
        status="pending"
    )
    
    reservation_dict = reservation.model_dump()
    reservation_dict["created_at"] = reservation_dict["created_at"].isoformat()
    reservation_dict["updated_at"] = reservation_dict["updated_at"].isoformat()
    
    await db.reservations.insert_one(reservation_dict)
    
    # Send confirmation email (non-blocking)
    asyncio.create_task(send_reservation_confirmation_email(reservation_dict, settings, confirmed=False))
    
    # Send push notification to admin devices
    asyncio.create_task(send_push_notification(
        title="📅 Neue Reservierung!",
        body=f"#{reservation_number} • {reservation_data.customer_name} • {reservation_data.date} {reservation_data.time} Uhr • {reservation_data.guests} Pers.",
        url="/admin/shop",
        tag=f"reservation-{reservation_number}"
    ))
    
    return {
        "message": "Reservierung erfolgreich aufgegeben! Du erhältst eine E-Mail wenn sie bestätigt wird.",
        "reservation_number": reservation_number,
        "reservation_id": reservation.id
    }

@api_router.get("/shop/reservations")
async def get_reservations(status: Optional[str] = None, date: Optional[str] = None, username: str = Depends(verify_token)):
    """Get all reservations (admin only)"""
    query = {}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return reservations

@api_router.get("/shop/reservations/{reservation_id}")
async def get_reservation(reservation_id: str, username: str = Depends(verify_token)):
    """Get a specific reservation (admin only)"""
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation

@api_router.put("/shop/reservations/{reservation_id}/status")
async def update_reservation_status(reservation_id: str, status: str, username: str = Depends(verify_token)):
    """Update reservation status (admin only)"""
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    result = await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send confirmation email if status changed to confirmed
    if status == "confirmed":
        settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
        if not settings:
            settings = ShopSettings().model_dump()
        asyncio.create_task(send_reservation_confirmation_email(reservation, settings, confirmed=True))
    
    return {"message": f"Reservation status updated to {status}"}

# Menu endpoints (old - keeping for compatibility)
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

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, input: MenuItemCreate):
    update_data = input.model_dump()
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return item

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted"}

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

# ============ CMS CONTENT ENDPOINTS ============

@api_router.get("/content")
async def get_site_content():
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        # Return default content
        default = get_default_content()
        await db.site_content.insert_one(default)
        return default
    return content

@api_router.put("/content")
async def update_site_content(update: SiteContentUpdate):
    update_dict = {}
    for k, v in update.model_dump().items():
        if v is not None:
            if hasattr(v, 'model_dump'):
                update_dict[k] = v.model_dump()
            else:
                update_dict[k] = v
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No content to update")
    
    result = await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": update_dict},
        upsert=True
    )
    
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    return content

@api_router.put("/content/hero")
async def update_hero_content(hero: HeroContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"hero": hero.model_dump()}},
        upsert=True
    )
    return {"message": "Hero content updated", "hero": hero}

@api_router.put("/content/buttons")
async def update_action_buttons(buttons: List[ActionButton]):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"hero.buttons": [b.model_dump() for b in buttons]}},
        upsert=True
    )
    return {"message": "Buttons updated", "buttons": buttons}

@api_router.put("/content/contact")
async def update_contact_content(contact: ContactPageContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"contact_page": contact.model_dump()}},
        upsert=True
    )
    return {"message": "Contact content updated"}

@api_router.put("/content/about")
async def update_about_content(about: AboutPageContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"about_page": about.model_dump()}},
        upsert=True
    )
    return {"message": "About content updated"}

@api_router.put("/content/menu-page")
async def update_menu_page_content(menu_page: MenuPageContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"menu_page": menu_page.model_dump()}},
        upsert=True
    )
    return {"message": "Menu page content updated"}

@api_router.put("/content/footer")
async def update_footer_content(footer: FooterContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"footer": footer.model_dump()}},
        upsert=True
    )
    return {"message": "Footer content updated"}

@api_router.put("/content/impressum")
async def update_impressum_content(impressum: ImpressumContent):
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": {"impressum": impressum.model_dump()}},
        upsert=True
    )
    return {"message": "Impressum content updated"}

@api_router.get("/impressum")
async def get_impressum():
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if content and "impressum" in content:
        return content["impressum"]
    return ImpressumContent().model_dump()

def get_default_content():
    return {
        "id": "site_content",
        "hero": {
            "background_image": "https://images.unsplash.com/photo-1760001484733-61cd5917f5c3?q=85&w=1920&auto=format&fit=crop",
            "subtitle": "Authentische neapolitanische Pizza mit urbaner Seele. Holzofenperfektion aus den Straßen von Neapel.",
            "buttons": [
                {"id": "uber_eats", "label": "UBER EATS", "url": "#", "is_active": True, "icon": "utensils"},
                {"id": "lieferando", "label": "LIEFERANDO", "url": "#", "is_active": True, "icon": "bike"},
                {"id": "pickup", "label": "BESTELLEN ZUM ABHOLEN", "url": "#", "is_active": True, "icon": "shopping-bag"},
                {"id": "reservation", "label": "TISCHRESERVIERUNG", "url": "#", "is_active": True, "icon": "calendar"}
            ]
        },
        "features": {
            "items": [
                {"icon": "flame", "title": "HOLZOFEN", "description": "480°C Ofen für die perfekte, gefleckte Kruste"},
                {"icon": "clock", "title": "48 STD. TEIG", "description": "Langsam fermentiert für authentische neapolitanische Textur"},
                {"icon": "map-pin", "title": "IMPORTIERT", "description": "San Marzano Tomaten & italienischer Mozzarella"}
            ]
        },
        "about_page": {
            "hero_title": "UNSERE",
            "hero_title_highlight": "GESCHICHTE",
            "hero_subtitle": "Von Neapel mit Liebe, auf die Straßen mit Leidenschaft",
            "story_title": "GEBOREN IN",
            "story_title_highlight": "NEAPEL",
            "story_paragraphs": [
                "Little Eat Italy begann mit einem einfachen Traum: den authentischen Geschmack der neapolitanischen Pizza auf die urbanen Straßen zu bringen.",
                "2015 eröffnete er unser erstes Lokal in einer umgebauten Garage, ausgestattet mit nichts als einem aus Italien importierten Holzofen und Rezepten, die über vier Generationen weitergegeben wurden.",
                "Heute erzählen diese Wände unsere Geschichte. Wir sind nicht nur eine Pizzeria – wir sind eine Leinwand für urbane Kultur."
            ],
            "stats": [
                {"number": "2015", "label": "GEGRÜNDET"},
                {"number": "48", "label": "STUNDEN TEIG"},
                {"number": "480°", "label": "OFENTEMP."},
                {"number": "100%", "label": "IMPORTIERT"}
            ],
            "philosophy_title": "UNSERE",
            "philosophy_title_highlight": "PHILOSOPHIE",
            "philosophy_items": [
                {"title": "AUTHENTIZITÄT", "description": "Jede Zutat stammt aus Italien."},
                {"title": "HANDWERKSKUNST", "description": "Unser Teig fermentiert mindestens 48 Stunden."},
                {"title": "GEMEINSCHAFT", "description": "Wir glauben, dass Pizza Menschen zusammenbringt."}
            ],
            "quote_text": "PIZZA IST NICHT NUR ESSEN. ES IST EINE",
            "quote_highlight": "SPRACHE",
            "quote_author": "— MARCO ROSSI, GRÜNDER"
        },
        "contact_page": {
            "hero_title": "KONTAKTIERE",
            "hero_title_highlight": "UNS",
            "hero_subtitle": "Fragen, Feedback oder einfach nur Ciao sagen? Wir hören zu.",
            "address_title": "ADRESSE",
            "address_line1": "Pizzastraße 123",
            "address_line2": "Little Italy, 10001",
            "phone_title": "TELEFON",
            "phone": "+49 (0) 123 456789",
            "email_title": "E-MAIL",
            "email": "ciao@littleeatitaly.de",
            "hours_title": "ÖFFNUNGSZEITEN",
            "hours": [
                {"day": "Montag - Donnerstag", "time": "11:00 - 22:00"},
                {"day": "Freitag", "time": "11:00 - 23:00"},
                {"day": "Samstag", "time": "12:00 - 23:00"},
                {"day": "Sonntag", "time": "12:00 - 21:00"}
            ],
            "form_title": "SCHREIBE EINE",
            "form_title_highlight": "NACHRICHT",
            "form_name_label": "DEIN NAME",
            "form_name_placeholder": "Gib deinen Namen ein",
            "form_email_label": "DEINE E-MAIL",
            "form_email_placeholder": "Gib deine E-Mail ein",
            "form_phone_label": "DEINE TELEFONNUMMER",
            "form_phone_placeholder": "Gib deine Telefonnummer ein",
            "form_phone_enabled": True,
            "form_subject_label": "BETREFF",
            "form_subject_placeholder": "Worum geht es?",
            "form_subject_enabled": True,
            "form_message_label": "DEINE NACHRICHT",
            "form_message_placeholder": "Was liegt dir auf dem Herzen?",
            "form_submit_text": "NACHRICHT SENDEN",
            "form_success_message": "Nachricht gesendet! Wir melden uns bald bei dir.",
            "form_note": "Wir antworten normalerweise innerhalb von 24 Stunden."
        },
        "impressum": ImpressumContent().model_dump(),
        "footer": {
            "marquee_text": "AUTHENTISCH NEAPOLITANISCH • STREET VIBES • LITTLE EAT ITALY • HOLZOFEN • HANDGEMACHTER TEIG • ",
            "brand_description": "Geboren auf den Straßen von Neapel, aufgewachsen im Herzen der Stadt. Authentische neapolitanische Pizza mit urbanem Twist.",
            "nav_title": "NAVIGATION",
            "contact_title": "HIER FINDEST DU UNS",
            "address": "Pizzastraße 123, Little Italy, 10001",
            "phone": "+49 (0) 123 456789",
            "email": "ciao@littleeatitaly.de",
            "copyright": "© 2024 Little Eat Italy. Alle Rechte vorbehalten.",
            "made_with": "Mit ♥ gemacht"
        },
        "nav": {
            "links": [
                {"name": "START", "path": "/"},
                {"name": "ÜBER UNS", "path": "/about"},
                {"name": "KONTAKT", "path": "/contact"},
                {"name": "IMPRESSUM", "path": "/impressum"}
            ]
        }
    }

# ============ PUSH NOTIFICATIONS ============

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # Contains p256dh and auth keys

class PushSubscriptionCreate(BaseModel):
    subscription: PushSubscription
    device_name: Optional[str] = "Unbekanntes Gerät"

@api_router.get("/push/vapid-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push subscription"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="Push notifications not configured")
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def subscribe_to_push(
    data: PushSubscriptionCreate,
    username: str = Depends(verify_token)
):
    """Subscribe a device for push notifications (admin only)"""
    
    subscription_data = {
        "id": str(uuid.uuid4()),
        "endpoint": data.subscription.endpoint,
        "keys": data.subscription.keys,
        "device_name": data.device_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    
    # Check if subscription already exists
    existing = await db.push_subscriptions.find_one({"endpoint": data.subscription.endpoint})
    if existing:
        await db.push_subscriptions.update_one(
            {"endpoint": data.subscription.endpoint},
            {"$set": {"keys": data.subscription.keys, "active": True, "device_name": data.device_name}}
        )
        return {"message": "Subscription updated", "id": existing.get("id")}
    
    await db.push_subscriptions.insert_one(subscription_data)
    return {"message": "Subscription created", "id": subscription_data["id"]}

@api_router.delete("/push/unsubscribe")
async def unsubscribe_from_push(
    endpoint: str,
    username: str = Depends(verify_token)
):
    """Unsubscribe a device from push notifications"""
    
    result = await db.push_subscriptions.delete_one({"endpoint": endpoint})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Unsubscribed successfully"}

@api_router.get("/push/subscriptions")
async def get_push_subscriptions(
    username: str = Depends(verify_token)
):
    """Get all push subscriptions (admin only)"""
    
    subscriptions = await db.push_subscriptions.find({"active": True}, {"_id": 0}).to_list(100)
    return subscriptions

async def send_push_notification(title: str, body: str, url: str = "/admin/shop", tag: str = "order"):
    """Send push notification to all subscribed devices"""
    if not VAPID_PUBLIC_KEY:
        logger.warning("Push notifications not configured - VAPID_PUBLIC_KEY missing")
        return 0
    
    try:
        from pywebpush import webpush, WebPushException
        import json
        
        # Load private key
        private_key_path = ROOT_DIR / VAPID_PRIVATE_KEY_FILE
        if not private_key_path.exists():
            logger.warning(f"VAPID private key file not found: {private_key_path}")
            return 0
        
        with open(private_key_path, 'r') as f:
            private_key = f.read()
        
        subscriptions = await db.push_subscriptions.find({"active": True}).to_list(100)
        
        if not subscriptions:
            logger.info("No active push subscriptions")
            return 0
        
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/icon-72x72.png",
            "url": url,
            "tag": tag,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        sent_count = 0
        for sub in subscriptions:
            try:
                subscription_info = {
                    "endpoint": sub["endpoint"],
                    "keys": sub["keys"]
                }
                
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=private_key,
                    vapid_claims={"sub": f"mailto:{VAPID_CLAIMS_EMAIL}"}
                )
                sent_count += 1
                logger.info(f"Push notification sent to {sub.get('device_name', 'unknown')}")
                
            except WebPushException as e:
                logger.error(f"Push notification failed for {sub.get('device_name', 'unknown')}: {e}")
                # If subscription is invalid, mark it as inactive
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.update_one(
                        {"endpoint": sub["endpoint"]},
                        {"$set": {"active": False}}
                    )
            except Exception as e:
                logger.error(f"Push notification error: {e}")
        
        return sent_count
        
    except ImportError:
        logger.warning("pywebpush not installed")
        return 0
    except Exception as e:
        logger.error(f"Push notification error: {e}")
        return 0

@api_router.post("/push/test")
async def test_push_notification(
    username: str = Depends(verify_token)
):
    """Send a test push notification (admin only)"""
    
    sent_count = await send_push_notification(
        title="🍕 Test Benachrichtigung",
        body="Push-Benachrichtigungen funktionieren!",
        tag="test"
    )
    
    return {"message": f"Test notification sent to {sent_count} device(s)"}

# Seed data endpoint
@api_router.post("/seed")
async def seed_data():
    # Seed menu items if not exists
    existing_menu = await db.menu_items.count_documents({})
    if existing_menu == 0:
        menu_items = [
            {"id": str(uuid.uuid4()), "name": "MARGHERITA", "description": "San Marzano Tomaten, frischer Mozzarella, Basilikum, Olivenöl", "price": 16.00, "category": "classic", "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=85&w=800&auto=format&fit=crop", "is_featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "MARINARA", "description": "San Marzano Tomaten, Knoblauch, Oregano, Olivenöl", "price": 14.00, "category": "classic", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "QUATTRO FORMAGGI", "description": "Mozzarella, Gorgonzola, Parmesan, Fontina Käsemischung", "price": 19.00, "category": "classic", "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=85&w=800&auto=format&fit=crop", "is_featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "DIAVOLA", "description": "Scharfe Salami, San Marzano Tomaten, Mozzarella, Chiliöl", "price": 18.00, "category": "special", "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=85&w=800&auto=format&fit=crop", "is_featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "CAPRICCIOSA", "description": "Schinken, Pilze, Artischocken, Oliven, Mozzarella, Tomatensauce", "price": 20.00, "category": "special", "image_url": "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "PROSCIUTTO E RUCOLA", "description": "Prosciutto di Parma, frischer Rucola, gehobelter Parmesan, Mozzarella", "price": 22.00, "category": "special", "image_url": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "ORTOLANA", "description": "Gegrillte Zucchini, Aubergine, Paprika, Kirschtomaten, Mozzarella", "price": 17.00, "category": "vegetarian", "image_url": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "FUNGHI PORCINI", "description": "Steinpilze, Trüffelöl, Mozzarella, Parmesan", "price": 21.00, "category": "vegetarian", "image_url": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=85&w=800&auto=format&fit=crop", "is_featured": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "NUTELLA CALZONE", "description": "Warmer gefalteter Pizzateig gefüllt mit Nutella und Mascarpone", "price": 10.00, "category": "dessert", "image_url": "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "TIRAMISU", "description": "Klassisches italienisches Dessert mit Espresso-getränkten Löffelbiskuits und Mascarpone", "price": 9.00, "category": "dessert", "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=85&w=800&auto=format&fit=crop", "is_featured": False, "created_at": datetime.now(timezone.utc).isoformat()}
        ]
        await db.menu_items.insert_many(menu_items)
    
    # Seed site content if not exists
    existing_content = await db.site_content.find_one({"id": "site_content"})
    if not existing_content:
        default_content = get_default_content()
        await db.site_content.insert_one(default_content)
    
    return {"message": "Data seeded successfully"}

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
