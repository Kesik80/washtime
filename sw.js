/* WashTime AI — Service Worker v3
   ВАЖНО: setTimeout в SW не работает при заблокированном экране на Android.
   Уведомления теперь инициируются КЛИЕНТОМ (index.html) через postMessage,
   а SW только их показывает. */

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// Показать уведомление немедленно (вызывается из index.html через postMessage)
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'NOTIFY') {
    const { title, body, tag } = e.data;
    e.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [500, 200, 500, 200, 500],
        requireInteraction: true,
        tag: tag || 'washtime',
        renotify: true,
        silent: false
      })
    );
  }
});

// Тап по уведомлению — открываем приложение
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
