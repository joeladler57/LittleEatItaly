"""
Loyalty Program Router - Bonuspunkte System
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from .shared import (
    db, verify_admin_token, verify_staff_token, verify_customer_token,
    hash_password, JWT_SECRET, LoyaltyReward, AddPointsRequest
)

router = APIRouter(prefix="/api", tags=["loyalty"])

# ============ LOYALTY FUNCTIONS ============

async def get_loyalty_settings() -> dict:
    """Get loyalty program settings"""
    settings = await db.loyalty_settings.find_one({"id": "loyalty_settings"}, {"_id": 0})
    if not settings:
        default_settings = {
            "id": "loyalty_settings",
            "enabled": True,
            "points_per_euro": 1.0,
            "min_purchase_for_points": 0.0,
            "points_expiry_months": 12,
            "welcome_bonus_points": 10,
            "rewards": [
                {"id": str(uuid.uuid4()), "name": "Gratis Softdrink", "description": "Wähle ein Softdrink deiner Wahl", "points_required": 30, "category": "drink", "is_active": True, "sort_order": 1},
                {"id": str(uuid.uuid4()), "name": "Gratis Dessert", "description": "Wähle ein Dessert deiner Wahl", "points_required": 50, "category": "food", "is_active": True, "sort_order": 2},
                {"id": str(uuid.uuid4()), "name": "5€ Rabatt", "description": "5€ Rabatt auf deine nächste Bestellung", "points_required": 80, "category": "discount", "is_active": True, "sort_order": 3},
                {"id": str(uuid.uuid4()), "name": "Gratis Pizza", "description": "Wähle eine Pizza bis 15€", "points_required": 150, "category": "food", "is_active": True, "sort_order": 4}
            ]
        }
        await db.loyalty_settings.insert_one(default_settings)
        return default_settings
    return settings

async def calculate_points_for_purchase(amount: float) -> int:
    """Calculate points earned for a purchase amount"""
    settings = await get_loyalty_settings()
    if not settings.get("enabled", True):
        return 0
    if amount < settings.get("min_purchase_for_points", 0):
        return 0
    points_per_euro = settings.get("points_per_euro", 1.0)
    return int(amount * points_per_euro)

async def add_points_to_customer(customer_id: str, points: int, point_type: str, description: str, order_id: str = None, staff_id: str = None):
    """Add points to customer account"""
    if points == 0:
        return
    
    settings = await get_loyalty_settings()
    expiry_months = settings.get("points_expiry_months", 12)
    expires_at = datetime.now(timezone.utc) + timedelta(days=expiry_months * 30)
    
    transaction = {
        "id": str(uuid.uuid4()),
        "amount": points,
        "type": point_type,
        "description": description,
        "order_id": order_id,
        "staff_id": staff_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$inc": {"loyalty_points": points, "lifetime_points": max(0, points)},
            "$push": {"points_history": {"$each": [transaction], "$slice": -100}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    transaction["customer_id"] = customer_id
    await db.points_transactions.insert_one(transaction)

async def redeem_points(customer_id: str, points: int, reward_name: str) -> bool:
    """Redeem points for a reward"""
    customer = await db.customers.find_one({"id": customer_id})
    if not customer or customer.get("loyalty_points", 0) < points:
        return False
    
    await add_points_to_customer(
        customer_id=customer_id,
        points=-points,
        point_type="redeemed",
        description=f"Eingelöst: {reward_name}"
    )
    return True

def generate_customer_qr_data(customer_id: str) -> str:
    """Generate QR code data for customer loyalty card"""
    import hashlib
    checksum = hashlib.sha256(f"{customer_id}{JWT_SECRET[:8]}".encode()).hexdigest()[:8]
    return f"LEI-LOYALTY:{customer_id}:{checksum}"

def verify_customer_qr_data(qr_data: str) -> Optional[str]:
    """Verify QR code data and return customer ID if valid"""
    import hashlib
    try:
        if not qr_data.startswith("LEI-LOYALTY:"):
            return None
        parts = qr_data.split(":")
        if len(parts) != 3:
            return None
        customer_id = parts[1]
        checksum = parts[2]
        expected_checksum = hashlib.sha256(f"{customer_id}{JWT_SECRET[:8]}".encode()).hexdigest()[:8]
        if checksum != expected_checksum:
            return None
        return customer_id
    except:
        return None

# ============ PUBLIC ENDPOINTS ============

@router.get("/loyalty/settings")
async def get_loyalty_settings_endpoint():
    """Get loyalty program settings (public)"""
    settings = await get_loyalty_settings()
    return {
        "enabled": settings.get("enabled", True),
        "points_per_euro": settings.get("points_per_euro", 1.0),
        "rewards": [r for r in settings.get("rewards", []) if r.get("is_active", True)]
    }

# ============ ADMIN ENDPOINTS ============

@router.get("/loyalty/settings/admin")
async def get_loyalty_settings_admin(username: str = Depends(verify_admin_token)):
    """Get full loyalty settings (admin only)"""
    return await get_loyalty_settings()

@router.put("/loyalty/settings")
async def update_loyalty_settings(settings: dict, username: str = Depends(verify_admin_token)):
    """Update loyalty program settings"""
    settings["id"] = "loyalty_settings"
    await db.loyalty_settings.update_one(
        {"id": "loyalty_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"message": "Einstellungen gespeichert"}

# ============ CUSTOMER ENDPOINTS ============

@router.get("/customers/me/loyalty")
async def get_customer_loyalty(customer: dict = Depends(verify_customer_token)):
    """Get customer loyalty info including QR code data"""
    customer_data = await db.customers.find_one({"id": customer["id"]}, {"_id": 0, "password_hash": 0})
    if not customer_data:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    settings = await get_loyalty_settings()
    
    recent_transactions = await db.points_transactions.find(
        {"customer_id": customer["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "loyalty_points": customer_data.get("loyalty_points", 0),
        "lifetime_points": customer_data.get("lifetime_points", 0),
        "qr_code_data": generate_customer_qr_data(customer["id"]),
        "points_per_euro": settings.get("points_per_euro", 1.0),
        "rewards": [r for r in settings.get("rewards", []) if r.get("is_active", True)],
        "recent_transactions": recent_transactions
    }

@router.post("/customers/me/redeem")
async def redeem_customer_reward(reward_id: str, customer: dict = Depends(verify_customer_token)):
    """Redeem a reward using points"""
    settings = await get_loyalty_settings()
    reward = next((r for r in settings.get("rewards", []) if r.get("id") == reward_id and r.get("is_active")), None)
    
    if not reward:
        raise HTTPException(status_code=404, detail="Prämie nicht gefunden")
    
    customer_data = await db.customers.find_one({"id": customer["id"]})
    if not customer_data:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    if customer_data.get("loyalty_points", 0) < reward["points_required"]:
        raise HTTPException(status_code=400, detail="Nicht genügend Punkte")
    
    success = await redeem_points(customer["id"], reward["points_required"], reward["name"])
    if not success:
        raise HTTPException(status_code=400, detail="Einlösung fehlgeschlagen")
    
    return {
        "message": f"Erfolgreich eingelöst: {reward['name']}",
        "points_used": reward["points_required"],
        "remaining_points": customer_data.get("loyalty_points", 0) - reward["points_required"]
    }

# ============ STAFF ENDPOINTS ============

@router.post("/staff/loyalty/scan")
async def staff_scan_customer_qr(qr_data: str, role: str = Depends(verify_staff_token)):
    """Staff scans customer QR code to get customer info"""
    customer_id = verify_customer_qr_data(qr_data)
    if not customer_id:
        raise HTTPException(status_code=400, detail="Ungültiger QR-Code")
    
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    return {
        "id": customer["id"],
        "name": customer.get("name"),
        "email": customer.get("email"),
        "phone": customer.get("phone"),
        "loyalty_points": customer.get("loyalty_points", 0),
        "lifetime_points": customer.get("lifetime_points", 0),
        "total_orders": customer.get("total_orders", 0),
        "total_spent": customer.get("total_spent", 0.0)
    }

@router.post("/staff/loyalty/add-points")
async def staff_add_points(data: AddPointsRequest, role: str = Depends(verify_staff_token)):
    """Staff adds points for in-store purchase"""
    customer = await db.customers.find_one({"id": data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    points_earned = await calculate_points_for_purchase(data.purchase_amount)
    if points_earned <= 0:
        raise HTTPException(status_code=400, detail="Keine Punkte für diesen Betrag")
    
    await add_points_to_customer(
        customer_id=data.customer_id,
        points=points_earned,
        point_type="earned_instore",
        description=f"{data.description} ({data.purchase_amount:.2f}€)",
        staff_id=role
    )
    
    updated_customer = await db.customers.find_one({"id": data.customer_id})
    
    return {
        "message": f"{points_earned} Punkte gutgeschrieben",
        "points_added": points_earned,
        "new_total": updated_customer.get("loyalty_points", 0),
        "customer_name": customer.get("name")
    }

@router.get("/staff/loyalty/search")
async def staff_search_customer(query: str, role: str = Depends(verify_staff_token)):
    """Staff searches for customer by name, email or phone"""
    customers = await db.customers.find({
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"phone": {"$regex": query, "$options": "i"}}
        ]
    }, {"_id": 0, "password_hash": 0}).limit(10).to_list(10)
    
    return [
        {
            "id": c["id"],
            "name": c.get("name"),
            "email": c.get("email"),
            "phone": c.get("phone"),
            "loyalty_points": c.get("loyalty_points", 0)
        }
        for c in customers
    ]
