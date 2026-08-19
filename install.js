/* install.js — предложение установки и регистрация service worker.
   Подключается на любой странице:  <script src="install.js"></script>

   Баннер показывается только там, где у <body> стоит data-install="banner".
   На странице игры он не нужен — там он закрывал бы пузыри.
   Service worker регистрируется везде.
*/
(function () {
  'use strict';

  // ── service worker ────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(() => console.log('[pwa] service worker готов'))
        .catch(e => console.warn('[pwa] service worker не встал:', e.message));
    });
  }

  if (document.body.dataset.install !== 'banner') return;

  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
  if (standalone) return;   // уже установлено

  const DISMISS_KEY = 'yeva.installDismissed';
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  try {
    const d = localStorage.getItem(DISMISS_KEY);
    if (d && Date.now() - parseInt(d, 10) < WEEK) return;   // закрыл — неделю не трогаем
  } catch (e) {}

  // ── разметка ──────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    .yv-install{
      position:fixed;left:12px;right:12px;z-index:400;
      bottom:calc(env(safe-area-inset-bottom,0px) + 16px);
      display:none;align-items:center;gap:12px;
      background:rgba(255,255,255,.86);
      -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
      border-radius:22px;padding:13px 15px;
      box-shadow:0 10px 34px rgba(30,61,87,.24);
      font-family:'Fredoka',ui-rounded,system-ui,sans-serif;color:#1E3D57;
      transform:translateY(140%);transition:transform .45s cubic-bezier(.32,1,.23,1);
    }
    .yv-install.show{display:flex;transform:translateY(0)}
    .yv-ic{font-size:31px;flex:none;line-height:1}
    .yv-tx{flex:1;min-width:0}
    .yv-t{font-size:14.5px;font-weight:600;line-height:1.25}
    .yv-s{font-size:12px;color:rgba(30,61,87,.6);margin-top:2px}
    .yv-btn{
      flex:none;padding:10px 17px;border:0;border-radius:13px;
      background:#2F8FC4;color:#fff;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;
    }
    .yv-x{flex:none;width:28px;height:28px;border:0;background:none;color:rgba(30,61,87,.4);font-size:15px;cursor:pointer;padding:0}
    .yv-ov{
      position:fixed;inset:0;z-index:900;background:rgba(20,45,70,.72);
      display:flex;align-items:flex-end;padding:14px;
      font-family:'Fredoka',ui-rounded,system-ui,sans-serif;
    }
    .yv-sheet{background:#fff;border-radius:26px;padding:24px;width:100%;color:#1E3D57}
    .yv-sheet h3{font-size:18px;font-weight:600;text-align:center;margin-bottom:18px}
    .yv-step{display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:14px;color:rgba(30,61,87,.75)}
    .yv-n{width:34px;height:34px;flex:none;border-radius:11px;background:#2F8FC4;color:#fff;display:grid;place-items:center;font-weight:600}
    .yv-ok{width:100%;margin-top:8px;padding:14px;border:0;border-radius:15px;background:#2F8FC4;color:#fff;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer}
  `;
  document.head.appendChild(css);

  const bar = document.createElement('div');
  bar.className = 'yv-install';
  bar.innerHTML = `
    <div class="yv-ic">🫧</div>
    <div class="yv-tx">
      <div class="yv-t">Установить YEVA</div>
      <div class="yv-s" id="yv-sub">Добавить на главный экран</div>
    </div>
    <button class="yv-btn" id="yv-go">Установить</button>
    <button class="yv-x" id="yv-x">✕</button>`;
  document.body.appendChild(bar);

  const $ = id => document.getElementById(id);
  const show = () => requestAnimationFrame(() => bar.classList.add('show'));
  const hide = () => bar.classList.remove('show');

  $('yv-x').onclick = () => {
    hide();
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|chrome/i.test(navigator.userAgent);
    if (!isSafari) return;   // на iPhone установить можно только из Safari
    $('yv-sub').textContent = 'Через кнопку «Поделиться»';
    $('yv-go').textContent = 'Как?';
    $('yv-go').onclick = iosGuide;
    setTimeout(show, 2000);
  } else {
    let deferred = null;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferred = e;
      $('yv-sub').textContent = 'Откроется на весь экран, без адресной строки';
      setTimeout(show, 1500);
    });
    $('yv-go').onclick = async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      hide();
    };
    window.addEventListener('appinstalled', () => {
      hide();
      console.log('[pwa] установлено');
    });
  }

  function iosGuide() {
    const ov = document.createElement('div');
    ov.className = 'yv-ov';
    ov.innerHTML = `
      <div class="yv-sheet">
        <h3>Установка на iPhone</h3>
        <div class="yv-step"><div class="yv-n">1</div><div>Нажми <b>«Поделиться»</b> (↑) внизу Safari</div></div>
        <div class="yv-step"><div class="yv-n">2</div><div>Выбери <b>«На экран Домой»</b></div></div>
        <div class="yv-step"><div class="yv-n">3</div><div>Нажми <b>«Добавить»</b></div></div>
        <button class="yv-ok">Понятно</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.yv-ok').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
  }
})();
