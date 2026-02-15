// src/app/widget.js/route.ts
export const runtime = 'edge';

const BUILD_MARK = 'wjs-2026-01-27a';

function js() {
  return `/* tikozap widget build: ${BUILD_MARK} */
(() => {
  if (window.__TIKOZAP_WIDGET_LOADED__) return;
  window.__TIKOZAP_WIDGET_LOADED__ = true;

  const script =
    document.currentScript ||
    [...document.getElementsByTagName('script')].find((s) =>
      /\\/widget\\.js(\\?|$)/.test(s.src || '')
    ) ||
    [...document.getElementsByTagName('script')].slice(-1)[0];

  const KEY =
    (script && (script.getAttribute('data-tikozap-key') || script.getAttribute('data-tikozap-public-key'))) ||
    window.TIKOZAP_PUBLIC_KEY;

  if (!KEY) {
    console.warn('[TikoZap] Missing public key. Add data-tikozap-key="..." to the widget <script>.');
    return;
  }

  let API_BASE =
    (script && script.getAttribute('data-tikozap-api-base')) ||
    window.TIKOZAP_API_BASE;

  if (!API_BASE) {
    try {
      const src = (script && script.src) || '';
      const u = new URL(src);
      const isLocal = (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
      API_BASE = isLocal ? u.origin : 'https://api.tikozap.com';
    } catch {
      API_BASE = 'https://api.tikozap.com';
    }
  }

  const SETTINGS_URL = API_BASE + '/api/widget/public/settings?key=' + encodeURIComponent(KEY);
  const MESSAGE_URL = API_BASE + '/api/widget/public/message';
  const THREAD_URL_BASE = API_BASE + '/api/widget/public/thread?key=' + encodeURIComponent(KEY) + '&conversationId=';

  const SUBJECT = (script && script.getAttribute('data-tikozap-subject')) || 'Website chat';
  const TAGS = (script && script.getAttribute('data-tikozap-tags')) || 'widget';
  const CHANNEL = (script && script.getAttribute('data-tikozap-channel')) || 'web';
  const CUSTOMER_NAME = (script && script.getAttribute('data-tikozap-customer-name')) || '';
  const AUTO_OPEN = (script && script.getAttribute('data-tikozap-open')) === '1';

  // Optional: language override for speech recognition
  const SPEECH_LANG = (script && script.getAttribute('data-tikozap-lang')) || '';

  let pollTimer = null;
  let lastSig = '';

  const safeHex = (v) => {
    const raw = String(v || '').trim();
    const x = raw.startsWith('#') ? raw : ('#' + raw);
    return /^#[0-9a-fA-F]{6}$/.test(x) ? x : '#111111';
  };

  const cidKey = 'tz_widget_cid_' + KEY;

  const css =
    ".tz-bubble{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;cursor:pointer;z-index:999999;border:1px solid rgba(0,0,0,.12)}" +
    ".tz-panel{position:fixed;right:18px;bottom:86px;width:360px;max-width:calc(100% - 36px);background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;z-index:999999;box-shadow:0 12px 30px rgba(0,0,0,.12);font-family:ui-sans-serif,system-ui,-apple-system}" +
    ".tz-hd{padding:12px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px}" +
    ".tz-title{font-weight:900;font-size:13px}" +
    ".tz-sub{font-size:11px;opacity:.7;margin-top:2px}" +
    ".tz-status{font-size:11px;opacity:.75;margin-top:4px;display:none}" +
    ".tz-actions{display:flex;gap:8px;align-items:center}" +
    ".tz-btn{font-size:12px;border:1px solid #e5e7eb;border-radius:10px;padding:6px 8px;background:#fff;cursor:pointer}" +
    ".tz-msgs{height:260px;overflow:auto;padding:12px;background:#f8fafc}" +
    ".tz-row{display:flex;margin:8px 0}" +
    ".tz-row.me{justify-content:flex-end}" +
    ".tz-bub{max-width:85%;border-radius:14px;padding:10px 12px;font-size:13px;line-height:1.4;white-space:pre-wrap;border:1px solid #e5e7eb}" +
    ".tz-bub.me{background:#fff;color:#111827}" +
    ".tz-bub.ai{background:#111827;color:#fff}" +
    ".tz-ft{padding:10px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:#fff;align-items:center}" +
    ".tz-in{flex:1;border-radius:12px;border:1px solid #e5e7eb;padding:10px 12px;font-size:13px}" +
    ".tz-mic{width:44px;min-width:44px;height:42px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}" +
    ".tz-mic[aria-pressed='true']{background:#111827;color:#fff;border-color:#111827}" +
    ".tz-mic[disabled]{opacity:.6;cursor:not-allowed}" +
    ".tz-send{border-radius:12px;border:1px solid #e5e7eb;padding:10px 12px;background:#111827;color:#fff;font-weight:900;cursor:pointer}" +
    ".tz-send[disabled]{opacity:.6;cursor:not-allowed}";

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.className = 'tz-bubble';
  bubble.textContent = '💬';

  const panel = document.createElement('div');
  panel.className = 'tz-panel';
  panel.style.display = 'none';

  const hd = document.createElement('div');
  hd.className = 'tz-hd';

  const hdLeft = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'tz-title';
  title.textContent = 'Store Assistant';
  const sub = document.createElement('div');
  sub.className = 'tz-sub';
  sub.textContent = 'Online';

  const status = document.createElement('div');
  status.className = 'tz-status';
  status.textContent = '';

  hdLeft.appendChild(title);
  hdLeft.appendChild(sub);
  hdLeft.appendChild(status);

  const actions = document.createElement('div');
  actions.className = 'tz-actions';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'tz-btn';
  resetBtn.textContent = 'Reset';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'tz-btn';
  closeBtn.textContent = '×';

  actions.appendChild(resetBtn);
  actions.appendChild(closeBtn);

  hd.appendChild(hdLeft);
  hd.appendChild(actions);

  const msgs = document.createElement('div');
  msgs.className = 'tz-msgs';

  const ft = document.createElement('div');
  ft.className = 'tz-ft';

  const input = document.createElement('input');
  input.className = 'tz-in';
  input.placeholder = 'Type a message…';

  const micBtn = document.createElement('button');
  micBtn.className = 'tz-mic';
  micBtn.type = 'button';
  micBtn.textContent = '🎤';
  micBtn.setAttribute('aria-label', 'Tap to speak');
  micBtn.setAttribute('aria-pressed', 'false');

  const sendBtn = document.createElement('button');
  sendBtn.className = 'tz-send';
  sendBtn.textContent = 'Send';

  ft.appendChild(input);
  ft.appendChild(micBtn);
  ft.appendChild(sendBtn);

  panel.appendChild(hd);
  panel.appendChild(msgs);
  panel.appendChild(ft);

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

let settings = null;
let conversationId = localStorage.getItem(cidKey) || '';
let busy = false;
let locked = false;        // 👈 paywall/disabled state
let localMsgs = [];        // 👈 keep current render state

  const setStatus = (t) => {
    const s = String(t || '').trim();
    status.textContent = s;
    status.style.display = s ? 'block' : 'none';
  };

const render = (arr) => {
  localMsgs = Array.isArray(arr) ? arr : [];
  msgs.innerHTML = '';
  localMsgs.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'tz-row ' + (m.role === 'customer' ? 'me' : 'ai');
    const bub = document.createElement('div');
    bub.className = 'tz-bub ' + (m.role === 'customer' ? 'me' : 'ai');
    bub.textContent = m.content || '';
    row.appendChild(bub);
    msgs.appendChild(row);
  });
  msgs.scrollTop = msgs.scrollHeight;
};

const appendMsg = (role, content) => {
  localMsgs = localMsgs.concat([{ role, content }]);
  render(localMsgs);
};

const isPaywall = (res, data) =>
  (res && res.status === 402) || (data && data.code === 'PAYWALL');

const lockWidget = (data) => {
  locked = true;
  stopPolling();

  // disable controls
  input.setAttribute('disabled', 'true');
  sendBtn.setAttribute('disabled', 'true');
  micBtn.setAttribute('disabled', 'true');

  setStatus('Chat unavailable');

  // friendly end-user copy (don’t say “upgrade”)
  const msg =
    'Sorry—this chat is temporarily unavailable right now. Please try again later.';
  appendMsg('assistant', msg);

  // keep console detail for debugging
  try {
    console.warn('[TikoZap] paywall', data);
  } catch {}
};

  const greet = (text) => render(text ? [{ role: 'assistant', content: text }] : []);

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function syncThread() {
    if (!conversationId) return;

    try {
      const url =
        THREAD_URL_BASE +
        encodeURIComponent(conversationId) +
        '&t=' + Date.now();

      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || !data.ok) return;

      const arr = Array.isArray(data.messages) ? data.messages : [];
      const filtered = arr
        .filter((x) => x && (x.role === 'customer' || x.role === 'assistant' || x.role === 'staff'))
        .map((x) => ({ role: x.role, content: x.content }));

      const sig = filtered.map((m) => m.role + ':' + (m.content || '')).join('|');
      if (sig !== lastSig) {
        lastSig = sig;
        render(filtered);
      }
    } catch {
      // ignore transient polling errors
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(syncThread, 2000);
  }

  // --- Tap-to-Speak (Web Speech API) ---
  let stopListening = null;

  function initSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    const host = (location && location.hostname) ? location.hostname : '';
    const isLocalHost = (host === 'localhost' || host === '127.0.0.1');
    const isSecure =
      (typeof window.isSecureContext === 'boolean' ? window.isSecureContext : (location && location.protocol === 'https:')) ||
      isLocalHost;

    if (!SR || !isSecure) {
      micBtn.style.display = 'none';
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = (SPEECH_LANG || navigator.language || 'en-US');

    let listening = false;
    let finalText = '';

    const setPressed = (v) => micBtn.setAttribute('aria-pressed', v ? 'true' : 'false');

    function start() {
      if (busy) return;
      finalText = '';
      try {
        rec.start(); // must be inside a user gesture
      } catch (e) {
        setStatus('Voice start failed');
        listening = false;
        setPressed(false);
      }
    }

    function stop() {
      try { rec.stop(); } catch {}
    }

    stopListening = stop;

    micBtn.addEventListener('click', () => {
      if (busy) return;
      if (listening) stop();
      else start();
    });

    rec.onstart = () => {
      listening = true;
      setPressed(true);
      setStatus('Listening…');
    };

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = (e.results[i] && e.results[i][0] && e.results[i][0].transcript) ? e.results[i][0].transcript : '';
        if (e.results[i].isFinal) finalText += txt;
        else interim += txt;
      }
      input.value = (finalText + interim).trim();
    };

    rec.onerror = (e) => {
      const err = (e && e.error) ? String(e.error) : 'error';
      let msg = 'Voice error: ' + err;
      if (err === 'not-allowed' || err === 'service-not-allowed') msg = 'Mic permission denied';
      else if (err === 'no-speech') msg = 'No speech detected';
      else if (err === 'network') msg = 'Speech service unavailable';

      setStatus(msg);
      listening = false;
      setPressed(false);
    };

    rec.onend = () => {
      listening = false;
      setPressed(false);
      setStatus('');
      input.focus();
    };
  }
  // --- end Tap-to-Speak ---

  function setOpen(open) {
    panel.style.display = open ? 'block' : 'none';
    bubble.textContent = open ? '×' : '💬';

    if (!open && stopListening) stopListening();

    if (open) {
      syncThread();
      startPolling();
      setTimeout(() => (msgs.scrollTop = msgs.scrollHeight), 0);
    } else {
      stopPolling();
    }
  }

  bubble.addEventListener('click', () => {
    const open = panel.style.display === 'none';
    setOpen(open);
  });

  closeBtn.addEventListener('click', () => setOpen(false));

  resetBtn.addEventListener('click', () => {
    if (locked) return;
    if (stopListening) stopListening();
    localStorage.removeItem(cidKey);
    conversationId = '';
    lastSig = '';
    stopPolling();
    greet((settings && settings.greeting) || 'Hi! How can I help today?');
    if (panel.style.display !== 'none') startPolling();
  });

  async function loadSettings() {
const settingsUrl = SETTINGS_URL + '&t=' + Date.now(); // ✅ cache bust
const res = await fetch(settingsUrl, { method: 'GET', mode: 'cors', cache: 'no-store' });
const data = await res.json().catch(() => ({}));

if (isPaywall(res, data)) {
  lockWidget(data);
  return;
}

if (!res.ok || !data || !data.ok)
  throw new Error((data && data.error) || 'Failed to load settings');

    settings = data.widget;
    if (settings && settings.enabled === false) {
      bubble.remove();
      panel.remove();
      return;
    }

    const color = safeHex(settings && settings.brandColor);
    bubble.style.background = color;

    title.textContent = String((settings && settings.assistantName) || 'Store Assistant').trim() || 'Store Assistant';
    greet(String((settings && settings.greeting) || 'Hi! How can I help today?').trim());

    if (AUTO_OPEN) setOpen(true);
  }

  async function send(text) {
    if (locked) return;
    if (busy) return;
    const t = String(text || '').trim();
    appendMsg('customer', t);
    if (!t) return;

    if (stopListening) stopListening();

    busy = true;
    sendBtn.setAttribute('disabled', 'true');
    micBtn.setAttribute('disabled', 'true');

    try {
      const res = await fetch(MESSAGE_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          key: KEY,
          text: t,
          conversationId: conversationId || undefined,
          channel: CHANNEL,
          subject: SUBJECT,
          tags: TAGS,
          customerName: CUSTOMER_NAME || undefined,
        }),
      });

const data = await res.json().catch(() => ({}));

if (isPaywall(res, data)) {
  lockWidget(data);
  return;
}

if (!res.ok || !data || !data.ok)
  throw new Error((data && data.error) || 'Send failed');

      if (data.conversationId && data.conversationId !== conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem(cidKey, conversationId);
      }

      if (Array.isArray(data.messages)) {
        const filtered = data.messages
          .filter((x) => x && (x.role === 'customer' || x.role === 'assistant' || x.role === 'staff'))
          .map((x) => ({ role: x.role, content: x.content }));
        render(filtered);
      }

      await syncThread();
    } catch (e) {
      const msg = (e && e.message) ? e.message : 'error';
      render([{ role: 'assistant', content: 'Sorry—failed to send. (' + msg + ')' }]);
    } finally {
      busy = false;
      if (!locked) {
        sendBtn.removeAttribute('disabled');
        micBtn.removeAttribute('disabled');
        input.removeAttribute('disabled');
      }
    }
  } // ✅ closes send()

  sendBtn.addEventListener('click', () => {
    const t = input.value;
    input.value = '';
    send(t);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (stopListening) stopListening();
      const t = input.value;
      input.value = '';
      send(t);
    }
  });

  // init speech after DOM is ready
  initSpeech();

  loadSettings().catch((e) => {
    greet('Sorry—widget failed to load settings. Please try again.');
    console.error('[TikoZap] settings load failed', e);
  });
})(); // ✅ must start with "}" not ")"
`;
}

export async function GET() {
  return new Response(js(), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
      'x-tikozap-widget-build': BUILD_MARK,
    },
  });
}
