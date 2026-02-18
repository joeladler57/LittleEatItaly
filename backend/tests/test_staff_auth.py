"""
Test file for Staff Authentication and Management APIs
Tests PIN-based login, token verification, orders and reservations management
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
STAFF_PIN = "1234"
WRONG_PIN = "9999"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"

class TestStaffAuth:
    """Test staff authentication endpoints"""
    
    def test_staff_login_correct_pin(self):
        """POST /api/staff/login with correct PIN returns token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        print(f"Staff login response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert data["token_type"] == "bearer", "Token type should be bearer"
        assert data["expires_in"] == 43200, "Token should expire in 12 hours (43200 seconds)"
        assert len(data["access_token"]) > 0, "Token should not be empty"
        
    def test_staff_login_wrong_pin(self):
        """POST /api/staff/login with wrong PIN returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": WRONG_PIN}
        )
        print(f"Wrong PIN response: {response.status_code} - {response.text}")
        assert response.status_code == 401, f"Expected 401 for wrong PIN, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        
    def test_staff_login_empty_pin(self):
        """POST /api/staff/login with empty PIN returns 422 or 401"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": ""}
        )
        print(f"Empty PIN response: {response.status_code} - {response.text}")
        assert response.status_code in [401, 422], f"Expected 401 or 422 for empty PIN, got {response.status_code}"
        
    def test_staff_login_short_pin(self):
        """POST /api/staff/login with short PIN returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": "12"}
        )
        print(f"Short PIN response: {response.status_code} - {response.text}")
        assert response.status_code == 401, f"Expected 401 for short PIN, got {response.status_code}"


class TestStaffVerify:
    """Test staff token verification endpoint"""
    
    @pytest.fixture
    def staff_token(self):
        """Get valid staff token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain staff token")
        
    def test_staff_verify_valid_token(self, staff_token):
        """GET /api/staff/verify with valid token returns role"""
        response = requests.get(
            f"{BASE_URL}/api/staff/verify",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Verify response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["valid"] == True, "Response should indicate valid token"
        assert data["role"] == "staff", "Role should be 'staff'"
        
    def test_staff_verify_no_token(self):
        """GET /api/staff/verify without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/staff/verify")
        print(f"No token response: {response.status_code} - {response.text}")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        
    def test_staff_verify_invalid_token(self):
        """GET /api/staff/verify with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/staff/verify",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        print(f"Invalid token response: {response.status_code} - {response.text}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestStaffOrders:
    """Test staff orders endpoints"""
    
    @pytest.fixture
    def staff_token(self):
        """Get valid staff token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain staff token")
        
    @pytest.fixture
    def admin_token(self):
        """Get valid admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain admin token")
        
    def test_staff_orders_with_token(self, staff_token):
        """GET /api/staff/orders with valid token returns orders list"""
        response = requests.get(
            f"{BASE_URL}/api/staff/orders",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Staff orders response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} orders")
        
    def test_staff_orders_no_token(self):
        """GET /api/staff/orders without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/staff/orders")
        print(f"No token orders response: {response.status_code} - {response.text}")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        
    def test_staff_orders_filter_by_status(self, staff_token):
        """GET /api/staff/orders with status filter works"""
        response = requests.get(
            f"{BASE_URL}/api/staff/orders?status=pending",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Filtered orders response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # All returned orders should be pending
        for order in data:
            assert order.get("status") == "pending", f"Order status should be 'pending', got {order.get('status')}"
            
    def test_admin_can_access_staff_orders(self, admin_token):
        """GET /api/staff/orders with admin token also works"""
        response = requests.get(
            f"{BASE_URL}/api/staff/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Admin access to staff orders: {response.status_code}")
        assert response.status_code == 200, f"Admin should be able to access staff orders, got {response.status_code}"


class TestStaffOrderStatusUpdate:
    """Test staff order status update endpoint"""
    
    @pytest.fixture
    def staff_token(self):
        """Get valid staff token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain staff token")
        
    @pytest.fixture
    def test_order(self, staff_token):
        """Create a test order for status update testing"""
        # First create an order via public endpoint
        order_data = {
            "items": [{
                "item_id": "test_item",
                "item_name": "TEST_Staff_Pizza",
                "quantity": 1,
                "unit_price": 10.00,
                "total_price": 10.00
            }],
            "customer_name": "TEST_Staff_User",
            "customer_email": "test_staff@example.com",
            "customer_phone": "+491234567890",
            "pickup_time": "So schnell wie möglich",
            "payment_method": "Barzahlung"
        }
        response = requests.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        if response.status_code in [200, 201]:
            return response.json()["order_id"]
        print(f"Failed to create test order: {response.status_code} - {response.text}")
        pytest.skip("Could not create test order")
        
    def test_staff_update_order_status_confirm(self, staff_token, test_order):
        """PUT /api/staff/orders/{id}/status updates order status to confirmed"""
        response = requests.put(
            f"{BASE_URL}/api/staff/orders/{test_order}/status?status=confirmed&prep_time_minutes=30",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Update status response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        # For ASAP orders, pickup_time should be set
        if "pickup_time" in data:
            print(f"Pickup time set to: {data['pickup_time']}")
            
    def test_staff_update_order_status_invalid_status(self, staff_token, test_order):
        """PUT /api/staff/orders/{id}/status with invalid status returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/staff/orders/{test_order}/status?status=invalid_status",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Invalid status response: {response.status_code} - {response.text}")
        assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
        
    def test_staff_update_nonexistent_order(self, staff_token):
        """PUT /api/staff/orders/{id}/status for nonexistent order returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/staff/orders/nonexistent_order_id/status?status=confirmed",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Nonexistent order response: {response.status_code} - {response.text}")
        assert response.status_code == 404, f"Expected 404 for nonexistent order, got {response.status_code}"


class TestStaffReservations:
    """Test staff reservations endpoints"""
    
    @pytest.fixture
    def staff_token(self):
        """Get valid staff token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain staff token")
        
    def test_staff_reservations_with_token(self, staff_token):
        """GET /api/staff/reservations with valid token returns reservations list"""
        response = requests.get(
            f"{BASE_URL}/api/staff/reservations",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Staff reservations response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} reservations")
        
    def test_staff_reservations_no_token(self):
        """GET /api/staff/reservations without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/staff/reservations")
        print(f"No token reservations response: {response.status_code} - {response.text}")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        
    def test_staff_reservations_filter_by_status(self, staff_token):
        """GET /api/staff/reservations with status filter works"""
        response = requests.get(
            f"{BASE_URL}/api/staff/reservations?status=pending",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Filtered reservations response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestStaffReservationStatusUpdate:
    """Test staff reservation status update endpoint"""
    
    @pytest.fixture
    def staff_token(self):
        """Get valid staff token"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain staff token")
        
    @pytest.fixture
    def test_reservation(self):
        """Create a test reservation for status update testing"""
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        reservation_data = {
            "customer_name": "TEST_Staff_Reservation",
            "customer_email": "test_staff_res@example.com",
            "customer_phone": "+491234567890",
            "date": future_date,
            "time": "19:00",
            "guests": 4
        }
        response = requests.post(f"{BASE_URL}/api/shop/reservations", json=reservation_data)
        if response.status_code in [200, 201]:
            return response.json()["reservation_id"]
        print(f"Failed to create test reservation: {response.status_code} - {response.text}")
        pytest.skip("Could not create test reservation")
        
    def test_staff_update_reservation_status_confirm(self, staff_token, test_reservation):
        """PUT /api/staff/reservations/{id}/status updates reservation status"""
        response = requests.put(
            f"{BASE_URL}/api/staff/reservations/{test_reservation}/status?status=confirmed",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Update reservation status response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        
    def test_staff_update_reservation_invalid_status(self, staff_token, test_reservation):
        """PUT /api/staff/reservations/{id}/status with invalid status returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/staff/reservations/{test_reservation}/status?status=invalid_status",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Invalid status response: {response.status_code} - {response.text}")
        assert response.status_code == 400, f"Expected 400 for invalid status, got {response.status_code}"
        
    def test_staff_update_nonexistent_reservation(self, staff_token):
        """PUT /api/staff/reservations/{id}/status for nonexistent reservation returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/staff/reservations/nonexistent_id/status?status=confirmed",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        print(f"Nonexistent reservation response: {response.status_code} - {response.text}")
        assert response.status_code == 404, f"Expected 404 for nonexistent reservation, got {response.status_code}"


class TestAdminPinSettings:
    """Test that admin can access PIN settings in shop settings"""
    
    @pytest.fixture
    def admin_token(self):
        """Get valid admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not obtain admin token")
        
    def test_shop_settings_includes_staff_pin(self, admin_token):
        """GET /api/shop/settings includes staff_pin field"""
        response = requests.get(
            f"{BASE_URL}/api/shop/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Shop settings response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "staff_pin" in data, "Settings should include staff_pin field"
        assert data["staff_pin"] == STAFF_PIN, f"Default staff_pin should be {STAFF_PIN}"
        
    def test_update_staff_pin(self, admin_token):
        """PUT /api/shop/settings can update staff_pin"""
        # Get current settings first
        get_response = requests.get(f"{BASE_URL}/api/shop/settings")
        current_settings = get_response.json()
        
        # Update PIN
        new_pin = "5678"
        current_settings["staff_pin"] = new_pin
        
        update_response = requests.put(
            f"{BASE_URL}/api/shop/settings",
            json=current_settings,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Update PIN response: {update_response.status_code}")
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        # Verify new PIN works
        login_response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": new_pin}
        )
        print(f"New PIN login response: {login_response.status_code}")
        assert login_response.status_code == 200, "Login with new PIN should work"
        
        # Revert PIN back to default
        current_settings["staff_pin"] = STAFF_PIN
        requests.put(
            f"{BASE_URL}/api/shop/settings",
            json=current_settings,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Reverted PIN back to {STAFF_PIN}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
