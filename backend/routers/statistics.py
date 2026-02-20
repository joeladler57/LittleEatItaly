"""
Statistics Router - Dashboard-Statistiken für Admin-Bereich
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
from .shared import db, verify_admin_token

router = APIRouter(prefix="/statistics", tags=["Statistics"])

def get_date_range(period: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get date range based on period or custom dates"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if period == "custom" and start_date and end_date:
        return start_date, end_date
    elif period == "today":
        return today.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
    elif period == "week":
        week_start = today - timedelta(days=today.weekday())
        return week_start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
    elif period == "month":
        month_start = today.replace(day=1)
        return month_start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
    elif period == "year":
        year_start = today.replace(month=1, day=1)
        return year_start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
    else:
        return today.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")


@router.get("/overview")
async def get_statistics_overview(
    period: str = Query("week", enum=["today", "week", "month", "year", "custom"]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: str = Depends(verify_admin_token)
):
    """Get overview statistics for the dashboard"""
    date_from, date_to = get_date_range(period, start_date, end_date)
    
    # Build date query for orders (created_at is ISO string)
    order_query = {
        "created_at": {
            "$gte": f"{date_from}T00:00:00",
            "$lte": f"{date_to}T23:59:59"
        },
        "status": {"$nin": ["cancelled"]}
    }
    
    # Get orders
    orders = await db.orders.find(order_query, {"_id": 0}).to_list(10000)
    
    # Calculate order statistics
    total_orders = len(orders)
    total_revenue = sum(float(o.get("total", 0)) for o in orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Get reservations
    reservation_query = {
        "date": {
            "$gte": date_from,
            "$lte": date_to
        }
    }
    reservations = await db.reservations.find(reservation_query, {"_id": 0}).to_list(10000)
    
    total_reservations = len(reservations)
    total_guests = sum(int(r.get("guests", 0)) for r in reservations)
    avg_guests = total_guests / total_reservations if total_reservations > 0 else 0
    
    # No-show rate
    no_shows = len([r for r in reservations if r.get("status") == "no_show"])
    no_show_rate = (no_shows / total_reservations * 100) if total_reservations > 0 else 0
    
    # Completed reservations
    completed_reservations = len([r for r in reservations if r.get("status") == "completed"])
    
    return {
        "period": period,
        "date_range": {"from": date_from, "to": date_to},
        "orders": {
            "total": total_orders,
            "revenue": round(total_revenue, 2),
            "average_value": round(avg_order_value, 2)
        },
        "reservations": {
            "total": total_reservations,
            "completed": completed_reservations,
            "no_shows": no_shows,
            "no_show_rate": round(no_show_rate, 1),
            "total_guests": total_guests,
            "average_guests": round(avg_guests, 1)
        }
    }


@router.get("/revenue-comparison")
async def get_revenue_comparison(admin: str = Depends(verify_admin_token)):
    """Get revenue comparison: this week vs last week, this month vs last month"""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # This week
    this_week_start = today - timedelta(days=today.weekday())
    this_week_end = today
    
    # Last week  
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start - timedelta(days=1)
    
    # This month
    this_month_start = today.replace(day=1)
    this_month_end = today
    
    # Last month
    last_month_end = this_month_start - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    
    async def get_revenue(start: datetime, end: datetime) -> float:
        query = {
            "created_at": {
                "$gte": start.strftime("%Y-%m-%dT00:00:00"),
                "$lte": end.strftime("%Y-%m-%dT23:59:59")
            },
            "status": {"$nin": ["cancelled"]}
        }
        orders = await db.orders.find(query, {"total": 1}).to_list(10000)
        return sum(float(o.get("total", 0)) for o in orders)
    
    this_week_revenue = await get_revenue(this_week_start, this_week_end)
    last_week_revenue = await get_revenue(last_week_start, last_week_end)
    this_month_revenue = await get_revenue(this_month_start, this_month_end)
    last_month_revenue = await get_revenue(last_month_start, last_month_end)
    
    # Calculate percentage changes
    week_change = ((this_week_revenue - last_week_revenue) / last_week_revenue * 100) if last_week_revenue > 0 else 0
    month_change = ((this_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0
    
    return {
        "week": {
            "current": round(this_week_revenue, 2),
            "previous": round(last_week_revenue, 2),
            "change_percent": round(week_change, 1)
        },
        "month": {
            "current": round(this_month_revenue, 2),
            "previous": round(last_month_revenue, 2),
            "change_percent": round(month_change, 1)
        }
    }


@router.get("/top-items")
async def get_top_items(
    period: str = Query("week", enum=["today", "week", "month", "year", "custom"]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 10,
    admin: str = Depends(verify_admin_token)
):
    """Get top selling items"""
    date_from, date_to = get_date_range(period, start_date, end_date)
    
    order_query = {
        "created_at": {
            "$gte": f"{date_from}T00:00:00",
            "$lte": f"{date_to}T23:59:59"
        },
        "status": {"$nin": ["cancelled"]}
    }
    
    orders = await db.orders.find(order_query, {"_id": 0, "items": 1}).to_list(10000)
    
    # Count items
    item_counts = {}
    item_revenue = {}
    
    for order in orders:
        for item in order.get("items", []):
            name = item.get("name", "Unbekannt")
            quantity = int(item.get("quantity", 1))
            price = float(item.get("price", 0))
            
            if name not in item_counts:
                item_counts[name] = 0
                item_revenue[name] = 0
            
            item_counts[name] += quantity
            item_revenue[name] += price * quantity
    
    # Sort by count
    top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    return [
        {
            "name": name,
            "quantity": count,
            "revenue": round(item_revenue[name], 2)
        }
        for name, count in top_items
    ]


@router.get("/orders-by-day")
async def get_orders_by_day(
    period: str = Query("week", enum=["today", "week", "month", "year", "custom"]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: str = Depends(verify_admin_token)
):
    """Get orders grouped by day"""
    date_from, date_to = get_date_range(period, start_date, end_date)
    
    order_query = {
        "created_at": {
            "$gte": f"{date_from}T00:00:00",
            "$lte": f"{date_to}T23:59:59"
        },
        "status": {"$nin": ["cancelled"]}
    }
    
    orders = await db.orders.find(order_query, {"_id": 0, "created_at": 1, "total": 1}).to_list(10000)
    
    # Group by date
    daily_data = {}
    
    for order in orders:
        created_at = order.get("created_at", "")
        date = created_at[:10] if created_at else "unknown"
        
        if date not in daily_data:
            daily_data[date] = {"orders": 0, "revenue": 0}
        
        daily_data[date]["orders"] += 1
        daily_data[date]["revenue"] += float(order.get("total", 0))
    
    # Sort by date
    sorted_data = sorted(daily_data.items(), key=lambda x: x[0])
    
    return [
        {
            "date": date,
            "orders": data["orders"],
            "revenue": round(data["revenue"], 2)
        }
        for date, data in sorted_data
    ]


@router.get("/peak-hours")
async def get_peak_hours(
    period: str = Query("week", enum=["today", "week", "month", "year", "custom"]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: str = Depends(verify_admin_token)
):
    """Get peak hours analysis for orders and reservations"""
    date_from, date_to = get_date_range(period, start_date, end_date)
    
    # Orders by hour
    order_query = {
        "created_at": {
            "$gte": f"{date_from}T00:00:00",
            "$lte": f"{date_to}T23:59:59"
        },
        "status": {"$nin": ["cancelled"]}
    }
    
    orders = await db.orders.find(order_query, {"_id": 0, "created_at": 1}).to_list(10000)
    
    order_hours = {}
    for order in orders:
        created_at = order.get("created_at", "")
        if len(created_at) >= 13:
            hour = created_at[11:13]
            order_hours[hour] = order_hours.get(hour, 0) + 1
    
    # Reservations by hour
    reservation_query = {
        "date": {
            "$gte": date_from,
            "$lte": date_to
        }
    }
    
    reservations = await db.reservations.find(reservation_query, {"_id": 0, "time": 1, "guests": 1}).to_list(10000)
    
    reservation_hours = {}
    guest_hours = {}
    for res in reservations:
        time = res.get("time", "")
        if len(time) >= 2:
            hour = time[:2]
            reservation_hours[hour] = reservation_hours.get(hour, 0) + 1
            guest_hours[hour] = guest_hours.get(hour, 0) + int(res.get("guests", 0))
    
    # Build hourly data (11:00 - 00:00)
    hours_range = [f"{h:02d}" for h in list(range(11, 24)) + [0]]
    
    hourly_data = []
    for hour in hours_range:
        hourly_data.append({
            "hour": f"{hour}:00",
            "orders": order_hours.get(hour, 0),
            "reservations": reservation_hours.get(hour, 0),
            "guests": guest_hours.get(hour, 0)
        })
    
    # Find peak hours
    peak_order_hour = max(order_hours.items(), key=lambda x: x[1])[0] if order_hours else "N/A"
    peak_reservation_hour = max(reservation_hours.items(), key=lambda x: x[1])[0] if reservation_hours else "N/A"
    
    return {
        "hourly_data": hourly_data,
        "peak_order_hour": f"{peak_order_hour}:00" if peak_order_hour != "N/A" else "N/A",
        "peak_reservation_hour": f"{peak_reservation_hour}:00" if peak_reservation_hour != "N/A" else "N/A"
    }


@router.get("/reservations-by-day")
async def get_reservations_by_day(
    period: str = Query("week", enum=["today", "week", "month", "year", "custom"]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: str = Depends(verify_admin_token)
):
    """Get reservations grouped by day"""
    date_from, date_to = get_date_range(period, start_date, end_date)
    
    reservation_query = {
        "date": {
            "$gte": date_from,
            "$lte": date_to
        }
    }
    
    reservations = await db.reservations.find(reservation_query, {"_id": 0}).to_list(10000)
    
    # Group by date
    daily_data = {}
    
    for res in reservations:
        date = res.get("date", "unknown")
        status = res.get("status", "pending")
        guests = int(res.get("guests", 0))
        
        if date not in daily_data:
            daily_data[date] = {"total": 0, "completed": 0, "no_show": 0, "guests": 0}
        
        daily_data[date]["total"] += 1
        daily_data[date]["guests"] += guests
        
        if status == "completed":
            daily_data[date]["completed"] += 1
        elif status == "no_show":
            daily_data[date]["no_show"] += 1
    
    # Sort by date
    sorted_data = sorted(daily_data.items(), key=lambda x: x[0])
    
    return [
        {
            "date": date,
            "total": data["total"],
            "completed": data["completed"],
            "no_show": data["no_show"],
            "guests": data["guests"]
        }
        for date, data in sorted_data
    ]
