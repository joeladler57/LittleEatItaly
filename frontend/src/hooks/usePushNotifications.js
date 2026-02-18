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

export const usePushNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
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

  const subscribe = useCallback(async (deviceName = 'Mein Gerät') => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }

    setIsLoading(true);

    try {
      // Request notification permission
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

      // Send subscription to backend
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API}/api/push/subscribe`,
        {
          subscription: {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth'))))
            }
          },
          device_name: deviceName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from backend
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/api/push/unsubscribe`, {
        params: { endpoint: subscription.endpoint },
        headers: { Authorization: `Bearer ${token}` }
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

  const testNotification = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const { data } = await axios.post(
        `${API}/api/push/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification
  };
};
