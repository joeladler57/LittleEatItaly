import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Convert base64 to Uint8Array for push subscription
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const useCustomerPushNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }

    setIsLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Benachrichtigungen wurden nicht erlaubt');
      }

      // Get VAPID public key from server
      const { data: vapidData } = await axios.get(`${API}/api/push/vapid-key`);
      const vapidPublicKey = vapidData.publicKey;

      if (!vapidPublicKey) {
        throw new Error('Push-Server nicht konfiguriert');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Get customer ID if logged in
      const customerToken = localStorage.getItem('customer_token');
      let customerId = null;
      
      if (customerToken) {
        try {
          const payload = JSON.parse(atob(customerToken.split('.')[1]));
          customerId = payload.sub;
        } catch (e) {
          console.log('Could not parse customer token');
        }
      }

      // Send subscription to backend
      await axios.post(`${API}/api/push/customer/subscribe`, {
        subscription: {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth'))))
          }
        },
        customer_id: customerId
      });

      setSubscription(pushSubscription);
      return true;

    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      
      await axios.delete(`${API}/api/push/customer/unsubscribe`, {
        params: { endpoint: subscription.endpoint }
      });

      setSubscription(null);
      return true;

    } catch (error) {
      console.error('Unsubscribe failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    isLoading,
    subscribe,
    unsubscribe
  };
};
