// /api/push-schedule.js
// Планирует отправку Web Push уведомления через QStash (как /api/schedule для Telegram)

import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET) return res.status(403).end();

  const { endTime, title, body, deviceId } = req.body;
  if (!endTime || !deviceId) return res.status(400).json({ error: 'Missing fields' });

  const end = new Date(endTime);
  const delayMs = end.getTime() - Date.now();
  if (delayMs < 0) return res.status(400).json({ error: 'End time in the past' });

  const delaySec = Math.max(1, Math.round(delayMs / 1000));

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://washtime.vercel.app';

    const result = await qstash.publishJSON({
      url: `${baseUrl}/api/push-send`,
      delay: delaySec,
      body: { title: title || 'WashTime', body: body || '✅', deviceId }
    });

    res.json({ success: true, messageId: result.messageId });
  } catch (e) {
    console.error('push-schedule error:', e);
    res.status(500).json({ error: e.message });
  }
}
