"""
Wallet Integration Tests - Testing Apple/Google Wallet Pass Endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWalletIntegration:
    """Test wallet pass generation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login test customer to get token"""
        self.test_email = "test@test.de"
        self.test_password = "Test123!"
        self.token = None
        
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/customers/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("access_token")
        
        yield
    
    def get_auth_headers(self):
        """Return authorization headers"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    def test_customer_login(self):
        """Test customer login works"""
        response = requests.post(
            f"{BASE_URL}/api/customers/login",
            json={"email": self.test_email, "password": self.test_password}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        print(f"✓ Customer login successful")
    
    def test_apple_wallet_returns_501(self):
        """Test Apple Wallet endpoint returns 501 when not configured"""
        if not self.token:
            pytest.skip("No auth token - login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/customers/me/wallet-pass?type=apple",
            headers=self.get_auth_headers()
        )
        
        assert response.status_code == 501, f"Expected 501, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "No error detail in response"
        assert "Apple Wallet" in data["detail"] or "nicht konfiguriert" in data["detail"], f"Unexpected error message: {data['detail']}"
        print(f"✓ Apple Wallet returns 501 with correct message: {data['detail']}")
    
    def test_google_wallet_returns_501(self):
        """Test Google Wallet endpoint returns 501 when not configured"""
        if not self.token:
            pytest.skip("No auth token - login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/customers/me/wallet-pass?type=google",
            headers=self.get_auth_headers()
        )
        
        assert response.status_code == 501, f"Expected 501, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "No error detail in response"
        assert "Google Wallet" in data["detail"] or "nicht konfiguriert" in data["detail"], f"Unexpected error message: {data['detail']}"
        print(f"✓ Google Wallet returns 501 with correct message: {data['detail']}")
    
    def test_invalid_wallet_type_returns_400(self):
        """Test invalid wallet type returns 400"""
        if not self.token:
            pytest.skip("No auth token - login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/customers/me/wallet-pass?type=invalid",
            headers=self.get_auth_headers()
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Ungültiger Wallet-Typ" in data.get("detail", ""), f"Unexpected error message: {data.get('detail')}"
        print(f"✓ Invalid wallet type returns 400 with correct message")
    
    def test_wallet_pass_requires_auth(self):
        """Test wallet pass endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/customers/me/wallet-pass?type=apple"
        )
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print(f"✓ Wallet pass endpoint requires authentication (returned {response.status_code})")
    
    def test_customer_me_has_loyalty_data(self):
        """Verify customer profile includes loyalty QR code data"""
        if not self.token:
            pytest.skip("No auth token - login failed")
        
        response = requests.get(
            f"{BASE_URL}/api/customers/me/loyalty",
            headers=self.get_auth_headers()
        )
        
        assert response.status_code == 200, f"Loyalty fetch failed: {response.text}"
        data = response.json()
        assert "qr_code_data" in data, f"No qr_code_data in loyalty response: {data.keys()}"
        assert "loyalty_points" in data, f"No loyalty_points in response"
        print(f"✓ Customer loyalty data includes QR code: {data.get('qr_code_data', '')[:30]}...")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
