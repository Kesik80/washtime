// api/debug2.js — временный, удалить после отладки
export default (req, res) => {
  res.json({
    QSTASH_TOKEN_set: !!process.env.QSTASH_TOKEN,
    QSTASH_TOKEN_preview: process.env.QSTASH_TOKEN?.substring(0, 15) + '...',
    QSTASH_CURRENT_set: !!process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_set: !!process.env.QSTASH_NEXT_SIGNING_KEY,
    APP_URL: process.env.APP_URL,
    INTERNAL_SECRET_set: !!process.env.INTERNAL_SECRET,
  });
};
