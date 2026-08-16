// api/push-cancel.js
// Отменяет ранее запланированные в QStash сообщения (уведомление об окончании
// и напоминание о белье), если цикл остановили или перезапустили.
//
// QStash не умеет отзывать сообщение «по смыслу» — только по его messageId,
// поэтому идентификаторы сохраняются на устройстве при планировании.

import { Client } from '@upstash/qstash';
import { verifyDevice } from './_verify.js';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ids, deviceId, familyId } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Missing ids' });
  }
  if (ids.length > 20) return res.status(400).json({ error: 'Too many ids' });

  if (!(await verifyDevice(deviceId, familyId))) {
    return res.status(403).json({ error: 'Unknown device' });
  }

  const results = await Promise.all(ids.map(async id => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return false;
    try {
      await qstash.messages.delete(id);
      return true;
    } catch (e) {
      // 404 = сообщение уже отправлено или отменено; это не ошибка
      const code = e && (e.status || e.statusCode);
      if (code === 404) return true;
      console.warn('push-cancel:', id, e.message);
      return false;
    }
  }));

  res.json({ success: true, cancelled: results.filter(Boolean).length });
}
