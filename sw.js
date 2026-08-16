/* WashTime — Service Worker v5
   Поддерживает:
   - кэширование статики: приложение открывается офлайн
   - postMessage (NOTIFY) — локальные уведомления из браузера
   - push event — Web Push уведомления с сервера (работает даже с закрытым браузером)

   ВАЖНО про версию: при каждом изменении статики поднимай CACHE — старый кэш
   удаляется в activate, иначе пользователь останется на прошлой версии.
*/

const CACHE = 'washtime-v5';

// Файлы, без которых приложение не откроется
const CORE = [
  '/',
  '/index.html',
  '/lang.js',
  '/console.js',
  '/icons/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/svg/man.svg',
  '/svg/woman.svg'
];

// ──────────────────────────────────────────
// 0. Установка и очистка старых кэшей
// ──────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll падает целиком, если хоть один файл недоступен, поэтому кладём по одному
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(err => {
        console.warn('[sw] не удалось закэшировать', u, err);
      }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ──────────────────────────────────────────
// 1. Стратегия выдачи
//    API и внешние сервисы — только сеть, их кэшировать нельзя:
//    ответы одноразовые, а погода и подписки должны быть свежими.
//    Статика — сеть с откатом в кэш: онлайн всегда актуальная версия,
//    офлайн открывается последняя сохранённая.
// ──────────────────────────────────────────
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // open-meteo, nominatim, firebase
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Кладём в кэш только удачные ответы, иначе можно закэшировать 404
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => {
          if (hit) return hit;
          // Навигационный запрос без сети — отдаём стартовую страницу
          if (req.mode === 'navigate') return caches.match('/index.html');
          return new Response('', { status: 504, statusText: 'offline' });
        })
      )
  );
});

// ──────────────────────────────────────────
// 2. Локальные уведомления (браузер открыт)
// ──────────────────────────────────────────
self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
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
// 3. Web Push — с сервера, работает с закрытым браузером
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
// 4. Тап по уведомлению — открыть приложение
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
