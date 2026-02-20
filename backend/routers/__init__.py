"""
Routers package for Little Eat Italy
"""
from .loyalty import router as loyalty_router
from .customers import router as customers_router
from .terminal import router as terminal_router
from .staff import router as staff_router
from .statistics import router as statistics_router

# Export functions that are used by main server.py
from .customers import (
    find_or_create_customer_record,
    update_customer_order_stats,
    update_customer_reservation_stats,
    get_customer_info
)

from .loyalty import (
    get_loyalty_settings,
    calculate_points_for_purchase,
    add_points_to_customer,
    redeem_points,
    generate_customer_qr_data,
    verify_customer_qr_data
)

from .shared import (
    db,
    security,
    JWT_SECRET,
    JWT_ALGORITHM,
    hash_password,
    verify_password,
    create_token,
    verify_token,
    verify_admin_token,
    verify_staff_token,
    verify_customer_token,
    create_customer_token,
    get_or_create_admin,
    DEFAULT_ADMIN_USERNAME,
    DEFAULT_ADMIN_PASSWORD,
    ShopSettings
)

__all__ = [
    # Routers
    'loyalty_router',
    'customers_router',
    'terminal_router',
    'staff_router',
    # Customer functions
    'find_or_create_customer_record',
    'update_customer_order_stats',
    'update_customer_reservation_stats',
    'get_customer_info',
    # Loyalty functions
    'get_loyalty_settings',
    'calculate_points_for_purchase',
    'add_points_to_customer',
    'redeem_points',
    'generate_customer_qr_data',
    'verify_customer_qr_data',
    # Auth
    'db',
    'security',
    'JWT_SECRET',
    'JWT_ALGORITHM',
    'hash_password',
    'verify_password',
    'create_token',
    'verify_token',
    'verify_admin_token',
    'verify_staff_token',
    'verify_customer_token',
    'create_customer_token',
    'get_or_create_admin',
    'DEFAULT_ADMIN_USERNAME',
    'DEFAULT_ADMIN_PASSWORD',
    'ShopSettings'
]
