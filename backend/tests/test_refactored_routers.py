"""
Test file for verifying Staff and Terminal router refactoring
Tests all endpoints that were moved from server.py to routers/staff.py and routers/terminal.py
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://router-phase.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"
STAFF_PIN = "1234"
WAITER_PINS = {"Marco": "1111", "Lucia": "2222"}


class TestStaffEndpoints:
    """Test Staff Router endpoints (/api/staff/*)"""

    def test_staff_login_correct_pin(self):
        """POST /api/staff/login with correct PIN"""
        response = requests.post(
            f"{BASE_URL}/api/staff/login",
            json={"pin": STAFF_PIN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("SUCCESS: Staff login works")

    def test_staff_verify_with_token(self):
        """GET /api/staff/verify with valid token"""
        # Get token first
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["role"] == "staff"
        print("SUCCESS: Staff verify works")

    def test_staff_orders(self):
        """GET /api/staff/orders"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/orders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: Staff orders endpoint works")

    def test_staff_reservations(self):
        """GET /api/staff/reservations"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/reservations",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: Staff reservations endpoint works")

    def test_staff_loyalty_search(self):
        """GET /api/staff/loyalty/search"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/staff/loyalty/search?query=test",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: Staff loyalty search endpoint works")


class TestTerminalEndpoints:
    """Test Terminal Router endpoints (/api/terminal/*)"""

    def test_terminal_login_marco(self):
        """POST /api/terminal/login with Marco's PIN"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "1111"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["waiter_name"] == "Marco"
        print("SUCCESS: Terminal login (Marco) works")

    def test_terminal_login_lucia(self):
        """POST /api/terminal/login with Lucia's PIN"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/login",
            json={"pin": "2222"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["waiter_name"] == "Lucia"
        print("SUCCESS: Terminal login (Lucia) works")

    def test_terminal_tables(self):
        """GET /api/terminal/tables"""
        response = requests.get(f"{BASE_URL}/api/terminal/tables")
        assert response.status_code == 200
        tables = response.json()
        assert isinstance(tables, list)
        assert len(tables) > 0
        print(f"SUCCESS: Got {len(tables)} terminal tables")

    def test_terminal_menu(self):
        """GET /api/terminal/menu"""
        response = requests.get(f"{BASE_URL}/api/terminal/menu")
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"SUCCESS: Got {len(items)} terminal menu items")

    def test_terminal_orders_get(self):
        """GET /api/terminal/orders"""
        response = requests.get(f"{BASE_URL}/api/terminal/orders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: Terminal orders GET works")

    def test_terminal_orders_create(self):
        """POST /api/terminal/orders"""
        # Get table and menu item
        tables = requests.get(f"{BASE_URL}/api/terminal/tables").json()
        menu_items = requests.get(f"{BASE_URL}/api/terminal/menu").json()
        
        order_data = {
            "table_number": tables[0]["number"] if tables else "1",
            "waiter_id": "test_waiter",
            "waiter_name": "TEST_Refactor_Waiter",
            "items": [{
                "item_id": menu_items[0]["id"] if menu_items else "test",
                "item_name": menu_items[0]["name"] if menu_items else "Test Item",
                "quantity": 1,
                "price": menu_items[0]["price"] if menu_items else 10.0,
                "addons": [],
                "course": "Hauptspeise"
            }]
        }
        
        response = requests.post(f"{BASE_URL}/api/terminal/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert "order_number" in data
        print(f"SUCCESS: Created terminal order #{data['order_number']}")


class TestTerminalAdminEndpoints:
    """Test Terminal endpoints requiring admin auth"""

    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")

    def test_terminal_waiters_get(self, admin_token):
        """GET /api/terminal/waiters"""
        response = requests.get(
            f"{BASE_URL}/api/terminal/waiters",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        waiters = response.json()
        assert isinstance(waiters, list)
        waiter_names = [w["name"] for w in waiters]
        assert "Marco" in waiter_names
        assert "Lucia" in waiter_names
        print(f"SUCCESS: Got {len(waiters)} waiters")

    def test_terminal_waiters_crud(self, admin_token):
        """Create, Read, Delete waiter"""
        test_pin = f"{9100 + (uuid.uuid4().int % 899)}"
        
        # Create
        create_res = requests.post(
            f"{BASE_URL}/api/terminal/waiters",
            json={"name": "TEST_Refactor_Waiter", "pin": test_pin},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_res.status_code == 200
        waiter_id = create_res.json()["waiter_id"]
        print(f"Created waiter with ID: {waiter_id}")
        
        # Delete
        delete_res = requests.delete(
            f"{BASE_URL}/api/terminal/waiters/{waiter_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_res.status_code == 200
        print("SUCCESS: Waiter CRUD works")

    def test_terminal_tables_crud(self, admin_token):
        """Create, Read, Delete table"""
        test_number = f"TEST_{uuid.uuid4().int % 1000}"
        
        # Create
        create_res = requests.post(
            f"{BASE_URL}/api/terminal/tables",
            json={"number": test_number, "description": "Test Table"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_res.status_code == 200
        table = create_res.json()["table"]
        print(f"Created table #{test_number}")
        
        # Delete
        delete_res = requests.delete(
            f"{BASE_URL}/api/terminal/tables/{table['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_res.status_code == 200
        print("SUCCESS: Table CRUD works")

    def test_terminal_menu_crud(self, admin_token):
        """Create, Read, Delete menu item"""
        # Create with Dict addons (as per original server.py model)
        create_res = requests.post(
            f"{BASE_URL}/api/terminal/menu",
            json={
                "name": "TEST_Refactor_Pizza",
                "category": "Pizza",
                "price": 15.50,
                "addons": [{"name": "Extra Käse", "price": 1.50}]
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_res.status_code == 200
        item_id = create_res.json()["item_id"]
        print(f"Created menu item with ID: {item_id}")
        
        # Delete
        delete_res = requests.delete(
            f"{BASE_URL}/api/terminal/menu/{item_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_res.status_code == 200
        print("SUCCESS: Menu item CRUD works")


class TestPrinterEndpoints:
    """Test Printer endpoints (using staff token)"""

    def test_printer_status(self):
        """GET /api/printer/status"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/printer/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data
        assert "connected" in data
        print(f"SUCCESS: Printer status - enabled={data['enabled']}, connected={data['connected']}")

    def test_print_queue_get(self):
        """GET /api/print-queue"""
        login_res = requests.post(f"{BASE_URL}/api/staff/login", json={"pin": STAFF_PIN})
        token = login_res.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/print-queue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("SUCCESS: Print queue GET works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
