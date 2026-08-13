// /api/push-send.js
// Отправляет Web Push уведомление устройству (вызывается QStash по таймеру)

import webpush from 'web-push';

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:admin@washtime.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Проверить подпись QStash или internal secret
  const secret = req.headers['x-internal-secret'];
  const qstashSig = req.headers['upstash-signature'];
  if (!qstashSig && secret !== process.env.INTERNAL_SECRET) {
    return res.status(403).end();
  }

  const { title, body, deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'Missing deviceId' });

  const dbUrl = process.env.FIREBASE_DB_URL;
  const apiKey = process.env.FIREBASE_API_KEY;

  try {
    // Получить подписку из Firebase
    const fbRes = await fetch(`${dbUrl}/pushSubscriptions/${deviceId}.json?auth=${apiKey}`);
    const data = await fbRes.json();

    if (!data || !data.subscription) {
      return res.status(404).json({ error: 'No subscription found for device' });
    }

    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    await webpush.sendNotification(
      data.subscription,
      JSON.stringify({
        title: title || 'WashTime',
        body: body || '✅',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'washtime-finish',
        renotify: true
      }),
      {
        // ГЛАВНОЕ ИСПРАВЛЕНИЕ:
        // без этого заголовка push-сервис Chrome отдаёт сообщение в FCM
        // с обычным приоритетом, и в Doze (экран выключен) доставка
        // откладывается до пробуждения устройства.
        urgency: 'high',
        // Уведомление о стирке бессмысленно через сутки.
        // Дефолт библиотеки — 4 недели.
        TTL: 3600
      }
    );

    res.json({ success: true });
  } catch (e) {
    // 404/410 = подписка отозвана браузером. Чистим, иначе накапливается мусор
    // и каждая отправка тратит время на заведомо мёртвый endpoint.
    if (e.statusCode === 404 || e.statusCode === 410) {
      try {
        await fetch(`${dbUrl}/pushSubscriptions/${deviceId}.json?auth=${apiKey}`, {
          method: 'DELETE'
        });
      } catch (_) { /* удаление не критично */ }
      return res.status(410).json({ error: 'Subscription expired, removed' });
    }

    console.error('push-send error:', e);
    res.status(500).json({ error: e.message });
  }
}
