/* WashTime AI — Service Worker */

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'NOTIFY') return;
  e.waitUntil(
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: e.data.tag || 'washtime',
      renotify: true,
      silent: false
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
