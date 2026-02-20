"""
Terminal Feature Tests - Kellner-Terminal for Little Eat Italy
Tests for: Terminal Login, Tables, Waiters, Menu Items, Orders
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pizza-ordering-app-1.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"
WAITER_PINS = {"Marco": "1111", "Lucia": "2222"}


class TestTerminalLogin:
    """Test Terminal Waiter Login"""

    def test_login_with_valid_pin_marco(self):
        """Test login with Marco's PIN (1111)"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "1111"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["waiter_name"] == "Marco"
        assert "waiter_id" in data
        print(f"SUCCESS: Marco login - got token and waiter_name='Marco'")

    def test_login_with_valid_pin_lucia(self):
        """Test login with Lucia's PIN (2222)"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "2222"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["waiter_name"] == "Lucia"
        assert "waiter_id" in data
        print(f"SUCCESS: Lucia login - got token and waiter_name='Lucia'")

    def test_login_with_invalid_pin(self):
        """Test login with invalid PIN is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "9999"}
        )
        assert response.status_code == 401
        assert "Ungültiger PIN" in response.text
        print("SUCCESS: Invalid PIN correctly rejected with 401")

    def test_login_with_short_pin(self):
        """Test login with PIN < 4 digits"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "123"}
        )
        assert response.status_code == 400
        print("SUCCESS: Short PIN rejected with 400")

    def test_login_with_empty_pin(self):
        """Test login with empty PIN"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": ""}
        )
        assert response.status_code in [400, 401]
        print("SUCCESS: Empty PIN rejected")


class TestTerminalTables:
    """Test Terminal Tables endpoints"""

    def test_get_tables(self):
        """Test getting active tables"""
        response = requests.get(f"{BASE_URL}/api/terminal/tables")
        assert response.status_code == 200
        tables = response.json()
        assert isinstance(tables, list)
        assert len(tables) >= 10  # Should have at least 10 tables
        print(f"SUCCESS: Got {len(tables)} tables")
        
        # Verify table structure
        if tables:
            table = tables[0]
            assert "id" in table
            assert "number" in table
            assert "active" in table
            print(f"SUCCESS: Table structure verified - number={table['number']}")


class TestTerminalMenu:
    """Test Terminal Menu endpoints"""

    def test_get_menu_items(self):
        """Test getting terminal menu items"""
        response = requests.get(f"{BASE_URL}/api/terminal/menu")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        assert len(items) >= 5  # Should have at least 5 items
        print(f"SUCCESS: Got {len(items)} menu items")
        
        # Verify menu item structure
        if items:
            item = items[0]
            assert "id" in item
            assert "name" in item
            assert "category" in item
            assert "price" in item
            print(f"SUCCESS: Menu item structure verified - name={item['name']}, category={item['category']}")

    def test_get_categories(self):
        """Test getting terminal menu categories"""
        response = requests.get(f"{BASE_URL}/api/terminal/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        
        # Expected categories
        expected_categories = ["Vorspeise", "Pizza", "Nachspeise", "Getränke"]
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        print(f"SUCCESS: Got categories: {categories}")


class TestTerminalOrders:
    """Test Terminal Order creation"""

    def test_create_order(self):
        """Test creating a terminal order"""
        # First get a valid table and menu item
        tables_res = requests.get(f"{BASE_URL}/api/terminal/tables")
        tables = tables_res.json()
        table_number = tables[0]["number"] if tables else "1"
        
        menu_res = requests.get(f"{BASE_URL}/api/terminal/menu")
        menu_items = menu_res.json()
        test_item = menu_items[0] if menu_items else {"id": "test", "name": "Test Item", "price": 10.0}
        
        # Create order
        order_data = {
            "table_number": table_number,
            "waiter_id": "test_waiter_id",
            "waiter_name": "Test Waiter",
            "items": [
                {
                    "item_id": test_item["id"],
                    "item_name": test_item["name"],
                    "quantity": 1,
                    "price": test_item["price"],
                    "addons": [],
                    "course": "Hauptspeise",
                    "note": "TEST order"
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/terminal/orders",
            json=order_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert "order_number" in data
        assert "total" in data
        print(f"SUCCESS: Created order #{data['order_number']} with total={data['total']}")

    def test_get_orders(self):
        """Test getting terminal orders"""
        response = requests.get(f"{BASE_URL}/api/terminal/orders")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"SUCCESS: Got {len(orders)} terminal orders")

    def test_get_today_orders(self):
        """Test getting today's terminal orders"""
        response = requests.get(f"{BASE_URL}/api/terminal/orders/today")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"SUCCESS: Got {len(orders)} orders for today")


class TestAdminWaiterManagement:
    """Test Admin Waiter Management endpoints"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")

    def test_get_waiters(self, admin_token):
        """Test getting all waiters"""
        response = requests.get(
            f"{BASE_URL}/api/terminal/waiters",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        waiters = response.json()
        assert isinstance(waiters, list)
        assert len(waiters) >= 2  # Should have Marco and Lucia
        
        waiter_names = [w["name"] for w in waiters]
        assert "Marco" in waiter_names
        assert "Lucia" in waiter_names
        print(f"SUCCESS: Got {len(waiters)} waiters: {waiter_names}")

    def test_create_waiter(self, admin_token):
        """Test creating a new waiter"""
        test_pin = f"{9000 + (uuid.uuid4().int % 999)}"  # Random 4-digit PIN
        response = requests.post(
            f"{BASE_URL}/api/terminal/waiters",
            json={"name": "TEST_Kellner", "pin": test_pin, "active": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "waiter_id" in data
        print(f"SUCCESS: Created test waiter with PIN {test_pin}")
        
        # Cleanup
        waiter_id = data["waiter_id"]
        requests.delete(
            f"{BASE_URL}/api/terminal/waiters/{waiter_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

    def test_create_waiter_duplicate_pin_rejected(self, admin_token):
        """Test that duplicate PIN is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/waiters",
            json={"name": "TEST_Duplicate", "pin": "1111", "active": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        assert "PIN bereits vergeben" in response.text
        print("SUCCESS: Duplicate PIN correctly rejected")


class TestAdminTableManagement:
    """Test Admin Table Management endpoints"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")

    def test_create_table(self, admin_token):
        """Test creating a new table"""
        test_number = f"TEST_{uuid.uuid4().int % 1000}"
        response = requests.post(
            f"{BASE_URL}/api/terminal/tables",
            json={"number": test_number, "description": "Test Table", "active": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "table" in data
        print(f"SUCCESS: Created test table #{test_number}")
        
        # Cleanup
        table_id = data["table"]["id"]
        requests.delete(
            f"{BASE_URL}/api/terminal/tables/{table_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestAdminMenuManagement:
    """Test Admin Terminal Menu Management endpoints"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")

    def test_get_all_menu_items(self, admin_token):
        """Test getting all menu items including inactive"""
        response = requests.get(
            f"{BASE_URL}/api/terminal/menu/all",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"SUCCESS: Got {len(items)} menu items (including inactive)")

    def test_create_menu_item(self, admin_token):
        """Test creating a new menu item"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/menu",
            json={
                "name": "TEST_Pizza",
                "category": "Pizza",
                "price": 12.50,
                "addons": [{"name": "Extra Käse", "price": 1.50}],
                "active": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "item_id" in data
        print(f"SUCCESS: Created test menu item")
        
        # Cleanup
        item_id = data["item_id"]
        requests.delete(
            f"{BASE_URL}/api/terminal/menu/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestPrintQueue:
    """Test Print Queue endpoints"""

    def test_get_pending_print_jobs(self):
        """Test getting pending print jobs (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/print-queue/pending")
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        print(f"SUCCESS: Got {len(jobs)} pending print jobs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
