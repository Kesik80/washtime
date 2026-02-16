/* WashTime AI — Service Worker v2 */

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// Хранилище запланированных таймеров
const scheduled = {};

self.addEventListener('message', e => {
  if (!e.data) return;

  // Запланировать уведомление через delayMs миллисекунд
  if (e.data.type === 'SCHEDULE') {
    const { key, title, body, tag, delayMs } = e.data;

    // Отменяем предыдущий таймер для этой машины если был
    if (scheduled[key]) {
      clearTimeout(scheduled[key]);
      delete scheduled[key];
    }

    if (delayMs <= 0) return;

    scheduled[key] = setTimeout(() => {
      delete scheduled[key];
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [500, 200, 500, 200, 500],
        requireInteraction: true,
        tag: tag || 'washtime',
        renotify: true,
        silent: false
      });
    }, delayMs);
  }

  // Отменить запланированное уведомление (нажали Стоп)
  if (e.data.type === 'CANCEL') {
    const { key } = e.data;
    if (scheduled[key]) {
      clearTimeout(scheduled[key]);
      delete scheduled[key];
    }
  }

  // Показать уведомление немедленно (страница активна)
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
