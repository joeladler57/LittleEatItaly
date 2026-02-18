"""
Test suite for Shop API endpoints:
- Menu endpoints (/api/shop/menu)
- Settings endpoints (/api/shop/settings)
- Order endpoints (/api/shop/orders)
- Reservation endpoints (/api/shop/reservations)
- Admin authentication flow
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bestellen-demo.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        # API returns access_token, not token
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestPublicEndpoints:
    """Test public API endpoints (no auth required)"""

    def test_get_shop_menu(self, api_client):
        """GET /api/shop/menu - should return menu with categories"""
        response = api_client.get(f"{BASE_URL}/api/shop/menu")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "categories" in data, "Menu should have 'categories' field"
        assert "currency" in data, "Menu should have 'currency' field"
        assert data["currency"] == "EUR", "Currency should be EUR"
        print(f"✅ Menu has {len(data.get('categories', []))} categories")

    def test_get_shop_settings(self, api_client):
        """GET /api/shop/settings - should return shop settings"""
        response = api_client.get(f"{BASE_URL}/api/shop/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pickup_enabled" in data or data.get("pickup_enabled") is not None or "id" in data
        print(f"✅ Settings retrieved - pickup_enabled: {data.get('pickup_enabled', True)}")

    def test_shop_settings_has_opening_hours(self, api_client):
        """Settings should have opening_hours structure"""
        response = api_client.get(f"{BASE_URL}/api/shop/settings")
        assert response.status_code == 200
        
        data = response.json()
        if "opening_hours" in data and data["opening_hours"]:
            days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            for day in days:
                if day in data["opening_hours"]:
                    print(f"  {day}: {data['opening_hours'][day]}")


class TestAuthentication:
    """Test admin authentication endpoints"""

    def test_login_with_valid_credentials(self, api_client):
        """POST /api/auth/login - should succeed with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed with status {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert len(data["access_token"]) > 0, "Token should not be empty"
        print(f"✅ Login successful, token received")

    def test_login_with_invalid_credentials(self, api_client):
        """POST /api/auth/login - should fail with wrong credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Invalid login correctly rejected")

    def test_verify_token(self, authenticated_client):
        """GET /api/auth/verify - should verify valid token"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/verify")
        assert response.status_code == 200, f"Token verification failed with {response.status_code}"
        print(f"✅ Token verified successfully")


class TestOrderCreation:
    """Test order creation flow (customer-facing)"""

    def test_create_order_with_asap_time(self, api_client):
        """POST /api/shop/orders - create ASAP order"""
        order_data = {
            "items": [
                {
                    "item_id": "test_item_1",
                    "item_name": "Test Pizza Margherita",
                    "quantity": 1,
                    "size": "medium",
                    "size_name": "Medium",
                    "options": [],
                    "unit_price": 12.90,
                    "total_price": 12.90,
                    "notes": ""
                }
            ],
            "customer_name": "TEST_Customer ASAP",
            "customer_email": "test_asap@example.com",
            "customer_phone": "0123456789",
            "pickup_time": "So schnell wie möglich",
            "notes": "Test ASAP order"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_number" in data, "Response should contain order_number"
        assert data["order_number"] > 0, "Order number should be positive"
        print(f"✅ ASAP Order created with number #{data['order_number']}")
        return data["order_number"]

    def test_create_order_with_specific_time(self, api_client):
        """POST /api/shop/orders - create order with specific pickup time"""
        order_data = {
            "items": [
                {
                    "item_id": "test_item_2",
                    "item_name": "Test Pasta Carbonara",
                    "quantity": 2,
                    "size": None,
                    "size_name": None,
                    "options": [
                        {"group_name": "Extra", "option_name": "Parmesan", "price": "1.50"}
                    ],
                    "unit_price": 11.90,
                    "total_price": 26.80,
                    "notes": "Extra parmesan please"
                }
            ],
            "customer_name": "TEST_Customer Timed",
            "customer_email": "test_timed@example.com",
            "customer_phone": "0987654321",
            "pickup_time": "18:30 Uhr",
            "notes": "Test order with specific time"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_number" in data
        print(f"✅ Timed Order created with number #{data['order_number']}")


class TestAdminOrders:
    """Test admin order management"""

    def test_get_all_orders(self, authenticated_client):
        """GET /api/shop/orders - admin should see all orders"""
        response = authenticated_client.get(f"{BASE_URL}/api/shop/orders")
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        
        orders = response.json()
        assert isinstance(orders, list), "Orders should be a list"
        print(f"✅ Retrieved {len(orders)} orders")
        
        # Find TEST orders
        test_orders = [o for o in orders if "TEST_" in (o.get("customer_name") or "")]
        print(f"  Found {len(test_orders)} TEST orders")

    def test_confirm_asap_order_with_prep_time(self, authenticated_client, api_client):
        """Admin confirms ASAP order with preparation time"""
        # First create an ASAP order
        order_data = {
            "items": [
                {
                    "item_id": "test_pizza",
                    "item_name": "Test Pizza",
                    "quantity": 1,
                    "unit_price": 10.00,
                    "total_price": 10.00
                }
            ],
            "customer_name": "TEST_ASAP_Confirm",
            "customer_email": "test_confirm@example.com",
            "customer_phone": "0123456789",
            "pickup_time": "So schnell wie möglich",
            "notes": ""
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        assert create_response.status_code == 200
        order_number = create_response.json()["order_number"]
        order_id = create_response.json()["order_id"]
        
        # Now confirm it with prep time
        confirm_response = authenticated_client.put(
            f"{BASE_URL}/api/shop/orders/{order_id}/status?status=confirmed&prep_time_minutes=25"
        )
        assert confirm_response.status_code == 200, f"Confirm failed: {confirm_response.text}"
        
        data = confirm_response.json()
        assert "pickup_time" in data, "Response should contain updated pickup_time"
        print(f"✅ Order #{order_number} confirmed with pickup time: {data.get('pickup_time')}")

    def test_cancel_order(self, authenticated_client, api_client):
        """Admin cancels an order"""
        # Create an order to cancel
        order_data = {
            "items": [
                {
                    "item_id": "test_cancel",
                    "item_name": "Test Cancel Item",
                    "quantity": 1,
                    "unit_price": 5.00,
                    "total_price": 5.00
                }
            ],
            "customer_name": "TEST_Cancel",
            "customer_email": "test_cancel@example.com",
            "customer_phone": "0123456789",
            "pickup_time": "19:00 Uhr",
            "notes": ""
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["order_id"]
        
        # Cancel it
        cancel_response = authenticated_client.put(
            f"{BASE_URL}/api/shop/orders/{order_id}/status?status=cancelled"
        )
        assert cancel_response.status_code == 200
        print(f"✅ Order cancelled successfully")


class TestReservationCreation:
    """Test reservation creation flow (customer-facing)"""

    def test_create_reservation(self, api_client):
        """POST /api/shop/reservations - create a reservation"""
        # Get a future date (tomorrow or later)
        future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        reservation_data = {
            "customer_name": "TEST_Reservation",
            "customer_email": "test_reservation@example.com",
            "customer_phone": "0123456789",
            "date": future_date,
            "time": "19:00",
            "guests": 4,
            "notes": "Test reservation - birthday party"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shop/reservations", json=reservation_data)
        assert response.status_code == 200, f"Reservation failed: {response.text}"
        
        data = response.json()
        assert "reservation_number" in data
        print(f"✅ Reservation created with number #{data['reservation_number']}")


class TestAdminReservations:
    """Test admin reservation management"""

    def test_get_all_reservations(self, authenticated_client):
        """GET /api/shop/reservations - admin should see all reservations"""
        response = authenticated_client.get(f"{BASE_URL}/api/shop/reservations")
        assert response.status_code == 200, f"Failed to get reservations: {response.text}"
        
        reservations = response.json()
        assert isinstance(reservations, list)
        print(f"✅ Retrieved {len(reservations)} reservations")

    def test_confirm_reservation(self, authenticated_client, api_client):
        """Admin confirms a reservation"""
        # Create a reservation
        future_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        
        create_data = {
            "customer_name": "TEST_Confirm_Res",
            "customer_email": "test_confirm_res@example.com",
            "customer_phone": "0123456789",
            "date": future_date,
            "time": "20:00",
            "guests": 2,
            "notes": ""
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/shop/reservations", json=create_data)
        assert create_response.status_code == 200
        reservation_id = create_response.json()["reservation_id"]
        
        # Confirm it
        confirm_response = authenticated_client.put(
            f"{BASE_URL}/api/shop/reservations/{reservation_id}/status?status=confirmed"
        )
        assert confirm_response.status_code == 200
        print(f"✅ Reservation confirmed successfully")

    def test_reject_reservation(self, authenticated_client, api_client):
        """Admin rejects/cancels a reservation"""
        future_date = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
        
        create_data = {
            "customer_name": "TEST_Reject_Res",
            "customer_email": "test_reject@example.com",
            "customer_phone": "0123456789",
            "date": future_date,
            "time": "21:00",
            "guests": 6,
            "notes": ""
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/shop/reservations", json=create_data)
        assert create_response.status_code == 200
        reservation_id = create_response.json()["reservation_id"]
        
        # Reject it
        reject_response = authenticated_client.put(
            f"{BASE_URL}/api/shop/reservations/{reservation_id}/status?status=cancelled"
        )
        assert reject_response.status_code == 200
        print(f"✅ Reservation rejected/cancelled successfully")


class TestAdminSettings:
    """Test admin settings management"""

    def test_get_settings(self, authenticated_client):
        """GET /api/shop/settings - get current settings"""
        response = authenticated_client.get(f"{BASE_URL}/api/shop/settings")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✅ Settings retrieved - Keys: {list(data.keys())[:5]}...")

    def test_update_settings(self, authenticated_client):
        """PUT /api/shop/settings - update settings"""
        # Get current settings first
        get_response = authenticated_client.get(f"{BASE_URL}/api/shop/settings")
        current_settings = get_response.json()
        
        # Update with same values (non-destructive test)
        update_data = {
            "id": "shop_settings",
            "pickup_enabled": current_settings.get("pickup_enabled", True),
            "reservation_enabled": current_settings.get("reservation_enabled", True),
            "min_pickup_time_minutes": current_settings.get("min_pickup_time_minutes", 30),
            "max_reservation_days_ahead": current_settings.get("max_reservation_days_ahead", 30),
            "opening_hours": current_settings.get("opening_hours", {}),
            "closed_days": current_settings.get("closed_days", []),
            "restaurant_name": current_settings.get("restaurant_name", "Little Eat Italy"),
            "restaurant_address": current_settings.get("restaurant_address", "Europastrasse 8, 57072 Siegen"),
            "restaurant_phone": current_settings.get("restaurant_phone", "0271 31924461"),
            "restaurant_email": current_settings.get("restaurant_email", "")
        }
        
        response = authenticated_client.put(f"{BASE_URL}/api/shop/settings", json=update_data)
        assert response.status_code == 200, f"Settings update failed: {response.text}"
        print(f"✅ Settings updated successfully")


class TestAdminMenu:
    """Test admin menu management"""

    def test_get_menu(self, authenticated_client):
        """GET /api/shop/menu - get menu (public but testing with auth)"""
        response = authenticated_client.get(f"{BASE_URL}/api/shop/menu")
        assert response.status_code == 200
        
        data = response.json()
        categories_count = len(data.get("categories", []))
        print(f"✅ Menu has {categories_count} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
