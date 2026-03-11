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

  try {
    // Получить подписку из Firebase
    const dbUrl = process.env.FIREBASE_DB_URL;
    const apiKey = process.env.FIREBASE_API_KEY;
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
      })
    );

    res.json({ success: true });
  } catch (e) {
    console.error('push-send error:', e);
    res.status(500).json({ error: e.message });
  }
}
