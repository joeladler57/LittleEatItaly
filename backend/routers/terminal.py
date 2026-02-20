"""
Terminal Router - Kellner-Terminal, Tische, Bestellungen
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import jwt
import os

from .database import db
from .shared import JWT_SECRET

router = APIRouter(prefix="/terminal", tags=["terminal"])
security = HTTPBearer()

# ============ MODELS ============

class TerminalTable(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: str
    description: Optional[str] = None
    active: bool = True

class TerminalWaiter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin: str
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TerminalMenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = "Hauptspeise"
    price: float
    addons: List[str] = []
    active: bool = True
    sort_order: int = 0

class TerminalOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: int
    table_number: str
    waiter_id: str
    waiter_name: str
    items: List[Dict[str, Any]]
    total: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PrintJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    order_number: int
    order_data: Dict[str, Any]
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ AUTH HELPERS ============

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify admin JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub", "admin")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ WAITER LOGIN ============

@router.post("/login")
async def terminal_waiter_login(data: dict):
    """Login waiter with PIN"""
    pin = data.get("pin", "")
    if len(pin) != 4:
        raise HTTPException(status_code=400, detail="PIN muss 4 Ziffern haben")
    
    waiter = await db.terminal_waiters.find_one({"pin": pin, "active": True}, {"_id": 0})
    if not waiter:
        raise HTTPException(status_code=401, detail="Ungültiger PIN")
    
    token_data = {
        "sub": waiter["id"],
        "name": waiter["name"],
        "role": "waiter",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12)
    }
    token = jwt.encode(token_data, JWT_SECRET, algorithm="HS256")
    
    return {
        "access_token": token,
        "waiter_id": waiter["id"],
        "waiter_name": waiter["name"]
    }

# ============ TABLES ============

@router.get("/tables")
async def get_terminal_tables():
    """Get all active tables"""
    tables = await db.terminal_tables.find({"active": True}, {"_id": 0}).sort("number", 1).to_list(100)
    return tables

@router.post("/tables")
async def create_terminal_table(data: dict, role: str = Depends(verify_admin_token)):
    """Create a new table"""
    table = TerminalTable(
        number=data.get("number", ""),
        description=data.get("description"),
        active=data.get("active", True)
    )
    await db.terminal_tables.insert_one(table.model_dump())
    return {"message": "Table created", "table": table.model_dump()}

@router.put("/tables/{table_id}")
async def update_terminal_table(table_id: str, data: dict, role: str = Depends(verify_admin_token)):
    """Update a table"""
    update_data = {k: v for k, v in data.items() if k in ["number", "description", "active"]}
    await db.terminal_tables.update_one({"id": table_id}, {"$set": update_data})
    return {"message": "Table updated"}

@router.delete("/tables/{table_id}")
async def delete_terminal_table(table_id: str, role: str = Depends(verify_admin_token)):
    """Delete a table"""
    await db.terminal_tables.delete_one({"id": table_id})
    return {"message": "Table deleted"}

# ============ WAITERS (Admin) ============

@router.get("/waiters")
async def get_terminal_waiters(role: str = Depends(verify_admin_token)):
    """Get all waiters"""
    waiters = await db.terminal_waiters.find({}, {"_id": 0}).to_list(100)
    return waiters

@router.post("/waiters")
async def create_terminal_waiter(data: dict, role: str = Depends(verify_admin_token)):
    """Create a new waiter"""
    existing = await db.terminal_waiters.find_one({"pin": data.get("pin")})
    if existing:
        raise HTTPException(status_code=400, detail="PIN bereits vergeben")
    
    waiter = TerminalWaiter(
        name=data.get("name", ""),
        pin=data.get("pin", ""),
        active=data.get("active", True)
    )
    waiter_dict = waiter.model_dump()
    waiter_dict["created_at"] = waiter_dict["created_at"].isoformat()
    await db.terminal_waiters.insert_one(waiter_dict)
    return {"message": "Waiter created", "waiter_id": waiter.id}

@router.put("/waiters/{waiter_id}")
async def update_terminal_waiter(waiter_id: str, data: dict, role: str = Depends(verify_admin_token)):
    """Update a waiter"""
    if "pin" in data:
        existing = await db.terminal_waiters.find_one({"pin": data["pin"], "id": {"$ne": waiter_id}})
        if existing:
            raise HTTPException(status_code=400, detail="PIN bereits vergeben")
    
    update_data = {k: v for k, v in data.items() if k in ["name", "pin", "active"]}
    await db.terminal_waiters.update_one({"id": waiter_id}, {"$set": update_data})
    return {"message": "Waiter updated"}

@router.delete("/waiters/{waiter_id}")
async def delete_terminal_waiter(waiter_id: str, role: str = Depends(verify_admin_token)):
    """Delete a waiter"""
    await db.terminal_waiters.delete_one({"id": waiter_id})
    return {"message": "Waiter deleted"}

# ============ MENU ============

@router.get("/menu")
async def get_terminal_menu():
    """Get terminal menu items"""
    items = await db.terminal_menu.find({"active": True}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return items

@router.get("/menu/all")
async def get_all_terminal_menu(role: str = Depends(verify_admin_token)):
    """Get all terminal menu items including inactive"""
    items = await db.terminal_menu.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return items

@router.post("/menu")
async def create_terminal_menu_item(data: dict, role: str = Depends(verify_admin_token)):
    """Create a new menu item"""
    item = TerminalMenuItem(
        name=data.get("name", ""),
        category=data.get("category", "Hauptspeise"),
        price=float(data.get("price", 0)),
        addons=data.get("addons", []),
        active=data.get("active", True),
        sort_order=data.get("sort_order", 0)
    )
    await db.terminal_menu.insert_one(item.model_dump())
    return {"message": "Menu item created", "item_id": item.id}

@router.put("/menu/{item_id}")
async def update_terminal_menu_item(item_id: str, data: dict, role: str = Depends(verify_admin_token)):
    """Update a menu item"""
    update_data = {}
    for k in ["name", "category", "price", "addons", "active", "sort_order"]:
        if k in data:
            update_data[k] = data[k]
    await db.terminal_menu.update_one({"id": item_id}, {"$set": update_data})
    return {"message": "Menu item updated"}

@router.delete("/menu/{item_id}")
async def delete_terminal_menu_item(item_id: str, role: str = Depends(verify_admin_token)):
    """Delete a menu item"""
    await db.terminal_menu.delete_one({"id": item_id})
    return {"message": "Menu item deleted"}

# ============ ADDON GROUPS ============

@router.get("/addon-groups")
async def get_terminal_addon_groups():
    """Get all terminal addon groups"""
    groups = await db.terminal_addon_groups.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return groups

@router.post("/addon-groups")
async def create_terminal_addon_group(data: dict, role: str = Depends(verify_admin_token)):
    """Create a new addon group"""
    group = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", ""),
        "options": data.get("options", []),
        "required": data.get("required", False),
        "multi_select": data.get("multi_select", True),
        "sort_order": data.get("sort_order", 0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.terminal_addon_groups.insert_one(group)
    return {"message": "Addon group created", "group_id": group["id"]}

@router.put("/addon-groups/{group_id}")
async def update_terminal_addon_group(group_id: str, data: dict, role: str = Depends(verify_admin_token)):
    """Update an addon group"""
    update_data = {}
    for k in ["name", "options", "required", "multi_select", "sort_order"]:
        if k in data:
            update_data[k] = data[k]
    await db.terminal_addon_groups.update_one({"id": group_id}, {"$set": update_data})
    return {"message": "Addon group updated"}

@router.delete("/addon-groups/{group_id}")
async def delete_terminal_addon_group(group_id: str, role: str = Depends(verify_admin_token)):
    """Delete an addon group"""
    await db.terminal_addon_groups.delete_one({"id": group_id})
    await db.terminal_categories.update_many({}, {"$pull": {"addon_group_ids": group_id}})
    return {"message": "Addon group deleted"}

# ============ CATEGORIES ============

@router.get("/categories")
async def get_terminal_categories():
    """Get unique categories from terminal menu with addon groups"""
    db_categories = await db.terminal_categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(100)
    db_cat_names = [c["name"] for c in db_categories]
    
    items = await db.terminal_menu.find({"active": True}, {"category": 1}).to_list(500)
    item_categories = list(set([item.get("category", "Sonstiges") for item in items]))
    
    order = ["Vorspeise", "Hauptspeise", "Pizza", "Pasta", "Salat", "Nachspeise", "Getränke", "Sonstiges"]
    
    result = []
    for cat in db_categories:
        result.append(cat)
    
    for cat_name in item_categories:
        if cat_name not in db_cat_names:
            result.append({"name": cat_name, "addon_group_ids": [], "sort_order": order.index(cat_name) if cat_name in order else 999})
    
    result.sort(key=lambda x: x.get("sort_order", order.index(x["name"]) if x["name"] in order else 999))
    return result

@router.get("/categories/names")
async def get_terminal_category_names():
    """Get just category names for simple lists"""
    items = await db.terminal_menu.find({"active": True}, {"category": 1}).to_list(500)
    categories = list(set([item.get("category", "Sonstiges") for item in items]))
    order = ["Vorspeise", "Hauptspeise", "Pizza", "Pasta", "Salat", "Nachspeise", "Getränke", "Sonstiges"]
    categories.sort(key=lambda x: order.index(x) if x in order else 999)
    return categories

@router.put("/categories/{category_name}")
async def update_terminal_category(category_name: str, data: dict, role: str = Depends(verify_admin_token)):
    """Update a category's addon groups"""
    existing = await db.terminal_categories.find_one({"name": category_name})
    if existing:
        await db.terminal_categories.update_one(
            {"name": category_name},
            {"$set": {"addon_group_ids": data.get("addon_group_ids", [])}}
        )
    else:
        await db.terminal_categories.insert_one({
            "name": category_name,
            "addon_group_ids": data.get("addon_group_ids", []),
            "sort_order": data.get("sort_order", 0)
        })
    return {"message": "Category updated"}

# ============ ORDERS ============

async def get_next_terminal_order_number():
    """Get next terminal order number for today"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    last_order = await db.terminal_orders.find_one(
        {"created_at": {"$regex": f"^{today}"}},
        sort=[("order_number", -1)]
    )
    return (last_order.get("order_number", 0) + 1) if last_order else 1

@router.post("/orders")
async def create_terminal_order(data: dict):
    """Create a new terminal order and add to print queue"""
    waiter_id = data.get("waiter_id", "")
    waiter_name = data.get("waiter_name", "")
    
    order_number = await get_next_terminal_order_number()
    
    total = 0.0
    for item in data.get("items", []):
        item_total = float(item.get("price", 0)) * int(item.get("quantity", 1))
        for addon in item.get("addons", []):
            item_total += float(addon.get("price", 0)) * int(item.get("quantity", 1))
        total += item_total
    
    order = TerminalOrder(
        order_number=order_number,
        table_number=data.get("table_number", ""),
        waiter_id=waiter_id,
        waiter_name=waiter_name,
        items=data.get("items", []),
        total=total,
        status="pending"
    )
    
    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    await db.terminal_orders.insert_one(order_dict)
    
    # Add to print queue
    job = PrintJob(
        order_id=order.id,
        order_number=order_number,
        order_data={
            "type": "terminal",
            "order_number": order_number,
            "table_number": order.table_number,
            "waiter_name": waiter_name,
            "items": order.items,
            "total": total,
            "created_at": order_dict["created_at"]
        }
    )
    job_dict = job.model_dump()
    job_dict["created_at"] = job_dict["created_at"].isoformat()
    await db.print_queue.insert_one(job_dict)
    
    return {
        "message": "Order created",
        "order_id": order.id,
        "order_number": order_number,
        "total": total
    }

@router.get("/orders")
async def get_terminal_orders(status: Optional[str] = None):
    """Get terminal orders"""
    query = {}
    if status:
        query["status"] = status
    orders = await db.terminal_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@router.get("/orders/today")
async def get_today_terminal_orders():
    """Get today's terminal orders"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    orders = await db.terminal_orders.find(
        {"created_at": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return orders

# ============ SETTINGS ============

@router.get("/settings")
async def get_terminal_settings():
    """Get terminal-specific settings"""
    settings = await db.terminal_settings.find_one({"id": "terminal_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "terminal_settings",
            "quick_amounts": [5, 10, 20, 50],
            "default_tip_percent": 10,
            "require_table": True,
            "auto_print": True
        }
    return settings

@router.put("/settings")
async def update_terminal_settings(data: dict, role: str = Depends(verify_admin_token)):
    """Update terminal settings"""
    data["id"] = "terminal_settings"
    await db.terminal_settings.update_one(
        {"id": "terminal_settings"},
        {"$set": data},
        upsert=True
    )
    return {"message": "Settings updated"}
