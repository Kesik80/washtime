/* WashTime — Service Worker v4
   Поддерживает:
   - postMessage (NOTIFY) — локальные уведомления из браузера
   - push event — Web Push уведомления с сервера (работает даже с закрытым браузером)
*/

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// ──────────────────────────────────────────
// 1. Локальные уведомления (браузер открыт)
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// 2. Web Push — с сервера, работает с закрытым браузером
// ──────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'WashTime', body: '✅ Готово!' };
  try { data = e.data ? e.data.json() : data; }
  catch(err) { data.body = e.data ? e.data.text() : '✅'; }

  e.waitUntil(
    self.registration.showNotification(data.title || 'WashTime', {
      body: data.body || '✅',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: data.tag || 'washtime-finish',
      renotify: true,
      silent: false,
      data: { url: '/' }
    })
  );
});

// ──────────────────────────────────────────
// 3. Тап по уведомлению — открыть приложение
// ──────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const match = list.find(c => c.url.includes(self.location.origin));
      if (match) return match.focus();
      return clients.openWindow(url);
    })
  );
});
