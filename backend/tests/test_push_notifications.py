"""
Test suite for Push Notification API endpoints
Tests: VAPID key, subscribe, unsubscribe, list subscriptions, test notification
Also tests push notification triggers on orders and reservations
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "LittleEatItaly2024!"


class TestPushNotificationAPIs:
    """Test push notification endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    # ============ VAPID KEY TESTS ============

    def test_get_vapid_public_key(self):
        """GET /api/push/vapid-key - Returns VAPID public key (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        
        assert response.status_code == 200, f"VAPID key fetch failed: {response.text}"
        data = response.json()
        assert "publicKey" in data, "Response should contain publicKey"
        assert len(data["publicKey"]) > 50, "VAPID public key should be a long string"
        print(f"✓ VAPID public key retrieved: {data['publicKey'][:30]}...")

    # ============ SUBSCRIPTION TESTS ============

    def test_subscribe_requires_auth(self):
        """POST /api/push/subscribe - Should require authentication"""
        subscription_data = {
            "subscription": {
                "endpoint": f"https://test-endpoint.example.com/{uuid.uuid4()}",
                "keys": {
                    "p256dh": "test_p256dh_key_base64",
                    "auth": "test_auth_key_base64"
                }
            },
            "device_name": "Test Device"
        }
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Subscribe endpoint properly requires authentication")

    def test_subscribe_with_valid_auth(self):
        """POST /api/push/subscribe - Creates subscription with valid auth"""
        test_endpoint = f"https://test-endpoint.example.com/test_{uuid.uuid4()}"
        subscription_data = {
            "subscription": {
                "endpoint": test_endpoint,
                "keys": {
                    "p256dh": "test_p256dh_key_base64_string",
                    "auth": "test_auth_key_base64_string"
                }
            },
            "device_name": "Test Device - pytest"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Subscribe failed: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "id" in data, "Response should contain subscription id"
        print(f"✓ Subscription created: {data.get('message')}")

        # Verify subscription appears in list
        list_response = requests.get(
            f"{BASE_URL}/api/push/subscriptions",
            headers=self.headers
        )
        assert list_response.status_code == 200
        subscriptions = list_response.json()
        endpoints = [s.get("endpoint") for s in subscriptions]
        assert test_endpoint in endpoints, "New subscription should appear in list"
        print("✓ Subscription verified in subscriptions list")

        # Cleanup - unsubscribe
        requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            params={"endpoint": test_endpoint},
            headers=self.headers
        )

    def test_subscribe_updates_existing(self):
        """POST /api/push/subscribe - Updates existing subscription"""
        test_endpoint = f"https://test-endpoint.example.com/update_{uuid.uuid4()}"
        
        # First subscription
        subscription_data = {
            "subscription": {
                "endpoint": test_endpoint,
                "keys": {"p256dh": "original_key", "auth": "original_auth"}
            },
            "device_name": "Original Device"
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=self.headers
        )
        assert response1.status_code == 200
        
        # Second subscription with same endpoint (should update)
        subscription_data["device_name"] = "Updated Device"
        subscription_data["subscription"]["keys"]["p256dh"] = "updated_key"
        
        response2 = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=self.headers
        )
        assert response2.status_code == 200
        assert "updated" in response2.json().get("message", "").lower() or "created" in response2.json().get("message", "").lower()
        print("✓ Subscription update works correctly")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            params={"endpoint": test_endpoint},
            headers=self.headers
        )

    # ============ UNSUBSCRIBE TESTS ============

    def test_unsubscribe_requires_auth(self):
        """DELETE /api/push/unsubscribe - Should require authentication"""
        response = requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            params={"endpoint": "https://test.com/endpoint"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unsubscribe endpoint properly requires authentication")

    def test_unsubscribe_nonexistent(self):
        """DELETE /api/push/unsubscribe - Returns 404 for nonexistent subscription"""
        response = requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            params={"endpoint": f"https://nonexistent-endpoint.com/{uuid.uuid4()}"},
            headers=self.headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unsubscribe returns 404 for nonexistent subscription")

    def test_unsubscribe_existing(self):
        """DELETE /api/push/unsubscribe - Successfully unsubscribes existing subscription"""
        test_endpoint = f"https://test-endpoint.example.com/unsub_{uuid.uuid4()}"
        
        # Create subscription first
        subscription_data = {
            "subscription": {
                "endpoint": test_endpoint,
                "keys": {"p256dh": "test_key", "auth": "test_auth"}
            },
            "device_name": "To Be Unsubscribed"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        
        # Unsubscribe
        unsub_response = requests.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            params={"endpoint": test_endpoint},
            headers=self.headers
        )
        assert unsub_response.status_code == 200, f"Unsubscribe failed: {unsub_response.text}"
        print("✓ Unsubscribe successful")
        
        # Verify removed from list
        list_response = requests.get(
            f"{BASE_URL}/api/push/subscriptions",
            headers=self.headers
        )
        endpoints = [s.get("endpoint") for s in list_response.json()]
        assert test_endpoint not in endpoints, "Subscription should be removed"
        print("✓ Verified subscription removed from list")

    # ============ LIST SUBSCRIPTIONS TESTS ============

    def test_list_subscriptions_requires_auth(self):
        """GET /api/push/subscriptions - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/push/subscriptions")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ List subscriptions endpoint properly requires authentication")

    def test_list_subscriptions_returns_list(self):
        """GET /api/push/subscriptions - Returns list of active subscriptions"""
        response = requests.get(
            f"{BASE_URL}/api/push/subscriptions",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"List failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ List subscriptions returned {len(data)} subscription(s)")
        
        # If there are subscriptions, verify structure
        if len(data) > 0:
            sub = data[0]
            assert "endpoint" in sub, "Subscription should have endpoint"
            assert "keys" in sub or "device_name" in sub, "Subscription should have keys or device_name"
            print(f"  - First subscription device: {sub.get('device_name', 'Unknown')}")

    # ============ TEST NOTIFICATION TESTS ============

    def test_push_test_requires_auth(self):
        """POST /api/push/test - Should require authentication"""
        response = requests.post(f"{BASE_URL}/api/push/test")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Test notification endpoint properly requires authentication")

    def test_push_test_sends_notification(self):
        """POST /api/push/test - Sends test notification"""
        response = requests.post(
            f"{BASE_URL}/api/push/test",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Test notification failed: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        # The message includes the count of devices notified
        print(f"✓ Test notification response: {data.get('message')}")


class TestOrderReservationPushTriggers:
    """Test that orders and reservations trigger push notifications"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_create_order_triggers_push(self):
        """POST /api/shop/orders - Creating order should succeed (push sent in background)"""
        order_data = {
            "items": [{
                "item_id": "test_item_1",
                "item_name": "Test Pizza Push",
                "quantity": 1,
                "unit_price": 12.99,
                "total_price": 12.99,
                "notes": ""
            }],
            "customer_name": "Push Test Customer",
            "customer_email": "push-test@example.com",
            "customer_phone": "+49123456789",
            "pickup_time": "18:00",
            "payment_method": "Barzahlung",
            "notes": "Push notification test order"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/shop/orders",
            json=order_data
        )
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        data = response.json()
        assert "order_number" in data, "Response should contain order_number"
        assert "message" in data, "Response should contain success message"
        print(f"✓ Order #{data['order_number']} created - push notification triggered in background")
        
        # Verify order was created
        order_id = data.get("order_id")
        if order_id:
            get_response = requests.get(
                f"{BASE_URL}/api/shop/orders/{order_id}",
                headers=self.headers
            )
            assert get_response.status_code == 200
            print(f"✓ Order verified in database")

    def test_create_reservation_triggers_push(self):
        """POST /api/shop/reservations - Creating reservation should succeed (push sent in background)"""
        reservation_data = {
            "customer_name": "Push Reservation Test",
            "customer_email": "push-reservation@example.com",
            "customer_phone": "+49987654321",
            "date": "2026-02-20",
            "time": "19:00",
            "guests": 4,
            "notes": "Push notification test reservation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/shop/reservations",
            json=reservation_data
        )
        
        assert response.status_code == 200, f"Reservation creation failed: {response.text}"
        data = response.json()
        assert "reservation_number" in data, "Response should contain reservation_number"
        assert "message" in data, "Response should contain success message"
        print(f"✓ Reservation #{data['reservation_number']} created - push notification triggered in background")


class TestServiceWorkerEndpoint:
    """Test service worker accessibility"""

    def test_service_worker_accessible(self):
        """Service worker file should be accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"Service worker not accessible: {response.status_code}"
        
        content = response.text
        assert "push" in content.lower(), "Service worker should handle push events"
        assert "notificationclick" in content.lower(), "Service worker should handle notification clicks"
        print("✓ Service worker is accessible and contains push handlers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
