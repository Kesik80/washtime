// api/notify.js — отправляет Telegram
// Вызывается либо из QStash по расписанию, либо напрямую из приложения

import { verifyDevice, clampText } from './_verify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { message, deviceId, familyId } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Неверный формат сообщения' });
  }

  // Два законных источника вызова:
  //  1. QStash — пересылает серверный секрет заголовком, клиент его не видит;
  //  2. само приложение — тогда проверяем, что устройство нам известно.
  // Раньше эндпоинт принимал вообще любой запрос: открытый ретранслятор в чужой Telegram.
  const secret = req.headers['x-internal-secret'];
  const fromQStash = process.env.INTERNAL_SECRET && secret === process.env.INTERNAL_SECRET;

  if (!fromQStash && !(await verifyDevice(deviceId, familyId))) {
    return res.status(403).json({ error: 'Unknown device' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Отсутствуют переменные окружения');
    return res.status(500).json({ error: 'Сервер не настроен' });
  }

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `✅ ${clampText(message, 300)}`,
          disable_web_page_preview: true
        })
      }
    );

    if (telegramRes.ok) {
      res.status(200).json({ success: true });
    } else {
      const err = await telegramRes.text();
      console.error('Telegram API error:', err);
      res.status(500).json({ error: 'Не удалось отправить в Telegram' });
    }
  } catch (error) {
    console.error('Network error:', error);
    res.status(500).json({ error: 'Сетевая ошибка' });
  }
}
