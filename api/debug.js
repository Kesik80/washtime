// api/debug.js
export default (req, res) => {
  res.json({
    token_set: !!process.env.TELEGRAM_BOT_TOKEN,
    chat_set: !!process.env.TELEGRAM_CHAT_ID,
    token_preview: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...',
    chat_id: process.env.TELEGRAM_CHAT_ID
  });
};
