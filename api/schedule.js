// api/schedule.js — принимает время окончания и шлёт Telegram в нужный момент
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { endTime, message } = req.body;

  if (!endTime || !message) {
    return res.status(400).json({ error: 'Нужны endTime и message' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Сервер не настроен' });
  }

  const endMs = new Date(endTime).getTime();
  const nowMs = Date.now();
  const delayMs = endMs - nowMs;

  // Не больше 14 минут (лимит Vercel Serverless — 15 сек на хобби, но используем подход иначе)
  // Отправляем сразу если время уже прошло или осталось меньше 2 секунд
  if (delayMs > 840000) {
    return res.status(400).json({ error: 'Слишком далеко — максимум 14 минут' });
  }

  // Ждём нужное время прямо на сервере
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `✅ ${message}`,
          disable_web_page_preview: true
        })
      }
    );

    if (telegramRes.ok) {
      res.status(200).json({ success: true });
    } else {
      const err = await telegramRes.text();
      res.status(500).json({ error: err });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
