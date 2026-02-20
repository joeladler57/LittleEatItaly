"""
Customer Router - Kundenkonto und Profil
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from .shared import (
    db, verify_admin_token, verify_customer_token,
    hash_password, verify_password, create_customer_token,
    CustomerRegister, CustomerLogin, CustomerUpdate, Customer
)

router = APIRouter(prefix="/api", tags=["customers"])

# ============ CUSTOMER HELPER FUNCTIONS ============

async def find_or_create_customer_record(email: str, phone: str, name: str) -> dict:
    """
    Find existing customer by email or phone, or create a new guest record.
    Returns customer info for display in admin/staff views.
    """
    normalized_phone = phone.replace(" ", "").replace("-", "").replace("/", "")
    
    customer = await db.customers.find_one({"email": email.lower()}, {"_id": 0, "password_hash": 0})
    
    if not customer:
        customer = await db.customers.find_one({
            "$or": [
                {"phone": phone},
                {"phone": normalized_phone}
            ]
        }, {"_id": 0, "password_hash": 0})
    
    if customer:
        return {
            "id": customer.get("id"),
            "name": customer.get("name", name),
            "email": customer.get("email", email),
            "phone": customer.get("phone", phone),
            "is_new": False,
            "total_orders": customer.get("total_orders", 0),
            "total_reservations": customer.get("total_reservations", 0),
            "total_spent": customer.get("total_spent", 0.0),
            "last_order_date": customer.get("last_order_date").isoformat() if customer.get("last_order_date") else None,
            "last_reservation_date": customer.get("last_reservation_date").isoformat() if customer.get("last_reservation_date") else None,
            "has_account": customer.get("password_hash") is not None if "password_hash" in customer else customer.get("has_account", False)
        }
    
    guest_id = str(uuid.uuid4())
    guest_record = {
        "id": guest_id,
        "email": email.lower(),
        "name": name,
        "phone": phone,
        "total_orders": 0,
        "total_reservations": 0,
        "total_spent": 0.0,
        "last_order_date": None,
        "last_reservation_date": None,
        "has_account": False,
        "is_guest": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.customers.insert_one(guest_record)
    
    return {
        "id": guest_id,
        "name": name,
        "email": email.lower(),
        "phone": phone,
        "is_new": True,
        "total_orders": 0,
        "total_reservations": 0,
        "total_spent": 0.0,
        "last_order_date": None,
        "last_reservation_date": None,
        "has_account": False
    }

async def update_customer_order_stats(customer_id: str, order_total: float):
    """Update customer statistics after an order"""
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$inc": {"total_orders": 1, "total_spent": order_total},
            "$set": {
                "last_order_date": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

async def update_customer_reservation_stats(customer_id: str):
    """Update customer statistics after a reservation"""
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$inc": {"total_reservations": 1},
            "$set": {
                "last_reservation_date": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

async def get_customer_info(customer_id: str) -> dict:
    """Get customer info by ID"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        return None
    return {
        "id": customer.get("id"),
        "name": customer.get("name"),
        "email": customer.get("email"),
        "phone": customer.get("phone"),
        "is_new": customer.get("total_orders", 0) == 0 and customer.get("total_reservations", 0) == 0,
        "total_orders": customer.get("total_orders", 0),
        "total_reservations": customer.get("total_reservations", 0),
        "total_spent": customer.get("total_spent", 0.0),
        "last_order_date": customer.get("last_order_date").isoformat() if customer.get("last_order_date") else None,
        "last_reservation_date": customer.get("last_reservation_date").isoformat() if customer.get("last_reservation_date") else None,
        "has_account": not customer.get("is_guest", True)
    }

# ============ REGISTRATION & LOGIN ============

@router.post("/customers/register")
async def register_customer(data: CustomerRegister):
    """Register a new customer account"""
    existing = await db.customers.find_one({"email": data.email.lower(), "has_account": True})
    if existing:
        raise HTTPException(status_code=400, detail="Ein Konto mit dieser E-Mail existiert bereits")
    
    guest = await db.customers.find_one({"email": data.email.lower(), "is_guest": True})
    
    if guest:
        await db.customers.update_one(
            {"id": guest["id"]},
            {
                "$set": {
                    "name": data.name,
                    "phone": data.phone,
                    "password_hash": hash_password(data.password),
                    "has_account": True,
                    "is_guest": False,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        customer_id = guest["id"]
    else:
        customer = Customer(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            name=data.name,
            phone=data.phone
        )
        customer_dict = customer.model_dump()
        customer_dict["has_account"] = True
        customer_dict["is_guest"] = False
        await db.customers.insert_one(customer_dict)
        customer_id = customer.id
    
    token = create_customer_token(customer_id, data.email.lower())
    
    return {
        "message": "Konto erfolgreich erstellt!",
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/customers/login")
async def login_customer(data: CustomerLogin):
    """Login customer"""
    customer = await db.customers.find_one({"email": data.email.lower(), "has_account": True})
    if not customer:
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    if not verify_password(data.password, customer.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    token = create_customer_token(customer["id"], data.email.lower())
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {
            "id": customer["id"],
            "name": customer["name"],
            "email": customer["email"],
            "phone": customer["phone"]
        }
    }

# ============ PROFILE ENDPOINTS ============

@router.get("/customers/me")
async def get_customer_profile(customer: dict = Depends(verify_customer_token)):
    """Get current customer profile"""
    customer_data = await db.customers.find_one({"id": customer["id"]}, {"_id": 0, "password_hash": 0})
    if not customer_data:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    for field in ["created_at", "updated_at", "last_order_date", "last_reservation_date"]:
        if customer_data.get(field) and hasattr(customer_data[field], "isoformat"):
            customer_data[field] = customer_data[field].isoformat()
    
    return customer_data

@router.put("/customers/me")
async def update_customer_profile(data: CustomerUpdate, customer: dict = Depends(verify_customer_token)):
    """Update customer profile"""
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if data.name:
        update_data["name"] = data.name
    if data.phone:
        update_data["phone"] = data.phone
    
    await db.customers.update_one({"id": customer["id"]}, {"$set": update_data})
    return {"message": "Profil aktualisiert"}

@router.get("/customers/me/orders")
async def get_customer_orders(customer: dict = Depends(verify_customer_token)):
    """Get customer's order history"""
    orders = await db.orders.find(
        {"customer_id": customer["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders

@router.get("/customers/me/reservations")
async def get_customer_reservations(customer: dict = Depends(verify_customer_token)):
    """Get customer's reservation history"""
    reservations = await db.reservations.find(
        {"customer_id": customer["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return reservations

# ============ ADMIN ENDPOINTS ============

@router.get("/customers")
async def get_all_customers(username: str = Depends(verify_admin_token)):
    """Get all customers (admin only)"""
    customers = await db.customers.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    
    for c in customers:
        for field in ["created_at", "updated_at", "last_order_date", "last_reservation_date"]:
            if c.get(field) and hasattr(c[field], "isoformat"):
                c[field] = c[field].isoformat()
    
    return customers

@router.get("/customers/{customer_id}")
async def get_customer_by_id(customer_id: str, username: str = Depends(verify_admin_token)):
    """Get customer details by ID (admin only)"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    for field in ["created_at", "updated_at", "last_order_date", "last_reservation_date"]:
        if customer.get(field) and hasattr(customer[field], "isoformat"):
            customer[field] = customer[field].isoformat()
    
    recent_orders = await db.orders.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    recent_reservations = await db.reservations.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    customer["recent_orders"] = recent_orders
    customer["recent_reservations"] = recent_reservations
    
    return customer


# ============ WALLET PASS ENDPOINTS ============

@router.get("/customers/me/wallet-pass")
async def get_wallet_pass(type: str, customer: dict = Depends(verify_customer_token)):
    """
    Generate or retrieve wallet pass for customer.
    Type can be 'apple' or 'google'.
    
    Note: Full Apple/Google Wallet integration requires:
    - Apple: Developer account with Pass Type ID and certificates
    - Google: Cloud project with Wallet API enabled and service account
    
    This endpoint returns instructions or pass URL when configured.
    """
    customer_data = await db.customers.find_one(
        {"id": customer["id"]}, 
        {"_id": 0, "password_hash": 0}
    )
    
    if not customer_data:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    # Check if wallet integration is configured
    settings = await db.settings.find_one({"id": "wallet_settings"}, {"_id": 0})
    
    if type == "apple":
        if settings and settings.get("apple_wallet_enabled"):
            # Apple Wallet is configured - generate .pkpass
            # This would require certificates to be set up
            pass_url = settings.get("apple_pass_url_template", "").format(
                customer_id=customer["id"]
            )
            if pass_url:
                return {"pass_url": pass_url, "type": "apple"}
        
        # Not configured - return 501
        raise HTTPException(
            status_code=501, 
            detail="Apple Wallet Integration ist noch nicht konfiguriert. Bitte nutze die QR-Code Speicher-Funktion."
        )
    
    elif type == "google":
        if settings and settings.get("google_wallet_enabled"):
            # Google Wallet is configured - generate JWT pass link
            pass_url = settings.get("google_pass_url_template", "").format(
                customer_id=customer["id"]
            )
            if pass_url:
                return {"pass_url": pass_url, "type": "google"}
        
        # Not configured - return 501
        raise HTTPException(
            status_code=501, 
            detail="Google Wallet Integration ist noch nicht konfiguriert. Bitte nutze 'Zur Startseite hinzufügen'."
        )
    
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Wallet-Typ. Erlaubt: apple, google")
