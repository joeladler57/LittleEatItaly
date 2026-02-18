import requests
import json
import sys
from datetime import datetime

class LittleEatItalyAPITester:
    def __init__(self, base_url="https://pizza-admin-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []
        self.token = None

    def log_result(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            self.failures.append({"test": test_name, "details": details})

    def test_root_endpoint(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}" if not success else ""
            if success:
                data = response.json()
                if "message" in data and "status" in data:
                    details = f"Response: {data}"
                else:
                    success = False
                    details = "Missing expected fields in response"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("API Root Endpoint", success, details)
        return success

    def test_seed_data(self):
        """Test data seeding"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=15)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Seed response: {data.get('message', 'No message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Data Seeding", success, details)
        return success

    def test_get_menu(self):
        """Test get all menu items"""
        try:
            response = requests.get(f"{self.api_url}/menu", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Verify structure of first item
                    first_item = data[0]
                    required_fields = ['id', 'name', 'description', 'price', 'category']
                    missing_fields = [field for field in required_fields if field not in first_item]
                    if missing_fields:
                        success = False
                        details = f"Missing fields in menu items: {missing_fields}"
                    else:
                        details = f"Found {len(data)} menu items"
                else:
                    success = False
                    details = "Empty menu or invalid format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Menu Items", success, details)
        return success, data if success else []

    def test_get_featured_menu(self):
        """Test get featured menu items"""
        try:
            response = requests.get(f"{self.api_url}/menu/featured", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    # Check that all items are featured
                    non_featured = [item for item in data if not item.get('is_featured', False)]
                    if non_featured:
                        success = False
                        details = f"Found non-featured items in featured endpoint: {len(non_featured)}"
                    else:
                        details = f"Found {len(data)} featured items"
                else:
                    success = False
                    details = "Invalid response format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Featured Menu Items", success, details)
        return success

    def test_get_menu_by_category(self):
        """Test get menu items by category"""
        categories = ['classic', 'special', 'vegetarian', 'dessert']
        all_passed = True
        
        for category in categories:
            try:
                response = requests.get(f"{self.api_url}/menu/category/{category}", timeout=10)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    if isinstance(data, list):
                        # Verify all items belong to the requested category
                        wrong_category = [item for item in data if item.get('category') != category]
                        if wrong_category:
                            success = False
                            details = f"Found items with wrong category: {len(wrong_category)}"
                        else:
                            details = f"Found {len(data)} {category} items"
                    else:
                        success = False
                        details = "Invalid response format"
                else:
                    details = f"Status: {response.status_code}"
            except Exception as e:
                success = False
                details = f"Exception: {str(e)}"
            
            self.log_result(f"Get {category.title()} Menu Items", success, details)
            if not success:
                all_passed = False
        
        return all_passed

    def test_contact_form_submission(self):
        """Test contact form submission with extended fields"""
        # Test with all fields including phone and subject
        test_data = {
            "name": "Test Customer",
            "email": "test@littleeatitaly.com",
            "phone": "+49 123 456789",
            "subject": "Test Subject",
            "message": "This is a test message from automated testing with extended fields."
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/contact", 
                json=test_data, 
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['id', 'name', 'email', 'message', 'created_at']
                optional_fields = ['phone', 'subject']  # These should be included if sent
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing required fields in response: {missing_fields}"
                else:
                    # Check if optional fields are preserved
                    has_phone = data.get('phone') == test_data['phone']
                    has_subject = data.get('subject') == test_data['subject']
                    if not (has_phone and has_subject):
                        details = f"Contact message created but optional fields not preserved correctly. ID: {data.get('id')}"
                    else:
                        details = f"Contact message created with all fields. ID: {data.get('id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Contact Form Submission (Extended Fields)", success, details)
        return success
    
    def test_contact_form_minimal(self):
        """Test contact form submission with minimal fields only"""
        test_data = {
            "name": "Test Minimal Customer",
            "email": "minimal@littleeatitaly.com",
            "message": "This is a minimal test message."
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/contact", 
                json=test_data, 
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['id', 'name', 'email', 'message', 'created_at']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing required fields in response: {missing_fields}"
                else:
                    details = f"Minimal contact message created with ID: {data.get('id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Contact Form Submission (Minimal Fields)", success, details)
        return success

    def test_get_contact_messages(self):
        """Test get contact messages (admin endpoint)"""
        try:
            response = requests.get(f"{self.api_url}/contact", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details = f"Found {len(data)} contact messages"
                else:
                    success = False
                    details = "Invalid response format"
            else:
                details = f"Status: {response.status_code}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Contact Messages", success, details)
        return success

    def test_get_content(self):
        """Test get site content (CMS system)"""
        try:
            response = requests.get(f"{self.api_url}/content", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Check for main content sections including impressum
                required_sections = ['hero', 'features', 'about_page', 'contact_page', 'impressum', 'footer', 'nav']
                missing_sections = [section for section in required_sections if section not in data]
                if missing_sections:
                    success = False
                    details = f"Missing content sections: {missing_sections}"
                else:
                    # Check navigation links for updated structure (no SPEISEKARTE)
                    nav = data.get('nav', {})
                    nav_links = nav.get('links', [])
                    expected_nav = ['START', 'ÜBER UNS', 'KONTAKT', 'IMPRESSUM']
                    nav_names = [link.get('name') for link in nav_links]
                    
                    # Check if SPEISEKARTE is absent and required links are present
                    has_speisekarte = 'SPEISEKARTE' in nav_names
                    missing_nav = [name for name in expected_nav if name not in nav_names]
                    
                    if has_speisekarte:
                        success = False
                        details = f"Navigation still contains SPEISEKARTE - should be removed"
                    elif missing_nav:
                        success = False
                        details = f"Missing navigation items: {missing_nav}"
                    else:
                        # Check impressum content
                        impressum = data.get('impressum', {})
                        if 'title' in impressum and 'content' in impressum:
                            details = f"Content retrieved successfully. Navigation updated correctly (no SPEISEKARTE). Impressum section present."
                        else:
                            success = False
                            details = f"Impressum section missing required fields (title, content)"
            else:
                details = f"Status: {response.status_code}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Site Content (CMS)", success, details)
        return success

    def test_get_impressum(self):
        """Test get impressum content specifically"""
        try:
            response = requests.get(f"{self.api_url}/impressum", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['title', 'content']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing impressum fields: {missing_fields}"
                else:
                    content_length = len(data.get('content', ''))
                    if content_length < 100:  # Impressum should have substantial legal content
                        success = False
                        details = f"Impressum content too short ({content_length} chars) - should contain legal information"
                    else:
                        # Check for German legal content keywords
                        content = data.get('content', '').lower()
                        legal_keywords = ['tmg', 'handelsregister', 'umsatzsteuer', 'impressum']
                        found_keywords = [keyword for keyword in legal_keywords if keyword in content]
                        if len(found_keywords) < 2:
                            details = f"Impressum retrieved but may be missing German legal content. Length: {content_length} chars"
                        else:
                            details = f"Impressum retrieved successfully. Length: {content_length} chars, contains legal keywords: {found_keywords}"
            else:
                details = f"Status: {response.status_code}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Impressum Content", success, details)
        return success

    def test_update_hero_content(self):
        """Test update hero content"""
        test_hero = {
            "background_image": "https://images.unsplash.com/photo-1760001484733-61cd5917f5c3?q=85&w=1920&auto=format&fit=crop",
            "subtitle": "Test subtitle for automated testing - Authentische neapolitanische Pizza",
            "buttons": [
                {"id": "uber_eats", "label": "UBER EATS", "url": "https://ubereats.com", "is_active": True, "icon": "utensils"},
                {"id": "lieferando", "label": "LIEFERANDO", "url": "https://lieferando.de", "is_active": True, "icon": "bike"},
                {"id": "pickup", "label": "BESTELLEN ZUM ABHOLEN", "url": "#pickup", "is_active": True, "icon": "shopping-bag"},
                {"id": "reservation", "label": "TISCHRESERVIERUNG", "url": "#reservation", "is_active": True, "icon": "calendar"}
            ]
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/content/hero", 
                json=test_hero, 
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'message' in data and 'hero' in data:
                    details = f"Hero content updated successfully"
                else:
                    success = False
                    details = "Unexpected response format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Update Hero Content", success, details)
        return success

    def test_update_button_links(self):
        """Test update button links"""
        test_buttons = [
            {"id": "uber_eats", "label": "UBER EATS", "url": "https://ubereats.com/test", "is_active": True, "icon": "utensils"},
            {"id": "lieferando", "label": "LIEFERANDO", "url": "https://lieferando.de/test", "is_active": True, "icon": "bike"},
            {"id": "pickup", "label": "BESTELLEN ZUM ABHOLEN", "url": "#pickup-test", "is_active": True, "icon": "shopping-bag"},
            {"id": "reservation", "label": "TISCHRESERVIERUNG", "url": "#reservation-test", "is_active": True, "icon": "calendar"}
        ]
        
        try:
            response = requests.put(
                f"{self.api_url}/content/buttons", 
                json=test_buttons, 
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'message' in data and 'buttons' in data:
                    details = f"Button links updated successfully"
                else:
                    success = False
                    details = "Unexpected response format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Update Button Links", success, details)
        return success

    def test_admin_login_correct(self):
        """Test admin login with correct credentials"""
        test_data = {
            "username": "admin",
            "password": "LittleEatItaly2024!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'access_token' in data and data['access_token']:
                    self.token = data['access_token']
                    details = f"Login successful, token obtained: {self.token[:20]}..."
                else:
                    success = False
                    details = "Login response missing access_token"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Admin Login (Correct Credentials)", success, details)
        return success

    def test_admin_login_wrong(self):
        """Test admin login with wrong credentials"""
        test_data = {
            "username": "admin",
            "password": "wrong_password"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 401
            
            if success:
                details = f"Correctly rejected invalid credentials with 401"
            else:
                details = f"Expected 401, got {response.status_code}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Admin Login (Wrong Credentials)", success, details)
        return success

    def test_verify_token(self):
        """Test token verification"""
        if not self.token:
            self.log_result("Token Verification", False, "No token available")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/auth/verify",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'authenticated' in data and data['authenticated']:
                    details = f"Token verified successfully, user: {data.get('username', 'unknown')}"
                else:
                    success = False
                    details = "Token verification response invalid"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Token Verification", success, details)
        return success

    def test_change_password(self):
        """Test password change functionality"""
        if not self.token:
            self.log_result("Password Change", False, "No token available")
            return False
            
        # Test changing to new password
        test_data = {
            "current_password": "LittleEatItaly2024!",
            "new_password": "TempTestPassword123!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/change-password",
                json=test_data,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                # Try to change back to original password
                restore_data = {
                    "current_password": "TempTestPassword123!",
                    "new_password": "LittleEatItaly2024!"
                }
                
                restore_response = requests.post(
                    f"{self.api_url}/auth/change-password",
                    json=restore_data,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {self.token}'
                    },
                    timeout=10
                )
                
                if restore_response.status_code == 200:
                    details = f"Password change successful and restored"
                else:
                    details = f"Password changed but failed to restore: {restore_response.status_code}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Password Change", success, details)
        return success

    def test_protected_content_update(self):
        """Test updating content requires authentication"""
        if not self.token:
            self.log_result("Protected Content Update", False, "No token available")
            return False
            
        test_footer = {
            "marquee_text": "TEST MARQUEE • ADMIN TESTING • ",
            "brand_description": "Test brand description for admin testing.",
            "nav_title": "NAVIGATION",
            "contact_title": "HIER FINDEST DU UNS",
            "address": "Test Address 123, Test City, 12345",
            "phone": "+49 123 456789",
            "email": "test@example.com",
            "copyright": "© 2024 Test Restaurant. All rights reserved.",
            "made_with": "Mit ♥ gemacht"
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/content/footer",
                json=test_footer,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'message' in data:
                    details = f"Footer content updated successfully with authentication"
                else:
                    success = False
                    details = "Unexpected response format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Protected Content Update (Footer)", success, details)
        return success

    def test_update_impressum_content(self):
        """Test updating impressum content"""
        if not self.token:
            self.log_result("Update Impressum Content", False, "No token available")
            return False
            
        test_impressum = {
            "title": "TEST IMPRESSUM",
            "content": """**Test Impressum - Angaben gemäß § 5 TMG:**

Little Eat Italy GmbH (TEST)
Teststraße 123
12345 Test Stadt
Deutschland

**Vertreten durch:**
Test Manager (Geschäftsführer)

**Kontakt:**
Telefon: +49 (0) 123 456789
E-Mail: test@littleeatitaly.de

**Registereintrag:**
Registergericht: Amtsgericht Teststadt
Registernummer: HRB TEST123

**Umsatzsteuer-ID:**
DE TEST456789

This is a test impressum content for automated testing purposes."""
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/content/impressum",
                json=test_impressum,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if 'message' in data:
                    # Verify the update by fetching the content
                    verify_response = requests.get(f"{self.api_url}/impressum", timeout=10)
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get('title') == test_impressum['title']:
                            details = f"Impressum content updated and verified successfully"
                        else:
                            details = f"Impressum updated but verification failed"
                    else:
                        details = f"Impressum updated but verification request failed"
                else:
                    success = False
                    details = "Unexpected response format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Update Impressum Content", success, details)
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"🍕 Starting Little Eat Italy API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test basic connectivity
        if not self.test_root_endpoint():
            print("❌ API root endpoint failed - stopping tests")
            return False
        
        # Seed data first
        self.test_seed_data()
        
        # Test menu endpoints
        menu_success, menu_data = self.test_get_menu()
        self.test_get_featured_menu()
        self.test_get_menu_by_category()
        
        # Test contact endpoints
        self.test_contact_form_submission()
        self.test_contact_form_minimal()
        self.test_get_contact_messages()
        
        # Test CMS content endpoints
        self.test_get_content()
        self.test_get_impressum()
        self.test_update_hero_content()
        self.test_update_button_links()
        
        # Test admin authentication
        print("\n" + "=" * 60)
        print(f"🔐 ADMIN AUTHENTICATION TESTS")
        print("=" * 60)
        
        self.test_admin_login_wrong()  # Test wrong credentials first
        self.test_admin_login_correct()  # Then correct login
        self.test_verify_token()
        self.test_change_password()
        self.test_protected_content_update()
        self.test_update_impressum_content()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"🎯 TEST SUMMARY")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failures:
            print(f"\n🚨 FAILURES:")
            for failure in self.failures:
                print(f"   • {failure['test']}: {failure['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LittleEatItalyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())