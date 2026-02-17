from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
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
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

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
    form_message_label: str = "DEINE NACHRICHT"
    form_message_placeholder: str = "Was liegt dir auf dem Herzen?"
    form_submit_text: str = "NACHRICHT SENDEN"
    form_note: str = "Wir antworten normalerweise innerhalb von 24 Stunden. Für dringende Angelegenheiten ruf uns an oder komm einfach vorbei – die Pizza ist immer heiß!"

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

class NavContent(BaseModel):
    links: List[Dict[str, str]] = []

class SiteContent(BaseModel):
    id: str = "site_content"
    hero: HeroContent = Field(default_factory=HeroContent)
    features: FeaturesContent = Field(default_factory=FeaturesContent)
    menu_page: MenuPageContent = Field(default_factory=MenuPageContent)
    about_page: AboutPageContent = Field(default_factory=AboutPageContent)
    contact_page: ContactPageContent = Field(default_factory=ContactPageContent)
    footer: FooterContent = Field(default_factory=FooterContent)
    nav: NavContent = Field(default_factory=NavContent)

class SiteContentUpdate(BaseModel):
    hero: Optional[HeroContent] = None
    features: Optional[FeaturesContent] = None
    menu_page: Optional[MenuPageContent] = None
    about_page: Optional[AboutPageContent] = None
    contact_page: Optional[ContactPageContent] = None
    footer: Optional[FooterContent] = None
    nav: Optional[NavContent] = None

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
    update_dict = {k: v.model_dump() if v else None for k, v in update.model_dump().items() if v is not None}
    
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

def get_default_content():
    return {
        "id": "site_content",
        "hero": {
            "background_image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=85&w=1920&auto=format&fit=crop",
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
        "menu_page": {
            "title": "UNSERE",
            "title_highlight": "SPEISEKARTE",
            "subtitle": "Von klassischen neapolitanischen Traditionen bis zu unseren einzigartigen urbanen Kreationen",
            "bottom_title": "KANNST DICH NICHT ENTSCHEIDEN?",
            "bottom_text": "Unsere Favoriten sind die Margherita für Puristen, Diavola für Schärfe-Fans und Funghi Porcini für Abenteurer."
        },
        "about_page": {
            "hero_title": "UNSERE",
            "hero_title_highlight": "GESCHICHTE",
            "hero_subtitle": "Von Neapel mit Liebe, auf die Straßen mit Leidenschaft",
            "story_title": "GEBOREN IN",
            "story_title_highlight": "NEAPEL",
            "story_paragraphs": [
                "Little Eat Italy begann mit einem einfachen Traum: den authentischen Geschmack der neapolitanischen Pizza auf die urbanen Straßen zu bringen. Unser Gründer, Marco Rossi, wuchs auf und sah seiner Großmutter beim Teigkneten in ihrer Familienküche in Neapel zu.",
                "2015 eröffnete er unser erstes Lokal in einer umgebauten Garage, ausgestattet mit nichts als einem aus Italien importierten Holzofen und Rezepten, die über vier Generationen weitergegeben wurden. Die mit Graffiti bedeckten Wände waren nicht Teil des ursprünglichen Plans – sie kamen von lokalen Straßenkünstlern, die für ihre Pizzen mit Kunst bezahlten.",
                "Heute erzählen diese Wände unsere Geschichte. Wir sind nicht nur eine Pizzeria – wir sind eine Leinwand für urbane Kultur, ein Treffpunkt für Träumer und vor allem ein Ort, an dem jede Pizza ein Meisterwerk ist."
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
                {"title": "AUTHENTIZITÄT", "description": "Jede Zutat stammt aus Italien. San Marzano Tomaten, Büffelmozzarella, 00-Mehl – keine Kompromisse."},
                {"title": "HANDWERKSKUNST", "description": "Unser Teig fermentiert mindestens 48 Stunden. Unser Ofen brennt bei 480°C. Das ist kein Fast Food – das ist Kunst."},
                {"title": "GEMEINSCHAFT", "description": "Wir glauben, dass Pizza Menschen zusammenbringt. Unsere Türen stehen allen offen – Künstlern, Musikern, Familien, Träumern."}
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
            "form_message_label": "DEINE NACHRICHT",
            "form_message_placeholder": "Was liegt dir auf dem Herzen?",
            "form_submit_text": "NACHRICHT SENDEN",
            "form_note": "Wir antworten normalerweise innerhalb von 24 Stunden. Für dringende Angelegenheiten ruf uns an oder komm einfach vorbei – die Pizza ist immer heiß!"
        },
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
                {"name": "SPEISEKARTE", "path": "/menu"},
                {"name": "ÜBER UNS", "path": "/about"},
                {"name": "KONTAKT", "path": "/contact"}
            ]
        }
    }

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
