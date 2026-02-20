"""
Staff Router - Personal-Bereich, Bestellungen, Reservierungen
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import jwt
import asyncio
import logging
import uuid

from .database import db
from .shared import JWT_SECRET, JWT_ALGORITHM, ShopSettings

router = APIRouter(prefix="/staff", tags=["staff"])
security = HTTPBearer()

# ============ MODELS ============

class StaffPinLogin(BaseModel):
    pin: str

class StaffTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 43200

# ============ HELPERS ============

def create_staff_token() -> str:
    """Create JWT token for staff"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=12)
    payload = {
        "sub": "staff",
        "role": "staff",
        "exp": expiration,
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

# Import email functions (will be defined in server.py or separate module)
# These are placeholders - the actual functions are in server.py
async def send_order_status_email(order, settings, status, pickup_time=None):
    pass

async def send_reservation_confirmation_email(reservation, settings, confirmed=False):
    pass

async def print_order_receipt(order, settings):
    return {"success": False}

# ============ AUTH ============

@router.post("/login", response_model=StaffTokenResponse)
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

@router.get("/verify")
async def verify_staff_session(role: str = Depends(verify_staff_token)):
    """Verify staff session"""
    return {"valid": True, "role": role}

# ============ ORDERS ============

@router.get("/orders")
async def get_staff_orders(status: Optional[str] = None, role: str = Depends(verify_staff_token)):
    """Get orders for staff view"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@router.put("/orders/{order_id}/status")
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
    
    pickup_time = None
    if status == "confirmed" and order.get("pickup_time") == "So schnell wie möglich" and prep_time_minutes:
        pickup_time = (datetime.now(timezone.utc) + timedelta(minutes=prep_time_minutes)).strftime("%H:%M")
        update_data["confirmed_pickup_time"] = pickup_time
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    settings = await db.shop_settings.find_one({"id": "shop_settings"}, {"_id": 0})
    if not settings:
        settings = ShopSettings().model_dump()
    
    if status == "confirmed":
        updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        # Email and print handled by server.py hooks
        
        if settings.get("printer_enabled") and settings.get("auto_print_on_accept"):
            try:
                print_result = await print_order_receipt(updated_order, settings)
                if print_result.get("success"):
                    await db.print_queue.insert_one({
                        "id": str(uuid.uuid4()),
                        "order_id": order_id,
                        "order_number": updated_order.get("order_number", 0),
                        "order_data": updated_order,
                        "status": "completed",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "printed_at": datetime.now(timezone.utc).isoformat()
                    })
                    logging.info(f"Auto-printed order #{updated_order.get('order_number')}")
            except Exception as e:
                logging.error(f"Auto-print failed: {e}")
    
    return {"message": f"Status updated to {status}", "pickup_time": pickup_time}

# ============ RESERVATIONS ============

@router.get("/reservations")
async def get_staff_reservations(status: Optional[str] = None, date: Optional[str] = None, role: str = Depends(verify_staff_token)):
    """Get reservations for staff view"""
    query = {}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return reservations

@router.put("/reservations/{reservation_id}/status")
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
    
    return {"message": f"Status updated to {status}"}

# ============ LOYALTY (Staff) ============

@router.get("/loyalty/search")
async def search_customers_for_loyalty(query: str, role: str = Depends(verify_staff_token)):
    """Search customers by name, email, or phone for loyalty"""
    if len(query) < 2:
        return []
    
    search_filter = {
        "$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"phone": {"$regex": query, "$options": "i"}}
        ]
    }
    
    customers = await db.customers.find(
        search_filter,
        {"_id": 0, "password_hash": 0}
    ).limit(20).to_list(20)
    
    return customers

@router.post("/loyalty/scan")
async def scan_loyalty_qr(qr_data: str, role: str = Depends(verify_staff_token)):
    """Scan customer loyalty QR code"""
    import hashlib
    
    if not qr_data.startswith("LEI-LOYALTY:"):
        raise HTTPException(status_code=400, detail="Ungültiger QR-Code Format")
    
    parts = qr_data.split(":")
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Ungültiger QR-Code")
    
    customer_id = parts[1]
    checksum = parts[2]
    
    expected_checksum = hashlib.sha256(f"{customer_id}{JWT_SECRET[:8]}".encode()).hexdigest()[:8]
    if checksum != expected_checksum:
        raise HTTPException(status_code=400, detail="Ungültiger QR-Code Prüfsumme")
    
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    return customer

@router.post("/loyalty/add-points")
async def staff_add_loyalty_points(data: dict, role: str = Depends(verify_staff_token)):
    """Staff adds loyalty points for in-store purchase"""
    customer_id = data.get("customer_id")
    purchase_amount = float(data.get("purchase_amount", 0))
    description = data.get("description", "Vor-Ort-Verzehr")
    
    if not customer_id or purchase_amount <= 0:
        raise HTTPException(status_code=400, detail="Kunden-ID und Betrag erforderlich")
    
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    # Get loyalty settings
    settings = await db.loyalty_settings.find_one({"id": "loyalty_settings"}, {"_id": 0})
    if not settings or not settings.get("enabled", True):
        raise HTTPException(status_code=400, detail="Treueprogramm ist deaktiviert")
    
    points_per_euro = settings.get("points_per_euro", 1.0)
    points = int(purchase_amount * points_per_euro)
    
    if points <= 0:
        raise HTTPException(status_code=400, detail="Keine Punkte zu vergeben")
    
    # Add points
    transaction = {
        "id": str(uuid.uuid4()),
        "amount": points,
        "type": "earned_instore",
        "description": f"{description} ({purchase_amount:.2f}€)",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$inc": {"loyalty_points": points, "lifetime_points": points},
            "$push": {"points_history": {"$each": [transaction], "$slice": -100}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0, "loyalty_points": 1})
    
    return {
        "message": f"{points} Punkte hinzugefügt",
        "points_added": points,
        "new_total": updated.get("loyalty_points", 0)
    }
