(() => {
  if (window.__TIKOZAP_WIDGET_LOADED__) return;
  window.__TIKOZAP_WIDGET_LOADED__ = true;

  const KEY = window.TIKOZAP_PUBLIC_KEY;
  if (!KEY) {
    console.warn("[TikoZap] Missing window.TIKOZAP_PUBLIC_KEY");
    return;
  }

  // API base
  const API_BASE = window.TIKOZAP_API_BASE || "https://api.tikozap.com";

  const SETTINGS_URL =
    API_BASE + "/api/widget/public/settings?key=" + encodeURIComponent(KEY);
  const MESSAGE_URL = API_BASE + "/api/widget/public/message";

  const safeHex = (v) => {
    const raw = String(v || "").trim();
    const x = raw.startsWith("#") ? raw : "#" + raw;
    return /^#[0-9a-fA-F]{6}$/.test(x) ? x : "#111111";
  };

  const cidKey = "tz_widget_cid_" + KEY;

  // ---- styles
  const css = `
.tz-bubble{position:fixed;right:18px;bottom:18px;width:56px;height:56px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;cursor:pointer;z-index:999999;border:1px solid rgba(0,0,0,.12)}
.tz-panel{position:fixed;right:18px;bottom:86px;width:360px;max-width:calc(100% - 36px);background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;z-index:999999;box-shadow:0 12px 30px rgba(0,0,0,.12);font-family:ui-sans-serif,system-ui,-apple-system}
.tz-hd{padding:12px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:10px}
.tz-title{font-weight:900;font-size:13px}
.tz-sub{font-size:11px;opacity:.7;margin-top:2px}
.tz-actions{display:flex;gap:8px;align-items:center}
.tz-btn{font-size:12px;border:1px solid #e5e7eb;border-radius:10px;padding:6px 8px;background:#fff;cursor:pointer}
.tz-msgs{height:260px;overflow:auto;padding:12px;background:#f8fafc}
.tz-row{display:flex;margin:8px 0}
.tz-row.me{justify-content:flex-end}
.tz-bub{max-width:85%;border-radius:14px;padding:10px 12px;font-size:13px;line-height:1.4;white-space:pre-wrap;border:1px solid #e5e7eb}
.tz-bub.me{background:#fff;color:#111827}
.tz-bub.ai{background:#111827;color:#fff}
.tz-ft{padding:10px;border-top:1px solid #e5e7eb;display:flex;gap:8px;background:#fff}
.tz-in{flex:1;border-radius:12px;border:1px solid #e5e7eb;padding:10px 12px;font-size:13px}
.tz-send{border-radius:12px;border:1px solid #e5e7eb;padding:10px 12px;background:#111827;color:#fff;font-weight:900;cursor:pointer}
.tz-send[disabled]{opacity:.6;cursor:not-allowed}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- UI
  const bubble = document.createElement("div");
  bubble.className = "tz-bubble";
  bubble.textContent = "💬";

  const panel = document.createElement("div");
  panel.className = "tz-panel";
  panel.style.display = "none";

  const hd = document.createElement("div");
  hd.className = "tz-hd";

  const hdLeft = document.createElement("div");
  const title = document.createElement("div");
  title.className = "tz-title";
  title.textContent = "Store Assistant";
  const sub = document.createElement("div");
  sub.className = "tz-sub";
  sub.textContent = "Online";
  hdLeft.appendChild(title);
  hdLeft.appendChild(sub);

  const actions = document.createElement("div");
  actions.className = "tz-actions";

  const resetBtn = document.createElement("button");
  resetBtn.className = "tz-btn";
  resetBtn.textContent = "Reset";

  const closeBtn = document.createElement("button");
  closeBtn.className = "tz-btn";
  closeBtn.textContent = "×";

  actions.appendChild(resetBtn);
  actions.appendChild(closeBtn);

  hd.appendChild(hdLeft);
  hd.appendChild(actions);

  const msgs = document.createElement("div");
  msgs.className = "tz-msgs";

  const ft = document.createElement("div");
  ft.className = "tz-ft";

  const input = document.createElement("input");
  input.className = "tz-in";
  input.placeholder = "Type a message…";

  const sendBtn = document.createElement("button");
  sendBtn.className = "tz-send";
  sendBtn.textContent = "Send";

  ft.appendChild(input);
  ft.appendChild(sendBtn);

  panel.appendChild(hd);
  panel.appendChild(msgs);
  panel.appendChild(ft);

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  let settings = null;
  let conversationId = localStorage.getItem(cidKey) || "";
  let busy = false;

  const render = (arr) => {
    msgs.innerHTML = "";
    (arr || []).forEach((m) => {
      const row = document.createElement("div");
      row.className = "tz-row " + (m.role === "customer" ? "me" : "ai");
      const bub = document.createElement("div");
      bub.className = "tz-bub " + (m.role === "customer" ? "me" : "ai");
      bub.textContent = m.content || "";
      row.appendChild(bub);
      msgs.appendChild(row);
    });
    msgs.scrollTop = msgs.scrollHeight;
  };

  const greet = (text) =>
    render(text ? [{ role: "assistant", content: text }] : []);

  const toggle = () => {
    const open = panel.style.display !== "none";
    panel.style.display = open ? "none" : "block";
    bubble.textContent = open ? "💬" : "×";
    if (!open) setTimeout(() => (msgs.scrollTop = msgs.scrollHeight), 0);
  };

  bubble.addEventListener("click", toggle);
  closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
    bubble.textContent = "💬";
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(cidKey);
    conversationId = "";
    greet(settings?.greeting || "Hi! How can we help today?");
  });

  async function loadSettings() {
    const res = await fetch(SETTINGS_URL, { method: "GET", mode: "cors" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok)
      throw new Error(data?.error || "Failed to load settings");

    settings = data.widget;

    if (settings?.enabled === false) {
      bubble.remove();
      panel.remove();
      return;
    }

    const color = safeHex(settings?.brandColor);
    bubble.style.background = color;
    title.textContent =
      (settings?.assistantName || "Store Assistant").trim() || "Store Assistant";
    greet((settings?.greeting || "Hi! How can we help today?").trim());
  }

  async function send(text) {
    if (busy) return;
    const t = String(text || "").trim();
    if (!t) return;

    busy = true;
    sendBtn.setAttribute("disabled", "true");

    try {
      const res = await fetch(MESSAGE_URL, {
        method: "POST",
        mode: "cors",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: KEY,
          text: t,
          conversationId: conversationId || undefined,
          channel: "web",
          subject: "Website chat",
          tags: "widget",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Send failed");

      if (data.conversationId && data.conversationId !== conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem(cidKey, conversationId);
      }

      if (Array.isArray(data.messages)) {
        render(
          data.messages
            .filter((x) => x?.role === "customer" || x?.role === "assistant")
            .map((x) => ({ role: x.role, content: x.content })),
        );
      }
    } catch (e) {
      render([
        {
          role: "assistant",
          content:
            "Sorry—failed to send. (" + (e?.message || "error") + ")",
        },
      ]);
    } finally {
      busy = false;
      sendBtn.removeAttribute("disabled");
    }
  }

  sendBtn.addEventListener("click", () => {
    const t = input.value;
    input.value = "";
    send(t);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const t = input.value;
      input.value = "";
      send(t);
    }
  });

  loadSettings().catch((e) => console.error("[TikoZap] settings load failed", e));
})();
