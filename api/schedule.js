// api/schedule.js — планирует Telegram через Upstash QStash
// QStash сам вызовет /api/notify в нужное время — телефон может быть выключен

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { endTime, message } = req.body;

  if (!endTime || !message) {
    return res.status(400).json({ error: 'Нужны endTime и message' });
  }

  const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

  if (!QSTASH_TOKEN) {
    return res.status(500).json({ error: 'Не настроен QSTASH_TOKEN' });
  }

  const endMs = new Date(endTime).getTime();
  const nowMs = Date.now();
  const delaySeconds = Math.max(0, Math.round((endMs - nowMs) / 1000));

  // URL захардкожен — не нужна переменная APP_URL
  const notifyUrl = 'https://washtime.vercel.app/api/notify';

  try {
    const qstashRes = await fetch(
      `https://qstash-eu-central-1.upstash.io/v2/publish/${notifyUrl}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Delay': `${delaySeconds}s`,
          'Upstash-Retries': '3',
        },
        body: JSON.stringify({ message })
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
