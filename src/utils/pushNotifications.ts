import { supabase } from '../lib/supabase';

// This is the public VAPID key we generated earlier
const PUBLIC_VAPID_KEY = 'BJ8pAc_-tEVV0rui6uvgvY5v7byTGtdnwcUrGylkUoRqC_qE4H6IdtW4UCmP6AAcgMxyOWDxF87bzlaXZFpjvpE';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupPushNotifications(userId: string, role: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging is not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // Extract keys to save to database
    const subJSON = subscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
      throw new Error("Invalid subscription format");
    }

    // Save to Supabase
    const { error } = await (supabase as any).from('push_subscriptions').upsert({
      user_id: userId,
      role: role,
      endpoint: subJSON.endpoint,
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth
    }, { onConflict: 'endpoint' });

    if (error) {
      console.error('Error saving push subscription to Supabase:', error);
      return false;
    }

    console.log('Push notification successfully set up and saved');
    return true;
  } catch (error) {
    console.error('Error during setup of push notifications:', error);
    return false;
  }
}
