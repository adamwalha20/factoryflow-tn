self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: data.data || { url: '/' },
        requireInteraction: true // Keeps the notification visible until user interacts
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      // Fallback if not JSON
      const options = {
        body: event.data.text(),
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: { url: '/' },
        requireInteraction: true
      };
      event.waitUntil(
        self.registration.showNotification('Alerte AdPro', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
