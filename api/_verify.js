// api/_verify.js
// Общая проверка «запрос пришёл от известного устройства».
//
// Раньше эндпоинты защищал общий секрет, зашитый в index.html. Любой, кто
// открыл исходник страницы, мог планировать уведомления и жечь квоту QStash.
// Секрет в клиенте бесполезен по определению: всё, что знает браузер, публично.
//
// Поэтому проверяем не секрет, а то, что устройство действительно
// зарегистрировано: либо у него есть push-подписка, либо оно числится
// участником семьи. Оба идентификатора случайные и в исходнике не встречаются.
//
// Файл начинается с подчёркивания — Vercel не превращает его в маршрут.

const DB = process.env.FIREBASE_DB_URL;
const KEY = process.env.FIREBASE_API_KEY;

async function exists(path) {
  try {
    const r = await fetch(`${DB}/${path}.json?auth=${KEY}&shallow=true`);
    if (!r.ok) return false;
    const d = await r.json();
    return d !== null && d !== undefined;
  } catch (e) {
    console.warn('[verify] ошибка чтения', path, e.message);
    return false;
  }
}

// Идентификатор подставляется прямо в путь Firebase, поэтому в нём
// не должно быть ни слэшей, ни точек: иначе `../` уводит запись в чужую ветку.
export function isValidId(id) {
  return typeof id === 'string'
    && id.length >= 6 && id.length <= 64
    && /^[A-Za-z0-9_-]+$/.test(id);
}

export async function verifyDevice(deviceId, familyId) {
  if (!isValidId(deviceId)) return false;

  if (await exists(`pushSubscriptions/${deviceId}`)) return true;

  if (familyId && /^[A-Za-z0-9_-]{6,64}$/.test(familyId)) {
    if (await exists(`families/${familyId}/members/${deviceId}`)) return true;
  }
  return false;
}

// Окно планирования: не в прошлом и не дальше суток.
// Ограничивает и случайные ошибки, и попытки забить очередь надолго вперёд.
export function delaySeconds(endTime) {
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  if (ms < -60000) return null;                 // минута форы на рассинхрон часов
  if (ms > 24 * 60 * 60 * 1000) return null;
  return Math.max(1, Math.round(ms / 1000));
}

export function clampText(v, max) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
