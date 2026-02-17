import requests
import json
import sys
from datetime import datetime

class LittleEatItalyAPITester:
    def __init__(self, base_url="https://red-brick-pizza.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []

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
        """Test contact form submission"""
        test_data = {
            "name": "Test Customer",
            "email": "test@littleeatitaly.com",
            "message": "This is a test message from automated testing."
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
                    details = f"Missing fields in response: {missing_fields}"
                else:
                    details = f"Contact message created with ID: {data.get('id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Contact Form Submission", success, details)
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

    def test_get_settings(self):
        """Test get site settings"""
        try:
            response = requests.get(f"{self.api_url}/settings", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['address', 'phone', 'email', 'hours', 'about_text']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing fields in settings: {missing_fields}"
                else:
                    details = "Settings retrieved successfully"
            else:
                details = f"Status: {response.status_code}"
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
        
        self.log_result("Get Site Settings", success, details)
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
        self.test_get_contact_messages()
        
        # Test settings
        self.test_get_settings()
        
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