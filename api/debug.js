// api/debug.js
// Проверка конфигурации. Раньше отдавала chat_id и начало токена бота
// кому угодно — теперь только факт «переменная задана», без значений.

export default (req, res) => {
  res.json({
    telegram_token: !!process.env.TELEGRAM_BOT_TOKEN,
    telegram_chat: !!process.env.TELEGRAM_CHAT_ID,
    vapid: !!process.env.VAPID_PRIVATE_KEY && !!process.env.VAPID_PUBLIC_KEY,
    qstash: !!process.env.QSTASH_TOKEN,
    firebase: !!process.env.FIREBASE_DB_URL,
    internal_secret: !!process.env.INTERNAL_SECRET
  });
};
