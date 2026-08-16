// /api/push-subscribe.js
// Сохраняет Web Push подписку устройства в Firebase Realtime DB

import { isValidId } from './_verify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, deviceId } = req.body || {};
  if (!subscription || !deviceId) return res.status(400).json({ error: 'Missing fields' });

  // deviceId подставляется прямо в путь Firebase. Без проверки значение
  // вида "../families/xxx/members/yyy" уводило запись в произвольную ветку базы.
  if (!isValidId(deviceId)) return res.status(400).json({ error: 'Bad deviceId' });

  // подписка должна быть похожа на подписку, а не на произвольный объект
  if (typeof subscription !== 'object' || typeof subscription.endpoint !== 'string'
      || !/^https:\/\//.test(subscription.endpoint)) {
    return res.status(400).json({ error: 'Bad subscription' });
  }

  try {
    const dbUrl = process.env.FIREBASE_DB_URL;
    const apiKey = process.env.FIREBASE_API_KEY;

    // Сохранить подписку в Firebase: pushSubscriptions/{deviceId}
    const fbRes = await fetch(
      `${dbUrl}/pushSubscriptions/${deviceId}.json?auth=${apiKey}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          deviceId,
          updatedAt: Date.now()
        })
      }
    );

    if (!fbRes.ok) throw new Error('Firebase write failed');

    res.json({ success: true });
  } catch (e) {
    console.error('push-subscribe error:', e);
    res.status(500).json({ error: e.message });
  }
}
