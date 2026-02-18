"""
PWA Endpoint Tests for Little Eat Italy Restaurant Admin
Tests PWA assets accessibility and admin login functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAAssets:
    """Test PWA static assets are accessible"""
    
    def test_manifest_json_accessible(self):
        """Test that manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json returned {response.status_code}"
        
        # Validate manifest content
        manifest = response.json()
        assert manifest.get("short_name") == "Little Eat Italy"
        assert manifest.get("name") == "Little Eat Italy - Restaurant Admin"
        assert manifest.get("display") == "standalone"
        assert manifest.get("start_url") == "/admin/shop"
        print("✓ manifest.json accessible and valid")
    
    def test_manifest_has_icons(self):
        """Test that manifest has icon definitions"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        
        manifest = response.json()
        icons = manifest.get("icons", [])
        assert len(icons) > 0, "No icons defined in manifest"
        
        # Check required icon sizes
        icon_sizes = [icon.get("sizes") for icon in icons]
        assert "192x192" in icon_sizes, "Missing 192x192 icon"
        assert "512x512" in icon_sizes, "Missing 512x512 icon"
        print(f"✓ manifest has {len(icons)} icon definitions")
    
    def test_service_worker_accessible(self):
        """Test that service-worker.js is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"service-worker.js returned {response.status_code}"
        
        content = response.text
        assert "CACHE_NAME" in content or "cache" in content.lower(), "Service worker missing cache config"
        print("✓ service-worker.js accessible")
    
    def test_notification_sound_accessible(self):
        """Test that notification sound file is accessible"""
        response = requests.get(f"{BASE_URL}/sounds/notification.mp3")
        assert response.status_code == 200, f"notification.mp3 returned {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "audio" in content_type or "mpeg" in content_type or "octet-stream" in content_type, \
            f"Unexpected content type: {content_type}"
        print("✓ notification.mp3 accessible")
    
    def test_pwa_icons_accessible(self):
        """Test that PWA icons are accessible"""
        icon_sizes = ["72x72", "96x96", "128x128", "144x144", "152x152", "192x192", "384x384", "512x512"]
        
        for size in icon_sizes:
            response = requests.get(f"{BASE_URL}/icons/icon-{size}.png")
            assert response.status_code == 200, f"icon-{size}.png returned {response.status_code}"
        
        print(f"✓ All {len(icon_sizes)} PWA icons accessible")


class TestAdminAuth:
    """Test admin authentication for shop admin"""
    
    def test_admin_login_success(self):
        """Test successful admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "LittleEatItaly2024!"}
        )
        assert response.status_code == 200, f"Login returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Response missing access_token"
        assert data.get("token_type") == "bearer"
        print("✓ Admin login successful")
        
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials properly rejected")
    
    def test_token_verification(self):
        """Test token verification endpoint"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "LittleEatItaly2024!"}
        )
        token = login_response.json().get("access_token")
        
        # Verify token
        response = requests.get(
            f"{BASE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Token verification returned {response.status_code}"
        print("✓ Token verification successful")
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token returns 403/401"""
        response = requests.get(f"{BASE_URL}/api/shop/orders")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Protected endpoint properly requires authentication")


class TestShopAdminEndpoints:
    """Test shop admin endpoints used by PWA"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "LittleEatItaly2024!"}
        )
        return response.json().get("access_token")
    
    def test_get_orders(self, auth_token):
        """Test fetching orders (used by polling)"""
        response = requests.get(
            f"{BASE_URL}/api/shop/orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/shop/orders - returned {len(data)} orders")
    
    def test_get_reservations(self, auth_token):
        """Test fetching reservations (used by polling)"""
        response = requests.get(
            f"{BASE_URL}/api/shop/reservations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/shop/reservations - returned {len(data)} reservations")
    
    def test_get_menu(self):
        """Test fetching menu (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/shop/menu")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        print(f"✓ GET /api/shop/menu - returned {len(data.get('categories', []))} categories")
    
    def test_get_settings(self):
        """Test fetching settings (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/shop/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "ordering_enabled" in data or "restaurant_name" in data
        print("✓ GET /api/shop/settings - settings retrieved")


class TestPollingCompatibility:
    """Test that endpoints work well for 4-second polling"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "LittleEatItaly2024!"}
        )
        return response.json().get("access_token")
    
    def test_concurrent_polling_requests(self, auth_token):
        """Test that multiple concurrent requests (simulating polling) work"""
        import time
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Simulate 3 rapid polling requests
        start = time.time()
        for i in range(3):
            orders_response = requests.get(f"{BASE_URL}/api/shop/orders", headers=headers)
            reservations_response = requests.get(f"{BASE_URL}/api/shop/reservations", headers=headers)
            
            assert orders_response.status_code == 200, f"Poll {i+1} orders failed"
            assert reservations_response.status_code == 200, f"Poll {i+1} reservations failed"
        
        elapsed = time.time() - start
        print(f"✓ 3 polling cycles completed in {elapsed:.2f}s")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
