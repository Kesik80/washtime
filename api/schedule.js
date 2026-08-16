// api/schedule.js — планирует Telegram через Upstash QStash
// QStash сам вызовет /api/notify в нужное время — телефон может быть выключен

import { verifyDevice, delaySeconds, clampText } from './_verify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { endTime, message, deviceId, familyId } = req.body || {};
  if (!endTime || !message) {
    return res.status(400).json({ error: 'Нужны endTime и message' });
  }

  // Раньше эндпоинт был открыт полностью: кто угодно мог слать сообщения
  // в чужой Telegram с любой задержкой.
  if (!(await verifyDevice(deviceId, familyId))) {
    return res.status(403).json({ error: 'Unknown device' });
  }

  const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
  if (!QSTASH_TOKEN) {
    return res.status(500).json({ error: 'Не настроен QSTASH_TOKEN' });
  }

  const delaySec = delaySeconds(endTime);
  if (delaySec === null) {
    return res.status(400).json({ error: 'End time out of range' });
  }

  const notifyUrl = 'https://washtime.vercel.app/api/notify';

  try {
    const qstashRes = await fetch(
      `https://qstash-eu-central-1.upstash.io/v2/publish/${notifyUrl}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Delay': `${delaySec}s`,
          'Upstash-Retries': '3',
          // QStash перешлёт этот заголовок в /api/notify под именем x-internal-secret
          'Upstash-Forward-x-internal-secret': process.env.INTERNAL_SECRET || ''
        },
        body: JSON.stringify({ message: clampText(message, 300) })
      }
    );

    if (qstashRes.ok) {
      const data = await qstashRes.json();
      res.status(200).json({ success: true, messageId: data.messageId });
    } else {
      const err = await qstashRes.text();
      console.error('QStash error:', err);
      res.status(500).json({ error: 'QStash не принял задачу: ' + err });
    }
  } catch (error) {
    console.error('Network error:', error);
    res.status(500).json({ error: 'Сетевая ошибка: ' + error.message });
  }
}
