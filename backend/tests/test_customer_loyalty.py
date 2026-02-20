"""
Customer and Loyalty API Tests - After Backend Refactoring
Tests customer registration, login, profile, loyalty points system.
This validates the refactored code that moved from server.py to routers/customers.py and routers/loyalty.py
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data with unique identifiers
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"
TEST_CUSTOMER_EMAIL = f"{TEST_PREFIX}_customer@test.de"
TEST_CUSTOMER_PASSWORD = "Test123!"
TEST_CUSTOMER_NAME = f"Test User {TEST_PREFIX}"
TEST_CUSTOMER_PHONE = f"0123456{uuid.uuid4().hex[:4]}"

# Credentials from spec
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"
STAFF_PIN = "1234"


class TestAdminAuth:
    """Admin Authentication Tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print(f"✓ Admin login successful, token received")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401
        print(f"✓ Invalid admin login correctly rejected with 401")
    
    def test_admin_verify_token(self):
        """Test admin token verification"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["access_token"]
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/auth/verify", 
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == True
        assert data["username"] == ADMIN_USERNAME
        print(f"✓ Admin token verification successful")


class TestStaffAuth:
    """Staff Authentication Tests"""
    
    def test_staff_login_success(self):
        """Test staff login with valid PIN"""
        response = requests.post(f"{BASE_URL}/api/staff/login", json={
            "pin": STAFF_PIN
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        print(f"✓ Staff login successful with PIN {STAFF_PIN}")
    
    def test_staff_login_invalid_pin(self):
        """Test staff login with invalid PIN"""
        response = requests.post(f"{BASE_URL}/api/staff/login", json={
            "pin": "0000"
        })
        assert response.status_code == 401
        print(f"✓ Invalid staff PIN correctly rejected with 401")
    
    def test_staff_verify_session(self):
        """Test staff session verification"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/staff/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["role"] == "staff"
        print(f"✓ Staff session verification successful")


class TestCustomerRegistration:
    """Customer Registration Tests - /api/customers/register"""
    
    @pytest.fixture
    def unique_email(self):
        """Generate unique email for each test"""
        return f"test_{uuid.uuid4().hex[:8]}@test.de"
    
    def test_customer_register_success(self, unique_email):
        """Test customer registration with valid data"""
        response = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": unique_email,
            "password": "Test123!",
            "name": "Test Customer",
            "phone": "0123 456789"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "Konto erfolgreich erstellt" in data["message"]
        print(f"✓ Customer registration successful for {unique_email}")
    
    def test_customer_register_duplicate_email(self):
        """Test registration with already registered email"""
        email = f"duplicate_{uuid.uuid4().hex[:8]}@test.de"
        
        # First registration
        requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": "Test123!",
            "name": "First User",
            "phone": "0123 111111"
        })
        
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": "Test456!",
            "name": "Second User",
            "phone": "0123 222222"
        })
        assert response.status_code == 400
        assert "existiert bereits" in response.json()["detail"]
        print(f"✓ Duplicate email registration correctly rejected")
    
    def test_customer_register_invalid_email(self):
        """Test registration with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": "not-an-email",
            "password": "Test123!",
            "name": "Test User",
            "phone": "0123 456789"
        })
        assert response.status_code == 422  # Validation error
        print(f"✓ Invalid email format correctly rejected with 422")


class TestCustomerLogin:
    """Customer Login Tests - /api/customers/login"""
    
    @pytest.fixture
    def registered_customer(self):
        """Create a registered customer for login tests"""
        email = f"login_test_{uuid.uuid4().hex[:8]}@test.de"
        password = "LoginTest123!"
        
        requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": password,
            "name": "Login Test User",
            "phone": "0123 999888"
        })
        
        return {"email": email, "password": password}
    
    def test_customer_login_success(self, registered_customer):
        """Test customer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/customers/login", json={
            "email": registered_customer["email"],
            "password": registered_customer["password"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "customer" in data
        assert data["customer"]["email"] == registered_customer["email"]
        print(f"✓ Customer login successful for {registered_customer['email']}")
    
    def test_customer_login_wrong_password(self, registered_customer):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/customers/login", json={
            "email": registered_customer["email"],
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
        assert "falsch" in response.json()["detail"].lower()
        print(f"✓ Wrong password correctly rejected with 401")
    
    def test_customer_login_nonexistent_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/customers/login", json={
            "email": "nonexistent@test.de",
            "password": "Test123!"
        })
        assert response.status_code == 401
        print(f"✓ Non-existent email correctly rejected with 401")


class TestCustomerProfile:
    """Customer Profile Tests - /api/customers/me"""
    
    @pytest.fixture
    def authenticated_customer(self):
        """Create and login a customer, return token and data"""
        email = f"profile_test_{uuid.uuid4().hex[:8]}@test.de"
        password = "ProfileTest123!"
        name = "Profile Test User"
        phone = "0123 777666"
        
        # Register
        reg_res = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": password,
            "name": name,
            "phone": phone
        })
        token = reg_res.json()["access_token"]
        
        return {
            "token": token,
            "email": email,
            "name": name,
            "phone": phone
        }
    
    def test_get_customer_profile(self, authenticated_customer):
        """Test getting customer profile"""
        response = requests.get(f"{BASE_URL}/api/customers/me",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["email"] == authenticated_customer["email"]
        assert data["name"] == authenticated_customer["name"]
        assert data["phone"] == authenticated_customer["phone"]
        assert "password_hash" not in data  # Security: password should not be returned
        print(f"✓ Customer profile retrieved successfully")
    
    def test_update_customer_profile(self, authenticated_customer):
        """Test updating customer profile"""
        new_name = "Updated Name"
        new_phone = "0999 888777"
        
        response = requests.put(f"{BASE_URL}/api/customers/me",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"},
            json={"name": new_name, "phone": new_phone}
        )
        assert response.status_code == 200
        assert "aktualisiert" in response.json()["message"].lower()
        
        # Verify update
        profile = requests.get(f"{BASE_URL}/api/customers/me",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"}
        ).json()
        assert profile["name"] == new_name
        assert profile["phone"] == new_phone
        print(f"✓ Customer profile updated and verified")
    
    def test_get_customer_orders(self, authenticated_customer):
        """Test getting customer order history"""
        response = requests.get(f"{BASE_URL}/api/customers/me/orders",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ Customer orders endpoint returns list")
    
    def test_get_customer_reservations(self, authenticated_customer):
        """Test getting customer reservation history"""
        response = requests.get(f"{BASE_URL}/api/customers/me/reservations",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✓ Customer reservations endpoint returns list")
    
    def test_profile_unauthorized(self):
        """Test accessing profile without token"""
        response = requests.get(f"{BASE_URL}/api/customers/me")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized profile access correctly rejected")


class TestCustomerLoyalty:
    """Customer Loyalty Tests - /api/customers/me/loyalty"""
    
    @pytest.fixture
    def authenticated_customer(self):
        """Create and login a customer for loyalty tests"""
        email = f"loyalty_test_{uuid.uuid4().hex[:8]}@test.de"
        password = "LoyaltyTest123!"
        
        reg_res = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": password,
            "name": "Loyalty Test User",
            "phone": "0123 555444"
        })
        return {"token": reg_res.json()["access_token"], "email": email}
    
    def test_get_customer_loyalty_info(self, authenticated_customer):
        """Test getting customer loyalty info including QR code data"""
        response = requests.get(f"{BASE_URL}/api/customers/me/loyalty",
            headers={"Authorization": f"Bearer {authenticated_customer['token']}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "loyalty_points" in data
        assert "lifetime_points" in data
        assert "qr_code_data" in data
        assert "points_per_euro" in data
        assert "rewards" in data
        assert "recent_transactions" in data
        
        # QR code should start with correct prefix
        assert data["qr_code_data"].startswith("LEI-LOYALTY:")
        print(f"✓ Customer loyalty info retrieved with QR code data")
    
    def test_loyalty_unauthorized(self):
        """Test accessing loyalty without token"""
        response = requests.get(f"{BASE_URL}/api/customers/me/loyalty")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized loyalty access correctly rejected")


class TestLoyaltySettings:
    """Loyalty Settings Tests - /api/loyalty/settings"""
    
    def test_get_loyalty_settings_public(self):
        """Test getting public loyalty settings (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/loyalty/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "enabled" in data
        assert "points_per_euro" in data
        assert "rewards" in data
        assert isinstance(data["rewards"], list)
        print(f"✓ Public loyalty settings retrieved (enabled={data['enabled']}, points_per_euro={data['points_per_euro']})")
    
    def test_get_loyalty_settings_admin(self):
        """Test getting full loyalty settings (admin only)"""
        # Login as admin
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["access_token"]
        
        response = requests.get(f"{BASE_URL}/api/loyalty/settings/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Admin should get more fields
        assert "enabled" in data
        assert "points_per_euro" in data
        assert "min_purchase_for_points" in data
        assert "points_expiry_months" in data
        assert "welcome_bonus_points" in data
        assert "rewards" in data
        print(f"✓ Admin loyalty settings retrieved with all fields")
    
    def test_update_loyalty_settings(self):
        """Test updating loyalty settings (admin only)"""
        # Login as admin
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["access_token"]
        
        # Get current settings
        current = requests.get(f"{BASE_URL}/api/loyalty/settings/admin",
            headers={"Authorization": f"Bearer {token}"}
        ).json()
        
        # Update with same values (don't change actual settings)
        response = requests.put(f"{BASE_URL}/api/loyalty/settings",
            headers={"Authorization": f"Bearer {token}"},
            json=current
        )
        assert response.status_code == 200
        assert "gespeichert" in response.json()["message"].lower()
        print(f"✓ Loyalty settings update endpoint works")


class TestStaffLoyalty:
    """Staff Loyalty Operations - QR scanning and points management"""
    
    @pytest.fixture
    def staff_token(self):
        """Get staff token"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        return login_res.json()["access_token"]
    
    @pytest.fixture
    def customer_with_loyalty(self):
        """Create customer and get their loyalty info"""
        email = f"staff_loyalty_test_{uuid.uuid4().hex[:8]}@test.de"
        reg_res = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Staff Loyalty Test",
            "phone": "0123 333222"
        })
        token = reg_res.json()["access_token"]
        
        # Get loyalty info for QR code
        loyalty = requests.get(f"{BASE_URL}/api/customers/me/loyalty",
            headers={"Authorization": f"Bearer {token}"}
        ).json()
        
        return {
            "token": token,
            "email": email,
            "qr_code_data": loyalty["qr_code_data"],
            "customer_id": loyalty["qr_code_data"].split(":")[1]  # Extract ID from QR
        }
    
    def test_staff_scan_customer_qr(self, staff_token, customer_with_loyalty):
        """Test staff scanning customer QR code"""
        response = requests.post(f"{BASE_URL}/api/staff/loyalty/scan",
            headers={"Authorization": f"Bearer {staff_token}"},
            params={"qr_data": customer_with_loyalty["qr_code_data"]}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert "name" in data
        assert "loyalty_points" in data
        print(f"✓ Staff QR scan returns customer info")
    
    def test_staff_scan_invalid_qr(self, staff_token):
        """Test staff scanning invalid QR code"""
        response = requests.post(f"{BASE_URL}/api/staff/loyalty/scan",
            headers={"Authorization": f"Bearer {staff_token}"},
            params={"qr_data": "INVALID-QR-CODE"}
        )
        assert response.status_code == 400
        print(f"✓ Invalid QR code correctly rejected")
    
    def test_staff_add_points(self, staff_token, customer_with_loyalty):
        """Test staff adding points for in-store purchase"""
        response = requests.post(f"{BASE_URL}/api/staff/loyalty/add-points",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "customer_id": customer_with_loyalty["customer_id"],
                "purchase_amount": 20.00,
                "description": "Vor-Ort-Verzehr Test"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "points_added" in data
        assert data["points_added"] > 0
        assert "new_total" in data
        print(f"✓ Staff added {data['points_added']} points to customer")
    
    def test_staff_search_customer(self, staff_token, customer_with_loyalty):
        """Test staff searching for customer"""
        # Search by email
        response = requests.get(f"{BASE_URL}/api/staff/loyalty/search",
            headers={"Authorization": f"Bearer {staff_token}"},
            params={"query": customer_with_loyalty["email"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(c["email"] == customer_with_loyalty["email"] for c in data)
        print(f"✓ Staff customer search works")


class TestAdminCustomerManagement:
    """Admin Customer Management Tests - /api/customers (admin)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        return login_res.json()["access_token"]
    
    def test_get_all_customers(self, admin_token):
        """Test getting all customers (admin only)"""
        response = requests.get(f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        # Check that password_hash is not returned
        for customer in data[:5]:  # Check first 5
            assert "password_hash" not in customer
        print(f"✓ Admin retrieved {len(data)} customers")
    
    def test_get_customer_by_id(self, admin_token):
        """Test getting specific customer by ID (admin only)"""
        # First create a customer
        email = f"admin_view_test_{uuid.uuid4().hex[:8]}@test.de"
        reg_res = requests.post(f"{BASE_URL}/api/customers/register", json={
            "email": email,
            "password": "Test123!",
            "name": "Admin View Test",
            "phone": "0123 111222"
        })
        
        # Get customer list to find the ID
        customers = requests.get(f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        
        customer = next((c for c in customers if c["email"] == email), None)
        assert customer is not None
        
        # Get by ID
        response = requests.get(f"{BASE_URL}/api/customers/{customer['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == email
        assert "recent_orders" in data
        assert "recent_reservations" in data
        print(f"✓ Admin retrieved customer by ID with order/reservation history")
    
    def test_get_customers_unauthorized(self):
        """Test getting customers without admin token"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized customer list access correctly rejected")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
