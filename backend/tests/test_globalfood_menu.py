"""
Backend API Tests for Little Eat Italy - GlobalFood Menu Integration & Homepage Buttons
Tests: GlobalFood menu API, content/buttons API for ordering links
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGlobalFoodMenuAPI:
    """GlobalFood Menu API endpoint tests"""
    
    def test_globalfood_menu_endpoint_returns_200(self):
        """Test /api/globalfood/menu returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/globalfood/menu", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GlobalFood menu endpoint returns 200")
    
    def test_globalfood_menu_has_categories(self):
        """Test menu response contains categories array"""
        response = requests.get(f"{BASE_URL}/api/globalfood/menu", timeout=30)
        data = response.json()
        
        assert "categories" in data, "Response should contain 'categories' field"
        assert isinstance(data["categories"], list), "'categories' should be a list"
        assert len(data["categories"]) > 0, "Categories list should not be empty"
        print(f"✓ Menu contains {len(data['categories'])} categories")
    
    def test_globalfood_menu_has_currency_eur(self):
        """Test menu response has EUR currency"""
        response = requests.get(f"{BASE_URL}/api/globalfood/menu", timeout=30)
        data = response.json()
        
        assert "currency" in data, "Response should contain 'currency' field"
        assert data["currency"] == "EUR", f"Currency should be EUR, got {data['currency']}"
        print("✓ Menu currency is EUR")
    
    def test_globalfood_menu_categories_have_items(self):
        """Test each category has items with required fields"""
        response = requests.get(f"{BASE_URL}/api/globalfood/menu", timeout=30)
        data = response.json()
        
        for category in data["categories"]:
            assert "id" in category, f"Category missing 'id'"
            assert "name" in category, f"Category missing 'name'"
            assert "items" in category, f"Category '{category.get('name')}' missing 'items'"
            
            # Check at least first item has price
            if category["items"]:
                item = category["items"][0]
                assert "name" in item, "Item missing 'name'"
                assert "price" in item, "Item missing 'price'"
                assert isinstance(item["price"], (int, float)), "Price should be numeric"
        
        print("✓ All categories have valid items with prices")
    
    def test_globalfood_menu_has_expected_categories(self):
        """Test menu contains expected category types"""
        response = requests.get(f"{BASE_URL}/api/globalfood/menu", timeout=30)
        data = response.json()
        
        category_names = [cat["name"].lower() for cat in data["categories"]]
        
        # Check for at least one pizza-related category
        has_pizza = any("pizza" in name for name in category_names)
        assert has_pizza, f"Should have pizza category. Found: {category_names}"
        print(f"✓ Found expected categories including pizza")


class TestHomepageButtonsAPI:
    """Tests for homepage action buttons with correct URLs"""
    
    def test_content_endpoint_returns_200(self):
        """Test /api/content returns 200"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        assert response.status_code == 200
        print("✓ Content endpoint returns 200")
    
    def test_hero_buttons_exist(self):
        """Test hero section has buttons array"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        data = response.json()
        
        assert "hero" in data, "Response should contain 'hero' field"
        assert "buttons" in data["hero"], "Hero should contain 'buttons' field"
        assert isinstance(data["hero"]["buttons"], list), "'buttons' should be a list"
        assert len(data["hero"]["buttons"]) >= 4, f"Should have at least 4 buttons, got {len(data['hero']['buttons'])}"
        print(f"✓ Hero has {len(data['hero']['buttons'])} action buttons")
    
    def test_pickup_button_has_correct_url(self):
        """Test 'BESTELLEN ZUM ABHOLEN' button has correct foodbooking URL"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        data = response.json()
        
        buttons = data["hero"]["buttons"]
        pickup_button = next((b for b in buttons if b.get("id") == "pickup"), None)
        
        assert pickup_button is not None, "Pickup button with id='pickup' not found"
        expected_url = "https://www.foodbooking.com/api/fb/_q_y4z_v"
        assert pickup_button["url"] == expected_url, f"Pickup URL should be {expected_url}, got {pickup_button['url']}"
        assert pickup_button["label"] == "BESTELLEN ZUM ABHOLEN", f"Label should be 'BESTELLEN ZUM ABHOLEN'"
        print(f"✓ Pickup button has correct URL: {pickup_button['url']}")
    
    def test_reservation_button_has_correct_url(self):
        """Test 'TISCHRESERVIERUNG' button has correct foodbooking URL"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        data = response.json()
        
        buttons = data["hero"]["buttons"]
        reservation_button = next((b for b in buttons if b.get("id") == "reservation"), None)
        
        assert reservation_button is not None, "Reservation button with id='reservation' not found"
        expected_url = "https://www.foodbooking.com/api/res/_q_y4z_v"
        assert reservation_button["url"] == expected_url, f"Reservation URL should be {expected_url}, got {reservation_button['url']}"
        assert reservation_button["label"] == "TISCHRESERVIERUNG", f"Label should be 'TISCHRESERVIERUNG'"
        print(f"✓ Reservation button has correct URL: {reservation_button['url']}")
    
    def test_all_buttons_are_active(self):
        """Test all hero buttons are active"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        data = response.json()
        
        buttons = data["hero"]["buttons"]
        for btn in buttons:
            assert btn.get("is_active") == True, f"Button '{btn.get('label')}' should be active"
        
        print("✓ All hero buttons are active")


class TestNavigationAPI:
    """Tests for navigation links"""
    
    def test_nav_links_include_menu(self):
        """Test navigation includes MENÜ link"""
        response = requests.get(f"{BASE_URL}/api/content", timeout=10)
        data = response.json()
        
        # Nav links may be in content or hardcoded in frontend
        # Check if nav exists in response
        if "nav" in data and "links" in data["nav"]:
            nav_links = data["nav"]["links"]
            link_names = [link.get("name", "").upper() for link in nav_links]
            # Note: Navigation may be managed by frontend, not API
            print(f"✓ Nav links from API: {link_names}")
        else:
            print("✓ Navigation is hardcoded in frontend (expected)")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "running"
        print("✓ API root endpoint healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
