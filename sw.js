/* YEVA — Service Worker v1

   Стратегия намеренно разная для разного добра:

   HTML и JS      — сеть, откат в кэш. Ты правишь игру каждый день,
                    и кэш-первым ребёнок играл бы во вчерашнюю версию.
   mp3 и картинки — кэш, откат в сеть. Имя файла = содержимое,
                    katze.mp3 никогда не меняется, тянуть её повторно незачем.
   /api/          — только сеть, не кэшируется вообще.

   ВАЖНО: поднимай CACHE при изменении списка CORE, иначе старый кэш
   останется жить. Обычные правки html/js подхватываются сами.
*/

const CACHE = 'yeva-v1';

const CORE = [
  '/',
  '/index.html',
  '/bubbles.html',
  '/words.js',
  '/console.js',
  '/install.js',
  '/icons/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // по одному: addAll падает целиком, если хоть один файл недоступен
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(err => {
        console.warn('[sw] не закэшировал', u, err);
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

const isAsset = url => /\.(mp3|m4a|ogg|png|jpg|jpeg|svg|ico|woff2?)$/i.test(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // шрифты Google, cdnjs
  if (url.pathname.startsWith('/api/')) return;      // озвучка и коммиты — только сеть

  // Звуки и картинки: сначала кэш
  if (isAsset(url)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit))
    );
    return;
  }

  // Всё остальное: сначала сеть, офлайн — из кэша
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});
