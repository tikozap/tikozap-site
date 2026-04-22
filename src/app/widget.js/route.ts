// src/app/widget.js/route.ts

export const runtime = 'edge';

const BUILD_MARK = 'wjs-2026-04-09d';

function js() {
  return `/* tikozap widget build: ${BUILD_MARK} */
(() => {
  try {
    if (window.__TIKOZAP_WIDGET_LOADED__) return;
    window.__TIKOZAP_WIDGET_LOADED__ = true;

    const allScripts = [...document.getElementsByTagName('script')];
const script =
  document.currentScript ||
  allScripts.find((s) => String(s.src || '').includes('/widget.js')) ||
  allScripts[allScripts.length - 1];

    const KEY =
      (script && (script.getAttribute('data-tikozap-key') || script.getAttribute('data-tikozap-public-key'))) ||
      (window.TIKOZAP_PUBLIC_KEY || '');

    if (!KEY) {
      console.warn('[TikoZap] Missing key. Add data-tikozap-key="tz_..." to the <script>.');
      return;
    }

    // ------------------ Script attrs ------------------
    const CHANNEL = (script && script.getAttribute('data-tikozap-channel')) || 'web';
    const TAGS = (script && script.getAttribute('data-tikozap-tags')) || 'widget';
    const SUBJECT =
      (script && script.getAttribute('data-tikozap-subject')) ||
      (CHANNEL === 'link' ? 'Starter Link' : 'Website chat');
    const CUSTOMER_NAME = (script && script.getAttribute('data-tikozap-customer-name')) || '';
    const AUTO_OPEN = (script && script.getAttribute('data-tikozap-open')) === '1';

    // ------------------ API base (IMPORTANT FIX) ------------------
    // Rule:
    // 1) If embed explicitly sets data-tikozap-api-base, obey it.
    // 2) Otherwise default to the PAGE origin (same app = same DB = inbox sees messages).
    // This prevents the widget from accidentally posting to api.tikozap.com while you’re on localhost/app.tikozap.com.
    let API_BASE =
      (script && script.getAttribute('data-tikozap-api-base')) ||
      (window.TIKOZAP_API_BASE || '');

    if (!API_BASE) {
      API_BASE = window.location.origin;
    }

    const SETTINGS_URL = API_BASE + '/api/widget/public/settings?key=' + encodeURIComponent(KEY);
    const MESSAGE_URL = API_BASE + '/api/widget/public/message';
    const THREAD_URL = API_BASE + '/api/widget/public/thread';

    // Conversation thread key is per (publicKey + channel)
    const CONVO_KEY = 'tz_conversationId_' + KEY;

    // ------------------ Helpers ------------------
    const safeHex = (v) => {
      const raw = String(v || '').trim();
      const x = raw.startsWith('#') ? raw : ('#' + raw);
      return /^#[0-9a-fA-F]{6}$/.test(x) ? x : '#111827';
    };

    // ------------------ Styles ------------------
    const css =
     ".tz-bubble{position:fixed;right:18px;bottom:calc(env(safe-area-inset-bottom, 0px) + 88px);width:56px;height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;cursor:pointer;z-index:999999;border:1px solid rgba(0,0,0,.12)}" +
".tz-panel{position:fixed;right:18px;bottom:calc(env(safe-area-inset-bottom, 0px) + 156px);width:360px;max-width:calc(100% - 36px);background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;z-index:999999;box-shadow:0 12px 30px rgba(0,0,0,.12);font-family:ui-sans-serif,system-ui,-apple-system}" +
      ".tz-hd{padding:12px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px}" +
      ".tz-title{font-weight:900;font-size:13px}" +
      ".tz-sub{font-size:11px;opacity:.7;margin-top:2px}" +
      ".tz-msgs{height:260px;overflow:auto;padding:12px;background:#f8fafc}" +
      ".tz-row{display:flex;margin:8px 0}" +
      ".tz-row.me{justify-content:flex-end}" +
      ".tz-bub{max-width:85%;border-radius:14px;padding:10px 12px;font-size:13px;line-height:1.4;white-space:pre-wrap;border:1px solid #e5e7eb}" +
      ".tz-bub.me{background:#111827;color:#fff;border-color:#111827}" +
      ".tz-bub.ai{background:#fff;color:#111827}" +
      ".tz-products{display:grid;gap:10px;margin-top:10px}" +
      ".tz-card{border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:10px;display:grid;gap:8px}" +
      ".tz-cardImg{width:100%;height:150px;object-fit:cover;border-radius:10px;background:#f3f4f6;display:block}" +
      ".tz-cardTitle{font-size:13px;font-weight:800;color:#111827;line-height:1.3}" +
      ".tz-cardMeta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#4b5563}" +
      ".tz-cardPrice{font-weight:800;color:#111827}" +
      ".tz-cardBtn{display:inline-flex;align-items:center;justify-content:center;height:34px;padding:0 12px;border-radius:10px;border:1px solid #111827;background:#111827;color:#fff;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}" +
      ".tz-cardBtn:hover{opacity:.92}" +
      ".tz-ft{padding:10px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:#fff;align-items:center}" +
      ".tz-in{flex:1;border-radius:12px;border:1px solid #e5e7eb;padding:10px 12px;font-size:13px}" +
      ".tz-send{border-radius:12px;border:1px solid #111827;padding:10px 12px;background:#111827;color:#fff;font-weight:900;cursor:pointer}" +
      ".tz-send[disabled]{opacity:.6;cursor:not-allowed}" +
      ".tz-mic{width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border-radius:12px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#111827;flex:0 0 auto}" +
      ".tz-mic[aria-pressed='true']{border-color:#111827;box-shadow:0 0 0 2px rgba(17,24,39,.15)}";

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // ------------------ UI ------------------
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

    hdLeft.appendChild(title);
    hdLeft.appendChild(sub);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.border = '1px solid #e5e7eb';
    closeBtn.style.borderRadius = '10px';
    closeBtn.style.padding = '6px 10px';
    closeBtn.style.background = '#fff';
    closeBtn.style.cursor = 'pointer';

    hd.appendChild(hdLeft);
    hd.appendChild(closeBtn);

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
    micBtn.title = 'Tap to speak';
    micBtn.setAttribute('aria-pressed', 'false');
    micBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>';

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

    let busy = false;
    let history = [];
    let pollTimer = null;
    let lastRenderedSignature = '';

const render = (arr) => {
  msgs.innerHTML = '';

  (arr || []).forEach((item) => {
    if (item && item.type === 'products' && Array.isArray(item.items)) {
      const row = document.createElement('div');
      row.className = 'tz-row ai';

      const wrap = document.createElement('div');
      wrap.className = 'tz-products';

      item.items.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'tz-card';

        if (p.image) {
          const img = document.createElement('img');
          img.className = 'tz-cardImg';
          img.src = p.image;
          img.alt = p.title || 'Product';
          card.appendChild(img);
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'tz-cardTitle';
        titleEl.textContent = p.title || 'Product';
        card.appendChild(titleEl);

        const meta = document.createElement('div');
        meta.className = 'tz-cardMeta';

        const stock = document.createElement('span');
        stock.textContent = p.available === false ? 'Unavailable' : 'In stock';

        const price = document.createElement('span');
        price.className = 'tz-cardPrice';
        price.textContent =
          typeof p.price === 'number'
            ? '$' + p.price.toFixed(2)
            : (p.price ? String(p.price) : '');

        meta.appendChild(stock);
        meta.appendChild(price);
        card.appendChild(meta);

        if (p.url && p.url !== '#') {
          const btn = document.createElement('a');
          btn.className = 'tz-cardBtn';
          btn.href = p.url;
          btn.target = '_blank';
          btn.rel = 'noreferrer';
          btn.textContent = 'View';
          card.appendChild(btn);
        }

        wrap.appendChild(card);
      });

      row.appendChild(wrap);
      msgs.appendChild(row);
      return;
    }

    const row = document.createElement('div');
    row.className = 'tz-row ' + (item.role === 'customer' ? 'me' : 'ai');

    const bub = document.createElement('div');
    bub.className = 'tz-bub ' + (item.role === 'customer' ? 'me' : 'ai');
    bub.textContent = item.content || '';

    row.appendChild(bub);
    msgs.appendChild(row);
  });

  msgs.scrollTop = msgs.scrollHeight;
  lastRenderedSignature = buildSignature(arr || []);
};
  

function buildSignature(arr) {
  try {
    return JSON.stringify(
      (arr || []).map((x) => {
        if (x && x.type === 'products') {
          return {
            type: 'products',
            items: (x.items || []).map((p) => ({
              id: p.id,
              title: p.title,
              price: p.price,
            })),
          };
        }
        return {
          role: x.role,
          content: x.content,
        };
      })
    );
  } catch {
    return String(Date.now());
  }
}

function normalizeThreadMessages(messages) {
  const out = [];

  (messages || []).forEach((m) => {
    if (!m) return;
    if (m.role !== 'customer' && m.role !== 'assistant' && m.role !== 'staff') return;

    out.push({
      role: m.role,
      content: m.content || '',
    });

    if (Array.isArray(m.products) && m.products.length) {
      out.push({
        type: 'products',
        items: m.products,
      });
    }
  });

  return out;
}

async function syncThread() {
  let cid = '';
  try {
    cid = localStorage.getItem(CONVO_KEY) || '';
  } catch {}

  if (!cid) return;

  try {
    const url =
      THREAD_URL +
      '?key=' + encodeURIComponent(KEY) +
      '&conversationId=' + encodeURIComponent(cid) +
      '&t=' + Date.now();

    const res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || !data.ok) return;

    const nextHistory = normalizeThreadMessages(data.messages || []);
    const nextSignature = buildSignature(nextHistory);

    if (nextSignature !== lastRenderedSignature) {
      history = nextHistory;
      render(history);
      lastRenderedSignature = nextSignature;
    }
  } catch (e) {
    try { console.error('[TikoZap] thread sync failed', e); } catch {}
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    syncThread();
  }, 2500);
}

function stopPolling() {
  if (!pollTimer) return;
  window.clearInterval(pollTimer);
  pollTimer = null;
}

    function setOpen(open) {
      panel.style.display = open ? 'block' : 'none';
      bubble.textContent = open ? '×' : '💬';
      if (open) {
        try { input.focus(); } catch {}
      }
    }

    bubble.addEventListener('click', () => setOpen(panel.style.display === 'none'));
    closeBtn.addEventListener('click', () => setOpen(false));

    // ------------------ Mic (safe init) ------------------
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const canSpeech = !!SpeechRecognition && (window.isSecureContext || isLocal);

      if (!canSpeech) {
        micBtn.style.display = 'none';
      } else {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.interimResults = true;
        rec.continuous = false;

        let listening = false;

        rec.onstart = () => {
          listening = true;
          micBtn.setAttribute('aria-pressed', 'true');
        };

        rec.onend = () => {
          listening = false;
          micBtn.setAttribute('aria-pressed', 'false');
        };

        rec.onerror = () => {
  listening = false;
  micBtn.setAttribute('aria-pressed', 'false');
  history.push({ role: 'assistant', content: 'Mic is unavailable here.' });
  render(history);
};

        rec.onresult = (e) => {
          let transcript = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            transcript += (e.results[i][0] && e.results[i][0].transcript) ? e.results[i][0].transcript : '';
          }
          transcript = String(transcript || '').trim();
          if (transcript) input.value = transcript;
        };

        micBtn.addEventListener('click', () => {
          try {
            if (listening) rec.stop();
            else { input.focus(); rec.start(); }
          } catch (err) {
            try { console.error('[TikoZap] mic failed', err); } catch {}
          }
        });
      }
    } catch (err) {
      try { micBtn.style.display = 'none'; } catch {}
      try { console.error('[TikoZap] mic init error', err); } catch {}
    }

    // ------------------ Settings ------------------
    async function loadSettings() {
      const res = await fetch(SETTINGS_URL + '&t=' + Date.now(), { method: 'GET', mode: 'cors', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'Failed to load settings');

      const settings = data.widget;

      if (settings && settings.enabled === false) {
        bubble.remove();
        panel.remove();
        return;
      }

      const color = safeHex(settings && settings.brandColor);
      bubble.style.background = color;

      title.textContent = String((settings && settings.assistantName) || 'Store Assistant').trim() || 'Store Assistant';

      const greet = String((settings && settings.greeting) || 'Hi! How can I help today?').trim();
history = [{ role: 'assistant', content: greet }];
render(history);

startPolling();

if (AUTO_OPEN) setOpen(true);
    }

// ------------------ Send ------------------
async function send(text) {
  const t = String(text || '').trim();
  if (!t || busy) return;

  busy = true;
  sendBtn.setAttribute('disabled', 'true');

  history.push({ role: 'customer', content: t });
  render(history);

  let cid;
  try {
    cid = localStorage.getItem(CONVO_KEY) || undefined;
  } catch {}

  try {
    const res = await fetch(MESSAGE_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key: KEY,
        text: t,
        conversationId: cid,
        channel: CHANNEL,
        subject: SUBJECT,
        tags: TAGS,
        history: history,
        visitor: CUSTOMER_NAME ? { name: CUSTOMER_NAME } : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data || !data.ok) {
      throw new Error((data && data.error) || 'Send failed');
    }

    if (data.conversationId) {
      try {
        localStorage.setItem(CONVO_KEY, data.conversationId);
      } catch {}
    }

      await syncThread();

    if (Array.isArray(data.messages) && data.messages.length) {
      const filtered = data.messages
        .filter((x) => x && (x.role === 'customer' || x.role === 'assistant' || x.role === 'staff'))
        .map((x) => ({ role: x.role, content: x.content }));

      const assistantOnly = filtered.filter((x) => x.role !== 'customer');

      if (assistantOnly.length) {
        history = history.concat(assistantOnly);
      }

      if (Array.isArray(data.products) && data.products.length) {
        history.push({
          type: 'products',
          items: data.products,
        });
      }

      render(history);
    } else {
      history.push({ role: 'assistant', content: 'Thanks! (No reply returned)' });

      if (Array.isArray(data.products) && data.products.length) {
        history.push({
          type: 'products',
          items: data.products,
        });
      }

      render(history);
    }
  } catch (e) {
    history.push({ role: 'assistant', content: 'Sorry—failed to send.' });
    render(history);
    try {
      console.error('[TikoZap] send failed', e);
    } catch {}
  } finally {
    busy = false;
    sendBtn.removeAttribute('disabled');
    input.focus();
  }
}

    sendBtn.addEventListener('click', () => {
      const t = input.value;
      input.value = '';
      send(t);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const t = input.value;
        input.value = '';
        send(t);
      }
    });

loadSettings().catch((e) => {
  console.error('[TikoZap] settings load failed', e);
  history = [{ role: 'assistant', content: 'Sorry—widget failed to load settings.' }];
  render(history);
});
  } catch (e) {
    try { console.error('[TikoZap] widget fatal error', e); } catch {}
  }
})();
`;
}

export async function GET() {
  return new Response(js(), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
      'x-tikozap-widget-build': BUILD_MARK,
    },
  });
}