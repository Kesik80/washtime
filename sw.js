// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Готово!', body: 'Процесс завершён.' };
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    vibrate: [300, 200, 300],
    requireInteraction: true,
    tag: 'wash-complete'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        clientList[0].focus();
        clientList[0].postMessage({ type: 'stopMelody' });
      } else {
        return clients.openWindow('/');
      }
    })
  );
});
