/**
 * Cufy Universal Mobile & Desktop Native Notification Utility
 * Supports ServiceWorkerRegistration.showNotification for Android/mobile PWA
 * with fallback to desktop Window Notification API and in-app sound chime.
 */

// Soft pleasant notification chime (D5 -> A5)
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Audio may be blocked by browser autoplay policy until user gesture
  }
}

// Request Notification Permission from User
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';

  try {
    const res = await Notification.requestPermission();
    return res;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission || 'denied';
  }
}

// Send Native Push Notification (appears in Android status bar & desktop banner)
export async function sendNativeNotification(title, body, options = {}) {
  // 1. Always play soft chime
  playNotificationChime();

  // 2. Persist to in-app notification drawer
  try {
    const stored = localStorage.getItem('cufy_notifications');
    const list = stored ? JSON.parse(stored) : [];
    list.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      message: body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      tag: options.tag || 'general'
    });
    localStorage.setItem('cufy_notifications', JSON.stringify(list.slice(0, 30)));
    window.dispatchEvent(new CustomEvent('cufy_new_notification'));
  } catch (e) {}

  // 3. Check browser notification support & permission
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {}
  }

  if (permission !== 'granted') {
    console.log('[Notification] Permission not granted:', permission);
    return false;
  }

  const notifOptions = {
    body,
    icon: '/photos/cufylogo.jpg?v=2',
    badge: '/photos/cufylogo.jpg?v=2',
    vibrate: [200, 100, 200, 100, 200],
    tag: options.tag || 'cufy-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: options.url || '/',
      dateOfArrival: Date.now()
    },
    ...options
  };

  // 4. Primary for Android / Mobile PWA: ServiceWorkerRegistration.showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        console.log('[Notification] Dispatched via Service Worker on mobile/PWA');
        return true;
      }
    } catch (swErr) {
      console.warn('[Notification] Service Worker dispatch note:', swErr);
    }
  }

  // 5. Secondary fallback: Desktop Window Notification API
  try {
    new Notification(title, notifOptions);
    console.log('[Notification] Dispatched via Window Notification constructor');
    return true;
  } catch (winErr) {
    console.warn('[Notification] Window constructor fallback note:', winErr);
  }

  return false;
}
