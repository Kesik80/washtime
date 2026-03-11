// /api/vapid-config.js
// Отдаёт публичный VAPID ключ клиенту (приватный остаётся на сервере)

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || ''
  });
}
