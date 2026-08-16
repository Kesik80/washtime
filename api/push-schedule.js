// /api/push-schedule.js
// Планирует отправку Web Push уведомления через QStash

import { Client } from '@upstash/qstash';
import { verifyDevice, delaySeconds, clampText } from './_verify.js';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { endTime, title, body, deviceId, familyId } = req.body || {};
  if (!endTime || !deviceId) return res.status(400).json({ error: 'Missing fields' });

  // Вместо общего секрета из клиента — проверка, что устройство нам знакомо
  if (!(await verifyDevice(deviceId, familyId))) {
    return res.status(403).json({ error: 'Unknown device' });
  }

  const delaySec = delaySeconds(endTime);
  if (delaySec === null) {
    return res.status(400).json({ error: 'End time out of range' });
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://washtime.vercel.app';

    const result = await qstash.publishJSON({
      url: `${baseUrl}/api/push-send`,
      delay: delaySec,
      // Секрет живёт только между серверами: QStash перешлёт заголовок в push-send
      headers: { 'x-internal-secret': process.env.INTERNAL_SECRET || '' },
      body: {
        title: clampText(title, 60) || 'WashTime',
        body: clampText(body, 200) || '✅',
        deviceId
      }
    });

    res.json({ success: true, messageId: result.messageId });
  } catch (e) {
    console.error('push-schedule error:', e);
    res.status(500).json({ error: e.message });
  }
}
