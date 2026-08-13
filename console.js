/* ================================================
   mobile-console.js  v3.1
   Использование: <script src="console.js"></script>
   ================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════
     КОНСТАНТЫ И СОСТОЯНИЕ
  ══════════════════════════════ */
  var MAX_LINES = 500;
  var SLOW_NET  = 1500;
  var lines      = [];
  var filter     = 'ALL';
  var errorCount = 0;
  var autoScroll = true;
  var jsHistory  = [];
  var jsHistIdx  = -1;
  var counters   = { click: 0, net: 0 };

  /* ══════════════════════════════
     SVG ИКОНКИ
  ══════════════════════════════ */
  var ICO_COPY  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var ICO_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICO_TRASH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
  var ICO_JS    = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
  var ICO_RUN   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  var ICO_SRCH  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var ICO_UP    = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>';
  var ICO_CON   = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M5.646 9.146a.5.5 0 0 1 .708 0L8 10.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708zM14.5 13h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5V5.5zM5.5 4A1.5 1.5 0 0 0 4 5.5V6h12v-.5A1.5 1.5 0 0 0 14.5 4h-9zM4 7v7.5A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5V7H4z"/></svg>';

  /* ══════════════════════════════
     СТИЛИ
  ══════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    '#_mc_wrap{',
      '--b:#0d1117;--b2:#080b10;--br:#1e2d3d;--br2:#111a22;',
      '--ac:#00e5ff;--bd:#2a3a4a;--mu:#6a8a9a;--ts:#4a5a6a;',
      '--ib:#0d1117;--it:#e0e8f0;--sp:rgba(30,45,61,.4);',
    '}',
    '#_mc_wrap.mc-light{',
      '--b:#f2f4f7;--b2:#e4e8ed;--br:#bdc7d3;--br2:#cdd5de;',
      '--ac:#0077aa;--bd:#aab4be;--mu:#4a5a6a;--ts:#7a8a9a;',
      '--ib:#fff;--it:#111;--sp:rgba(100,120,140,.2);',
    '}',
    '#_mc_wrap{display:none;position:fixed;left:0;right:0;bottom:0;',
      'height:220px;min-height:50px;max-height:75vh;',
      'background:var(--b);border-top:2px solid var(--br);',
      'z-index:2147483646;font:12px/1.4 monospace;',
      'flex-direction:column;box-sizing:border-box;transition:background .25s,border-color .25s}',
    '#_mc_wrap.open{display:flex}',

    '#_mc_resize{width:100%;height:10px;flex-shrink:0;cursor:ns-resize;',
      'touch-action:none;display:flex;align-items:center;justify-content:center}',
    '#_mc_resize::after{content:"";width:40px;height:3px;',
      'background:var(--bd);border-radius:2px;transition:background .25s}',
    '#_mc_resize:hover::after{background:var(--ac)}',

    '#_mc_tb{background:var(--b2);border-bottom:1px solid var(--br);',
      'flex-shrink:0;transition:background .25s,border-color .25s}',
    '#_mc_r1{display:flex;align-items:center;padding:3px 8px;gap:4px}',
    '#_mc_title{font-size:10px;color:var(--ac);letter-spacing:.08em;',
      'flex:1;white-space:nowrap;overflow:hidden}',

    '#_mc_tb button{font:11px/1 monospace;background:transparent;',
      'border:1px solid var(--bd);border-radius:3px;color:var(--mu);',
      'cursor:pointer;padding:3px 6px;white-space:nowrap;',
      'display:inline-flex;align-items:center;gap:3px;',
      'transition:border-color .15s,color .15s,background .15s;',
      'margin:0;width:auto;height:auto;flex-shrink:0}',

    '#_mc_fa.on{border-color:var(--ac);color:var(--ac);background:rgba(0,180,220,.1)}',
    '#_mc_fa:hover{border-color:var(--ac);color:var(--ac)}',
    '#_mc_fc.on{border-color:#c9a0ff;color:#c9a0ff;background:rgba(200,160,255,.1)}',
    '#_mc_fc:hover{border-color:#c9a0ff;color:#c9a0ff}',
    '#_mc_fn.on{border-color:#2299cc;color:#2299cc;background:rgba(34,153,204,.1)}',
    '#_mc_fn:hover{border-color:#2299cc;color:#2299cc}',
    '#_mc_fls.on{border-color:#50b8a0;color:#50b8a0;background:rgba(80,184,160,.1)}',
    '#_mc_fls:hover{border-color:#50b8a0;color:#50b8a0}',
    '#_mc_fi.on{border-color:#88aacc;color:#88aacc;background:rgba(136,170,204,.1)}',
    '#_mc_fi:hover{border-color:#88aacc;color:#88aacc}',
    '#_mc_fjs.on{border-color:#e8b400;color:#e8b400;background:rgba(232,180,0,.1)}',
    '#_mc_fjs:hover{border-color:#e8b400;color:#e8b400}',
    '#_mc_fsr.on{border-color:#ff9966;color:#ff9966;background:rgba(255,153,102,.1)}',
    '#_mc_fsr:hover{border-color:#ff9966;color:#ff9966}',
    '#_mc_fas.on{border-color:#22cc88;color:#22cc88;background:rgba(34,204,136,.1)}',
    '#_mc_cpy:hover{border-color:var(--ac);color:var(--ac)}',
    '#_mc_cpy.ok{border-color:#22cc66;color:#22cc66}',
    '#_mc_clr:hover{border-color:#ff6b6b;color:#ff6b6b}',

    '#_mc_sr_row,#_mc_js_row{display:none;align-items:center;gap:5px;',
      'padding:4px 8px;border-top:1px solid var(--br2);',
      'background:var(--b2);transition:background .25s}',
    '#_mc_sr_row.open,#_mc_js_row.open{display:flex}',
    '#_mc_sr_in,#_mc_js_in{flex:1;min-width:0;background:var(--ib);',
      'border:1px solid var(--bd);border-radius:3px;color:var(--it);',
      'font:12px/1.4 monospace;padding:3px 6px;outline:none;',
      'transition:background .25s,color .25s,border-color .15s}',
    '#_mc_sr_in:focus{border-color:#ff9966}',
    '#_mc_js_in:focus{border-color:#e8b400}',
    '#_mc_sr_cnt{font-size:10px;color:var(--ts);white-space:nowrap;flex-shrink:0}',
    '#_mc_js_prompt{color:#e8b400;font-size:13px;flex-shrink:0}',
    '#_mc_js_run{padding:3px 7px;background:transparent;border:1px solid #e8b400;',
      'border-radius:3px;color:#e8b400;cursor:pointer;',
      'display:inline-flex;align-items:center;flex-shrink:0}',
    '#_mc_js_run:hover{background:rgba(232,180,0,.15)}',

    '#_mc_log{flex:1;overflow-y:auto;overflow-x:hidden;',
      'padding:4px 8px;-webkit-overflow-scrolling:touch;box-sizing:border-box}',
    '.mc-line{display:flex;gap:6px;padding:3px 0;',
      'border-bottom:1px solid var(--sp);word-break:break-all;user-select:text}',
    '.mc-line:last-child{border-bottom:none}',
    '.mc-line.hidden{display:none}',
    '.mc-line.slow{background:rgba(255,100,0,.1);border-radius:2px}',
    '.mc-ts{color:var(--ts);flex-shrink:0;white-space:nowrap}',
    '.mc-tag{flex-shrink:0}',
    '.mc-txt{flex:1;min-width:0}',
    '.t-log .mc-txt{color:#00aa55}',
    '.t-warn .mc-txt{color:#cc8800}',
    '.t-error .mc-txt{color:#dd4444}',
    '.t-net .mc-txt{color:#2299cc}',
    '.t-click .mc-txt{color:#9966cc}',
    '.t-ls .mc-txt{color:#229988}',
    '.t-info .mc-txt{color:#88aacc}',
    '.t-jsin .mc-txt{color:#cc8800}',
    '.t-jsout .mc-txt{color:var(--it)}',
    '.t-jserr .mc-txt{color:#dd4444}',
    '.mc-light .t-log .mc-txt{color:#007733}',
    '.mc-light .t-net .mc-txt{color:#005fa3}',
    '.mc-light .t-click .mc-txt{color:#6633aa}',
    '.mc-light .t-info .mc-txt{color:#336688}',
    '.mc-match{background:rgba(255,180,0,.4);border-radius:2px}',

    '#_mc_btn{position:fixed;left:3px;bottom:3px;z-index:2147483647;',
      'width:28px;height:28px;margin:0;padding:0;border:none;',
      'background:none;color:#888;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center}',
    '#_mc_btn.open{color:#00aacc}',
    '#_mc_badge{position:fixed;bottom:22px;left:16px;background:#dd4444;',
      'color:#fff;font:bold 9px/14px sans-serif;min-width:14px;height:14px;',
      'border-radius:7px;padding:0 3px;text-align:center;display:none;',
      'pointer-events:none;box-sizing:border-box;z-index:2147483647}'
  ].join('');
  document.head.appendChild(css);

  /* ══════════════════════════════
     HTML ПАНЕЛИ
  ══════════════════════════════ */
  var wrap = document.createElement('div');
  wrap.id = '_mc_wrap';
  wrap.innerHTML =
    '<div id="_mc_resize"></div>' +
    '<div id="_mc_tb">' +
      '<div id="_mc_r1">' +
        '<span id="_mc_title">console v3.1</span>' +
        '<button id="_mc_fa" class="on">ALL</button>' +
        '<button id="_mc_fc">\uD83D\uDDB1<span id="_mc_cc"></span></button>' +
        '<button id="_mc_fn">\uD83C\uDF10<span id="_mc_cn"></span></button>' +
        '<button id="_mc_fls">\uD83D\uDCBE</button>' +
        '<button id="_mc_fi">&#8505;&#65039;</button>' +
        '<button id="_mc_fjs">' + ICO_JS + '</button>' +
        '<button id="_mc_fsr">' + ICO_SRCH + '</button>' +
        '<button id="_mc_fas" class="on">' + ICO_UP + '</button>' +
        '<button id="_mc_cpy">' + ICO_COPY + '</button>' +
        '<button id="_mc_clr">' + ICO_TRASH + '</button>' +
      '</div>' +
      '<div id="_mc_sr_row">' +
        '<input id="_mc_sr_in" type="text" placeholder="\u041F\u043E\u0438\u0441\u043A\u2026" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
        '<span id="_mc_sr_cnt"></span>' +
      '</div>' +
      '<div id="_mc_js_row">' +
        '<span id="_mc_js_prompt">&gt;</span>' +
        '<input id="_mc_js_in" type="text" placeholder="JS\u2026" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
        '<button id="_mc_js_run">' + ICO_RUN + '</button>' +
      '</div>' +
    '</div>' +
    '<div id="_mc_log"></div>';

  var btn = document.createElement('button');
  btn.id = '_mc_btn';
  btn.innerHTML = ICO_CON + '<span id="_mc_badge"></span>';

  document.body.appendChild(wrap);
  document.body.appendChild(btn);

  /* ══════════════════════════════
     REFS
  ══════════════════════════════ */
  var logEl   = document.getElementById('_mc_log');
  var badge   = document.getElementById('_mc_badge');
  var cntC    = document.getElementById('_mc_cc');
  var cntN    = document.getElementById('_mc_cn');
  var srRow   = document.getElementById('_mc_sr_row');
  var srIn    = document.getElementById('_mc_sr_in');
  var srCnt   = document.getElementById('_mc_sr_cnt');
  var jsRow   = document.getElementById('_mc_js_row');
  var jsIn    = document.getElementById('_mc_js_in');
  var jsRun   = document.getElementById('_mc_js_run');
  var resizer = document.getElementById('_mc_resize');
  var cpyBtn  = document.getElementById('_mc_cpy');
  var clrBtn  = document.getElementById('_mc_clr');
  var fasBtn  = document.getElementById('_mc_fas');
  var faBtns  = [
    document.getElementById('_mc_fa'),
    document.getElementById('_mc_fc'),
    document.getElementById('_mc_fn'),
    document.getElementById('_mc_fls'),
    document.getElementById('_mc_fi')
  ];

  /* ══════════════════════════════
     АВТО-ТЕМА
  ══════════════════════════════ */
  function brightness(color) {
    var m = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return 0;
    return (+m[1] * 299 + +m[2] * 587 + +m[3] * 114) / 1000;
  }
  function detectTheme() {
    var light = brightness(getComputedStyle(document.body).backgroundColor) > 128;
    wrap.classList.toggle('mc-light', light);
    btn.style.color = light ? '#555' : '#888';
  }
  setTimeout(detectTheme, 0);
  new MutationObserver(detectTheme).observe(document.body, { attributes: true, attributeFilter: ['class','style','data-theme'] });
  new MutationObserver(detectTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class','style','data-theme','color-scheme'] });

  /* ══════════════════════════════
     УТИЛИТЫ
  ══════════════════════════════ */
  function ts() {
    var d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function(n){ return ('0'+n).slice(-2); }).join(':');
  }
  function ser(a) {
    if (a instanceof Error) return a.stack || a.message;
    if (a !== null && typeof a === 'object') { try { return JSON.stringify(a); } catch(e) { return String(a); } }
    return String(a);
  }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function updBadge() {
    badge.textContent = errorCount > 99 ? '99+' : errorCount;
    badge.style.display = errorCount > 0 ? 'block' : 'none';
  }
  function updCounters() {
    cntC.textContent = counters.click > 0 ? ' ' + counters.click : '';
    cntN.textContent = counters.net   > 0 ? ' ' + counters.net   : '';
  }
  function visible(type) {
    if (filter === 'ALL')   return type !== 'ls';
    if (filter === 'click') return type === 'click';
    if (filter === 'net')   return type === 'net';
    if (filter === 'ls')    return type === 'ls';
    if (filter === 'info')  return type === 'info';
    return false;
  }
  function applyFilter() {
    var q = srIn.value.trim().toLowerCase();
    lines.forEach(function(l) {
      var ok = visible(l.type) && (!q || l.text.toLowerCase().indexOf(q) >= 0);
      l.el.classList.toggle('hidden', !ok);
    });
    if (autoScroll) logEl.scrollTop = logEl.scrollHeight;
  }
  function setFilter(f, activeBtn) {
    filter = f;
    faBtns.forEach(function(b) { b.classList.remove('on'); });
    activeBtn.classList.add('on');
    applyFilter();
  }
  function addLine(type, tag, text, slow) {
    if (lines.length >= MAX_LINES) {
      var rem = lines.shift();
      if (rem.type === 'error' || rem.type === 'warn') { errorCount = Math.max(0, errorCount-1); updBadge(); }
      rem.el.remove();
    }
    if ((type === 'error' || type === 'warn') && !wrap.classList.contains('open')) {
      errorCount++; updBadge();
    }
    if (type === 'click') { counters.click++; updCounters(); }
    if (type === 'net')   { counters.net++;   updCounters(); }

    var q = srIn.value.trim().toLowerCase();
    var disp = esc(text);
    if (q && text.toLowerCase().indexOf(q) >= 0) {
      var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
      disp = disp.replace(re, function(m) { return '<span class="mc-match">' + m + '</span>'; });
    }

    var div = document.createElement('div');
    div.className = 'mc-line t-' + type + (slow ? ' slow' : '');
    if (!visible(type)) div.classList.add('hidden');
    div.innerHTML = '<span class="mc-ts">[' + ts() + ']</span><span class="mc-tag">' + tag + '</span><span class="mc-txt">' + disp + '</span>';
    logEl.appendChild(div);
    if (visible(type) && autoScroll) logEl.scrollTop = logEl.scrollHeight;
    lines.push({ type: type, el: div, text: text });
  }

  /* ══════════════════════════════
     ПЕРЕХВАТ CONSOLE
  ══════════════════════════════ */
  function patch(method, type, tag) {
    var orig = console[method];
    console[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      orig.apply(console, args);
      addLine(type, tag, args.map(ser).join(' '));
    };
  }
  patch('log',   'log',   '\uD83D\uDCCB');
  patch('warn',  'warn',  '\u26A0\uFE0F');
  patch('error', 'error', '\uD83D\uDD34');

  window.addEventListener('error', function(e) {
    var loc = e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '';
    addLine('error', '\uD83D\uDD34', e.message + loc);
  });
  window.addEventListener('unhandledrejection', function(e) {
    addLine('error', '\uD83D\uDD34', 'Promise: ' + ser(e.reason));
  });

  /* ══════════════════════════════
     КЛИКИ
  ══════════════════════════════ */
  document.addEventListener('click', function(e) {
    if (wrap.contains(e.target) || btn.contains(e.target)) return;
    if (e.target.closest && e.target.closest('a[href^="data:"]')) return;
    var el = e.target.closest && e.target.closest('button,a,input[type=submit],input[type=button],input[type=checkbox],input[type=radio],select,[data-log]');
    if (!el) return;
    var label, extra = '';
    if (el.tagName === 'A') {
      var href = el.getAttribute('href') || '';
      label = (el.textContent.trim().slice(0,30) || el.getAttribute('aria-label') || 'link');
      if (href) {
        try {
          var url = new URL(href, location.href);
          extra = url.origin !== location.origin ? ' \u2192 \uD83D\uDD17 ' + url.href.slice(0,50) : ' \u2192 ' + url.pathname + url.hash;
        } catch(x) { extra = ' \u2192 ' + href.slice(0,40); }
      }
    } else if (el.type === 'checkbox') {
      label = (el.checked ? '\u2611' : '\u2610') + ' ' + (el.name || el.id || 'checkbox');
    } else if (el.type === 'radio') {
      label = '\u25C9 ' + (el.name || el.id || 'radio') + ' = ' + el.value;
    } else if (el.tagName === 'SELECT') {
      label = '\u25BE ' + (el.name || el.id || 'select') + ' = "' + (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : el.value) + '"';
    } else {
      label = el.dataset.log || el.textContent.trim().slice(0,40) || el.getAttribute('aria-label') || el.name || el.value || '?';
    }
    var sel = (el.id ? '#' + el.id : el.classList.length ? '.' + Array.prototype.slice.call(el.classList,0,2).join('.') : el.tagName.toLowerCase()).slice(0,30);
    addLine('click', '\uD83D\uDDB1', '"' + label + '" [' + sel + ']' + extra);
  });

  /* ══════════════════════════════
     CHANGE — поля ввода
  ══════════════════════════════ */
  document.addEventListener('change', function(e) {
    if (wrap.contains(e.target)) return;
    var el = e.target;
    if (['INPUT','TEXTAREA','SELECT'].indexOf(el.tagName) < 0) return;
    if (['checkbox','radio','submit','button'].indexOf(el.type) >= 0) return;
    var name = el.name || el.id || el.tagName.toLowerCase();
    var val = el.value.length > 60 ? el.value.slice(0,60) + '\u2026' : el.value;
    addLine('info', '\u270F\uFE0F', name + ' = "' + val + '"');
  });

  /* ══════════════════════════════
     НАВИГАЦИЯ
  ══════════════════════════════ */
  var lastURL = location.href;
  function logNav(url, how) {
    if (url === lastURL) return;
    lastURL = url;
    addLine('info', '\uD83D\uDD00', how + ': ' + url.replace(location.origin,''));
  }
  window.addEventListener('hashchange', function() { logNav(location.href, 'hash'); });
  window.addEventListener('popstate',   function() { logNav(location.href, 'popstate'); });
  ['pushState','replaceState'].forEach(function(m) {
    var orig = history[m];
    history[m] = function(st, ti, url) {
      orig.apply(this, arguments);
      if (url) logNav(new URL(url, location.href).href, m);
    };
  });

  /* ══════════════════════════════
     СЕТЬ — fetch
  ══════════════════════════════ */
  var _fetch = window.fetch;
  window.fetch = function(resource, init) {
    var url = (typeof resource === 'string' ? resource : resource.url).replace(location.origin,'').slice(0,70);
    var method = ((init && init.method) || 'GET').toUpperCase();
    var t0 = Date.now();
    addLine('net', '\uD83C\uDF10', method + ' ' + url + ' \u2026');
    return _fetch.apply(this, arguments).then(function(res) {
      var ms = Date.now() - t0;
      addLine('net', '\uD83C\uDF10', method + ' ' + url + ' \u2192 ' + res.status + ' (' + ms + 'ms)' + (ms > SLOW_NET ? ' \u26A0 slow' : ''), ms > SLOW_NET);
      return res;
    }).catch(function(err) {
      addLine('net', '\uD83C\uDF10', method + ' ' + url + ' \u2717 ' + err.message);
      throw err;
    });
  };

  /* ══════════════════════════════
     СЕТЬ — XHR
  ══════════════════════════════ */
  var _XHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    var xhr = new _XHR(), _m, _u, _t0;
    var origOpen = xhr.open.bind(xhr);
    xhr.open = function(m, u) {
      _m = m.toUpperCase(); _u = String(u).replace(location.origin,'').slice(0,70);
      return origOpen.apply(this, arguments);
    };
    xhr.addEventListener('loadstart', function() { _t0 = Date.now(); addLine('net','\uD83C\uDF10', _m+' '+_u+' \u2026'); });
    xhr.addEventListener('load', function() {
      var ms = Date.now()-_t0;
      addLine('net','\uD83C\uDF10', _m+' '+_u+' \u2192 '+xhr.status+' ('+ms+'ms)'+(ms>SLOW_NET?' \u26A0 slow':''), ms>SLOW_NET);
    });
    xhr.addEventListener('error', function() { addLine('net','\uD83C\uDF10', _m+' '+_u+' \u2717 error'); });
    return xhr;
  };
  window.XMLHttpRequest.prototype = _XHR.prototype;

  /* ══════════════════════════════
     ГЕОЛОКАЦИЯ
  ══════════════════════════════ */
  if (navigator.geolocation) {
    var _geo = navigator.geolocation;
    var _gcp = _geo.getCurrentPosition.bind(_geo);
    var _gwp = _geo.watchPosition.bind(_geo);
    _geo.getCurrentPosition = function(ok, err, opts) {
      addLine('info','\uD83D\uDCCD','Geolocation: запрос\u2026');
      _gcp(function(p) {
        addLine('info','\uD83D\uDCCD', p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5)+' \xB1'+Math.round(p.coords.accuracy)+'m');
        if (ok) ok(p);
      }, function(e) {
        addLine('info','\uD83D\uDCCD','error: '+e.message);
        if (err) err(e);
      }, opts);
    };
    _geo.watchPosition = function(ok, err, opts) {
      addLine('info','\uD83D\uDCCD','watchPosition start');
      return _gwp(function(p) {
        addLine('info','\uD83D\uDCCD','watch: '+p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5)+' \xB1'+Math.round(p.coords.accuracy)+'m');
        if (ok) ok(p);
      }, function(e) {
        addLine('info','\uD83D\uDCCD','watch error: '+e.message);
        if (err) err(e);
      }, opts);
    };
  }

  /* ══════════════════════════════
     LOCALSTORAGE — live
  ══════════════════════════════ */
  var _lsSet = Storage.prototype.setItem;
  var _lsRem = Storage.prototype.removeItem;
  var _lsClr = Storage.prototype.clear;
  Storage.prototype.setItem = function(k, v) {
    _lsSet.call(this, k, v);
    if (this === localStorage) { var s = String(v); addLine('ls','\uD83D\uDCBE','set: '+k+' = '+(s.length>60?s.slice(0,60)+'\u2026':s)); }
  };
  Storage.prototype.removeItem = function(k) {
    _lsRem.call(this, k);
    if (this === localStorage) addLine('ls','\uD83D\uDCBE','remove: '+k);
  };
  Storage.prototype.clear = function() {
    _lsClr.call(this);
    if (this === localStorage) addLine('ls','\uD83D\uDCBE','clear()');
  };

  /* ══════════════════════════════
     ПРОИЗВОДИТЕЛЬНОСТЬ
  ══════════════════════════════ */
  function logPerf() {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (!nav) return;
    var dns  = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
    var ttfb = Math.round(nav.responseStart - nav.requestStart);
    var dom  = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
    var load = Math.round(nav.loadEventEnd - nav.startTime);
    addLine('info','\u26A1','DNS '+dns+'ms \u00B7 TTFB '+ttfb+'ms \u00B7 DOM '+dom+'ms \u00B7 Load '+load+'ms');
    if (performance.memory) {
      var mb = function(v){ return (v/1048576).toFixed(1); };
      addLine('info','\uD83E\uDDE0','JS Heap: '+mb(performance.memory.usedJSHeapSize)+'MB / '+mb(performance.memory.jsHeapSizeLimit)+'MB');
    }
  }

  /* ══════════════════════════════
     RESIZE / VISIBILITY / NET
  ══════════════════════════════ */
  var resizeT, scrollT;
  window.addEventListener('resize', function() {
    clearTimeout(resizeT);
    resizeT = setTimeout(function() { addLine('info','\uD83D\uDCD0','Viewport: '+window.innerWidth+'\xD7'+window.innerHeight+'px'); }, 400);
  });
  document.addEventListener('visibilitychange', function() {
    addLine('info', document.hidden ? '\uD83D\uDC41\u200D\uD83D\uDDE8' : '\uD83D\uDC41', 'Tab '+(document.hidden?'hidden':'visible'));
  });
  window.addEventListener('offline', function() { addLine('info','\uD83D\uDCE1','offline'); });
  window.addEventListener('online',  function() { addLine('info','\uD83D\uDCE1','online'); });
  document.addEventListener('scroll', function() {
    clearTimeout(scrollT);
    scrollT = setTimeout(function() {
      var el = document.scrollingElement || document.body;
      var pct = el.scrollHeight > el.clientHeight ? Math.round(el.scrollTop/(el.scrollHeight-el.clientHeight)*100) : 0;
      addLine('info','\u2195\uFE0F','Scroll: '+pct+'% ('+Math.round(el.scrollTop)+'px)');
    }, 600);
  }, { passive: true });

  /* ══════════════════════════════
     ФИЛЬТРЫ
  ══════════════════════════════ */
  var faBtnsMap = {
    '_mc_fa':  'ALL',
    '_mc_fc':  'click',
    '_mc_fn':  'net',
    '_mc_fls': 'ls',
    '_mc_fi':  'info'
  };
  Object.keys(faBtnsMap).forEach(function(id) {
    document.getElementById(id).addEventListener('click', function() {
      // LS — дополнительно показываем снапшот
      if (id === '_mc_fls' && filter !== 'ls') {
        var keys = Object.keys(localStorage);
        addLine('ls','\uD83D\uDCBE','\u2500\u2500\u2500 localStorage snapshot ('+keys.length+') \u2500\u2500\u2500');
        keys.forEach(function(k) {
          var v = localStorage.getItem(k);
          if (v && v.length > 80) v = v.slice(0,80)+'\u2026';
          addLine('ls','  ', k+' = '+v);
        });
      }
      setFilter(faBtnsMap[id], this);
    });
  });

  /* ══════════════════════════════
     ПОИСК
  ══════════════════════════════ */
  document.getElementById('_mc_fsr').addEventListener('click', function() {
    var open = srRow.classList.toggle('open');
    this.classList.toggle('on', open);
    if (open) srIn.focus();
    else { srIn.value = ''; applyFilter(); srCnt.textContent = ''; }
  });
  srIn.addEventListener('input', function() {
    applyFilter();
    var q = srIn.value.trim();
    srCnt.textContent = q ? lines.filter(function(l){ return !l.el.classList.contains('hidden'); }).length + ' найд.' : '';
  });

  /* ══════════════════════════════
     АВТОСКРОЛЛ
  ══════════════════════════════ */
  fasBtn.addEventListener('click', function() {
    autoScroll = !autoScroll;
    fasBtn.classList.toggle('on', autoScroll);
    if (autoScroll) logEl.scrollTop = logEl.scrollHeight;
  });

  /* ══════════════════════════════
     JS REPL
  ══════════════════════════════ */
  document.getElementById('_mc_fjs').addEventListener('click', function() {
    var open = jsRow.classList.toggle('open');
    this.classList.toggle('on', open);
    if (open) { jsIn.focus(); jsHistIdx = -1; }
  });
  function runJS() {
    var code = jsIn.value.trim();
    if (!code) return;
    jsHistory.unshift(code);
    if (jsHistory.length > 50) jsHistory.pop();
    jsHistIdx = -1;
    addLine('jsin','\u203A', code);
    jsIn.value = '';
    try {
      var result = (0, eval)(code); // eslint-disable-line no-eval
      if (result !== undefined) addLine('jsout','\u2190', ser(result));
    } catch(e) {
      addLine('jserr','\u2717', e.message);
    }
  }
  jsRun.addEventListener('click', runJS);
  jsIn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); runJS(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (jsHistIdx < jsHistory.length-1) jsIn.value = jsHistory[++jsHistIdx]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); jsIn.value = jsHistIdx > 0 ? jsHistory[--jsHistIdx] : (jsHistIdx=-1,''); }
  });

  /* ══════════════════════════════
     КОПИРОВАТЬ / ОЧИСТИТЬ
  ══════════════════════════════ */
  cpyBtn.addEventListener('click', function() {
    var text = lines.filter(function(l){ return !l.el.classList.contains('hidden'); }).map(function(l) {
      return (l.el.querySelector('.mc-ts').textContent||'') + ' ' +
             (l.el.querySelector('.mc-tag').textContent||'') + ' ' +
             (l.el.querySelector('.mc-txt').textContent||'');
    }).join('\n');
    navigator.clipboard.writeText(text).then(function() {
      cpyBtn.innerHTML = ICO_CHECK; cpyBtn.classList.add('ok');
      setTimeout(function() { cpyBtn.innerHTML = ICO_COPY; cpyBtn.classList.remove('ok'); }, 1500);
    }).catch(function() {
      cpyBtn.innerHTML = '\u2717';
      setTimeout(function() { cpyBtn.innerHTML = ICO_COPY; }, 1500);
    });
  });
  clrBtn.addEventListener('click', function() {
    logEl.innerHTML = '';
    lines = []; counters = { click:0, net:0 };
    errorCount = 0; updBadge(); updCounters();
  });

  /* ══════════════════════════════
     RESIZE ПАНЕЛИ
  ══════════════════════════════ */
  var resizing = false, startY, startH;
  resizer.addEventListener('pointerdown', function(e) {
    e.preventDefault(); resizing = true;
    startY = e.clientY; startH = wrap.offsetHeight;
    resizer.setPointerCapture(e.pointerId);
  });
  resizer.addEventListener('pointermove', function(e) {
    if (!resizing) return;
    e.preventDefault();
    var h = Math.max(50, Math.min(window.innerHeight * 0.75, startH - (e.clientY - startY)));
    wrap.style.height = h + 'px';
    btn.style.bottom = (h + 4) + 'px';
  });
  resizer.addEventListener('pointerup',     function() { resizing = false; });
  resizer.addEventListener('pointercancel', function() { resizing = false; });

  /* ══════════════════════════════
     ОТКРЫТЬ / ЗАКРЫТЬ
  ══════════════════════════════ */
  btn.addEventListener('click', function() {
    var open = wrap.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.style.bottom = open ? (wrap.offsetHeight + 4) + 'px' : '3px';
    if (open) { logEl.scrollTop = logEl.scrollHeight; errorCount = 0; updBadge(); }
  });

  /* ══════════════════════════════
     СТАРТ
  ══════════════════════════════ */
  addLine('log', '\uD83D\uDCCB', 'mobile console v3.1 ready');
  addLine('info', '\u26A1', 'Viewport: '+window.innerWidth+'\xD7'+window.innerHeight+'px \u00B7 '+navigator.userAgent.slice(0,80));

  if (document.readyState === 'complete') {
    setTimeout(logPerf, 0);
  } else {
    window.addEventListener('load', function() { setTimeout(logPerf, 100); });
  }

})();
