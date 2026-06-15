// src/app/dashboard/settings/SettingsClient.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

type SectionKey =
  | "general"
  | "team"
  | "notifications"
  | "ai"
  | "voice"
  | "widget";

const sections: { key: SectionKey; label: string; desc: string }[] = [
  { key: "general", label: "General", desc: "Store profile and business basics" },
  { key: "team", label: "Team", desc: "Owner, staff members, and invitations" },

  { key: "notifications", label: "Inbox & Notifications", desc: "Alerts, dots, sounds, and escalation signals" },

  { key: "ai", label: "AI Assistant", desc: "Tone, behavior, and handoff rules" },
  { key: "voice", label: "Voice & Orb", desc: "Voice style, orb behavior, and speaking mode" },

  { key: "widget", label: "Widget", desc: "Website bubble appearance and behavior" },
];

const BRAND_PRESETS = [
  "#111111",
  "#4C4C54",
  "#2563EB",
  "#73BC71",
  "#7C3AED",

  "#F0F0EB",
  "#F4E99B",
  "#E0E8D8",
  "#BAE6FD",
  "#FAF9F6",
];

function getContrastTextColor(hex: string) {
  const clean = hex.replace("#", "").trim();

  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return "#ffffff";

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 150 ? "#111827" : "#ffffff";
}

type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  settings?: {
    inboxNotifications?: boolean;
  };
};

async function loadSavedSettings() {
  const res = await fetch("/api/settings", { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return data?.ok && data?.settings ? data.settings : {};
}

async function saveSavedSettings(settings: Record<string, any>) {
  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  }).catch(() => {});
}

function Toggle({
  label,
  desc,
  defaultOn = true,
  storageKey,
  onAfterToggle,
}: {
  label: string;
  desc?: string;
  defaultOn?: boolean;
  storageKey?: string;
  onAfterToggle?: (next: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);

useEffect(() => {
  if (!storageKey) return;

  const syncFromStorage = () => {
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      setOn(saved === "1");
    } else {
      const initial = defaultOn ? "1" : "0";
      localStorage.setItem(storageKey, initial);
      setOn(defaultOn);
    }
  };

  syncFromStorage();

  window.addEventListener("tz-settings-change", syncFromStorage);
  window.addEventListener("storage", syncFromStorage);

  return () => {
    window.removeEventListener("tz-settings-change", syncFromStorage);
    window.removeEventListener("storage", syncFromStorage);
  };
}, [storageKey, defaultOn]);

  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      if (storageKey) {
  localStorage.setItem(storageKey, next ? "1" : "0");

  const raw = localStorage.getItem("tz_settings_cache");
  const cached = raw ? JSON.parse(raw) : {};
  const nextSettings = {
    ...cached,
    [storageKey]: next ? "1" : "0",
  };

  localStorage.setItem("tz_settings_cache", JSON.stringify(nextSettings));
  saveSavedSettings(nextSettings);

  window.dispatchEvent(new Event("tz-settings-change"));
  
}

onAfterToggle?.(next);

      return next;
    });
  };

return (
  <button
    type="button"
    className={`st-radioRow ${on ? "is-on" : ""}`}
    onClick={toggle}
    aria-label={label}
    aria-pressed={on}
  >
    <span>
      <strong>{label}</strong>
      {desc ? <small>{desc}</small> : null}
    </span>

    <span className="st-radioDot" aria-hidden="true" />
  </button>
);
}

function ChoiceGroup({
  label,
  options,
  defaultValue,
  storageKey,
}: {
  label: string;
  options: string[];
  defaultValue: string;
  storageKey?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) setValue(saved);
    else localStorage.setItem(storageKey, defaultValue);
  }, [storageKey, defaultValue]);

  const choose = (opt: string) => {
    setValue(opt);
    if (storageKey) {
  localStorage.setItem(storageKey, opt);

  const raw = localStorage.getItem("tz_settings_cache");
  const cached = raw ? JSON.parse(raw) : {};
  const nextSettings = {
    ...cached,
    [storageKey]: opt,
  };

  localStorage.setItem("tz_settings_cache", JSON.stringify(nextSettings));
  saveSavedSettings(nextSettings);

  window.dispatchEvent(new Event("tz-settings-change"));
}
  };

  return (
    <div className="st-field">
      <div className="st-label">{label}</div>
      <div className="st-choiceRow">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`st-choice ${value === opt ? "active" : ""}`}
            onClick={() => choose(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsClient() {
  const [active, setActive] = useState<SectionKey>("general");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [assistantName, setAssistantName] = useState("Store Assistant");
  const [assistantGreeting, setAssistantGreeting] = useState(
  "Hi! I'm here if you need help with products, orders, shipping, or returns."
);
  const [brandColor, setBrandColor] = useState("#111111");
  const [showCustomColor, setShowCustomColor] = useState(false);

  const saveAssistantBranding = async () => {
  const raw = localStorage.getItem("tz_settings_cache");
  const cached = raw ? JSON.parse(raw) : {};

  const nextSettings = {
    ...cached,
    tz_assistant_name: assistantName,
    tz_assistant_greeting: assistantGreeting,
    tz_brand_color: brandColor || "#111111",
  };

  localStorage.setItem("tz_settings_cache", JSON.stringify(nextSettings));

  Object.entries(nextSettings).forEach(([key, value]) => {
    localStorage.setItem(key, String(value));
  });

  await saveSavedSettings(nextSettings);
  window.dispatchEvent(new Event("tz-settings-change"));
  alert("Assistant branding saved.");
};

  const hasVoiceSubscription = false;

  const activeSection = useMemo(
    () => sections.find((s) => s.key === active) || sections[0],
    [active]
  );

useEffect(() => {
  loadSavedSettings().then((settings) => {
    localStorage.setItem("tz_settings_cache", JSON.stringify(settings));

    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });

    setSoundEnabled(
      (localStorage.getItem("tz_setting_escalation_sound") ?? "1") === "1"
    );

    window.dispatchEvent(new Event("tz-settings-change"));
  });
}, []);

useEffect(() => {
  const loadTeamSettings = async () => {
    try {
      const res = await fetch("/api/team", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!data?.ok) return;

      if (data.currentUser?.id) {
        setCurrentUserId(data.currentUser.id);
      }

      if (Array.isArray(data.members)) {
        setTeamMembers(data.members);
      }
    } catch {
      // ignore
    }
  };

  loadTeamSettings();
}, []);

useEffect(() => {
  loadTeamMembers();
}, []);

const enableBrowserNotifications = async () => {
  if (typeof window === "undefined") return;

  if (!("Notification" in window)) {
    setNotificationStatus("Notifications not supported.");
    return;
  }

  try {
    const result = await Notification.requestPermission();

    if (result === "granted") {
      setNotificationStatus("Browser notifications enabled.");
    } else if (result === "denied") {
      setNotificationStatus("Notifications blocked.");
    } else {
      setNotificationStatus("Notification permission dismissed.");
    }
  } catch {
    setNotificationStatus("Could not enable notifications.");
  }
};

const inviteTeamMember = async () => {
  const email = inviteEmail.trim();

  if (!email) {
    setInviteMessage("Enter an email first.");
    return;
  }

  setInviteMessage("Sending invite...");

  const res = await fetch("/api/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    setInviteMessage(data?.error || "Could not invite team member.");
    return;
  }

  setInviteEmail("");
  setInviteMessage("Team member added.");
  await loadTeamMembers();
};

const loadTeamMembers = async () => {
  const res = await fetch("/api/team", { cache: "no-store" });
  const data = await res.json().catch(() => ({}));

  if (data?.ok && Array.isArray(data.members)) {
    setTeamMembers(data.members);
  }
};

const removeTeamMember = async (member: TeamMember) => {
  if (member.role === "owner") return;

  const ok = window.confirm(`Remove ${member.email} from this team?`);
  if (!ok) return;

  const res = await fetch("/api/team/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: member.id }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    setInviteMessage(data?.error || "Could not remove team member.");
    return;
  }

  setInviteMessage("Team member removed.");
  await loadTeamMembers();
};

const toggleMemberNotifications = async (member: TeamMember) => {
  if (member.role === "owner") return;

  const current = member.settings?.inboxNotifications !== false;
  const next = !current;

  await fetch("/api/team/member-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: member.id,
      settings: {
        ...(member.settings || {}),
        inboxNotifications: next,
      },
    }),
  });

  await loadTeamMembers();
};

  return (
    <div className="st-page">
      <div className="st-header">
        <div>
          <h1>Settings</h1>
          <p>Simple controls for your store, AI assistant, Inbox, voice, and widget.</p>
        </div>
      </div>

      <div className="st-layout">
        <aside className="st-side">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`st-navItem ${active === s.key ? "active" : ""}`}
              onClick={() => setActive(s.key)}
            >
              <strong>{s.label}</strong>
              <span>{s.desc}</span>
            </button>
          ))}
        </aside>

        <main className="st-main">
          <div className="st-sectionHead">
            <h2>{activeSection.label}</h2>
            <p>{activeSection.desc}</p>
          </div>

          {active === "general" ? (
            <div className="st-cardGrid">
              <section className="st-card">
                <h3>Store profile</h3>
                <div className="st-grid2">
                  <label className="st-field">
                    <span className="st-label">Store name</span>
                    <input placeholder="Kevin Zhang Store" />
                  </label>
                  <label className="st-field">
                    <span className="st-label">Support email</span>
                    <input placeholder="support@yourstore.com" />
                  </label>
                  <label className="st-field">
                    <span className="st-label">Time zone</span>
                    <input placeholder="America/New_York" />
                  </label>
                  <label className="st-field">
                    <span className="st-label">Business hours</span>
                    <input placeholder="Mon–Fri, 9 AM–5 PM" />
                  </label>
                </div>
              </section>

              <section className="st-card">
                <h3>Public identity</h3>
                <Toggle label="Show store name in chat" desc="Customers see your store name in the assistant header." />
                <Toggle label="Show Powered by TikoZap" desc="Recommended for Starter plan trust and transparency." />
              </section>
            </div>
          ) : null}

          {active === "team" ? (
  <div className="st-cardGrid">
<section className="st-card">
  <h3>Workspace owner</h3>

  {teamMembers
    .filter((m) => String(m.role).toLowerCase() === "owner")
    .map((m) => (
      <div className="st-teamMember" key={m.id}>
        <div>
          <strong>{m.name || m.email}</strong>
          <small>{m.email} · Full access</small>
        </div>

        <span className="st-roleBadge">Owner</span>
      </div>
    ))}
</section>

<section className="st-card">
  <h3>Team members</h3>

{teamMembers.filter((m) => String(m.role).toLowerCase() !== "owner").length === 0 ? (
  <div className="st-emptyState">
    No staff members yet.
  </div>
) : (
  teamMembers
    .filter((m) => String(m.role).toLowerCase() !== "owner")
    .map((m) => (
      <div className="st-teamMember st-teamMember--grid" key={m.id}>
        <div>
          <strong>{m.name || m.email}</strong>
          <small>{m.email}</small>
        </div>

        <button
          type="button"
          className="st-notifyBtn"
          onClick={() => toggleMemberNotifications(m)}
        >
          {m.settings?.inboxNotifications === false ? "Notify off" : "Notify on"}
        </button>

        <button
          type="button"
          className="st-removeBtn"
          onClick={() => removeTeamMember(m)}
        >
          Remove
        </button>
      </div>
    ))
)}

  <label className="st-field">
    <span className="st-label">Invite team member</span>

    <div className="st-inviteRow">
      <input
        placeholder="staff@yourstore.com"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
      />

      <button type="button" className="st-inviteBtn" onClick={inviteTeamMember}>
        Invite
      </button>
    </div>

    {inviteMessage ? (
      <div className="st-enableMsg">{inviteMessage}</div>
    ) : null}
  </label>
</section>
  </div>
) : null}

{active === "ai" ? (
  <div className="st-cardGrid">
    <section className="st-card">
  <h3>Branding</h3>

  <label className="st-field">
    <span className="st-label">Assistant name</span>
<input
  value={assistantName}
  onChange={(e) => setAssistantName(e.target.value)}
  placeholder="Demo Boutique Assistant"
/>
  </label>

  <label className="st-field">
    <span className="st-label">Assistant greeting</span>
 <textarea
  className="st-textarea"
  value={assistantGreeting}
  onChange={(e) => setAssistantGreeting(e.target.value)}
  placeholder="Hi! I'm here if you need help with products, orders, shipping, or returns."
/>
  </label>

  <div className="st-brandingGrid">
<label className="st-field">
  <span className="st-label">Brand color</span>

<div className="st-colorPicker">
  {BRAND_PRESETS.map((color) => (
    <button
      key={color}
      type="button"
      className={`st-colorTile ${
        brandColor.toUpperCase() === color ? "is-selected" : ""
      }`}
      onClick={() => setBrandColor(color)}
      aria-label={color}
    >
<div
  className="st-colorTileSwatch"
  style={{
    background: color,
    color: getContrastTextColor(color),
  }}
>
  Aa
</div>

      <span className="st-colorTileCode">
        {color}
      </span>
    </button>
  ))}
</div>

<div className="st-customColorRow">
  <div
    className="st-customColorSwatch"
    style={{ background: brandColor || "#111111" }}
  />

  <div className="st-customColorInputWrap">
    <div className="st-customColorLabel">Custom color</div>
    <div className="st-customColorHint">Enter any hex color</div>

    <input
      value={brandColor}
      onChange={(e) => setBrandColor(e.target.value.toUpperCase())}
      placeholder="#111111"
    />
  </div>
</div>
</label>

<div
  className="st-brandingPreview"
  style={{
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
    background: "#f8fafc",
    width: "100%",
  }}
>
  <div
    style={{
      background: brandColor || "#111111",
      color: getContrastTextColor(brandColor || "#111111"),
      padding: "12px 14px",
      fontSize: 13,
      fontWeight: 900,
    }}
  >
    {assistantName || "Store Assistant"}
  </div>

  <div style={{ padding: 14, display: "grid", gap: 10 }}>
    <div
      style={{
        maxWidth: "85%",
        border: "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: 14,
        padding: "10px 12px",
        fontSize: 13,
        color: "#111827",
      }}
    >
      {assistantGreeting || "Hi! I'm here to help."}
    </div>

<div
  style={{
    justifySelf: "end",
    maxWidth: "82%",
    background: brandColor || "#111111",
    color: getContrastTextColor(brandColor || "#111111"),
    borderRadius: 14,
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 700,
  }}
>
  Where is my order?
</div>

<div
  style={{
    maxWidth: "85%",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    color: "#111827",
  }}
>
  I can help you check that. Can you share your order ID?
</div>

<div style={{ display: "flex", justifyContent: "flex-end" }}>
  <button
    type="button"
    style={{
      width: 34,
      height: 34,
      border: "none",
      borderRadius: 999,
      background: brandColor || "#111111",
      color: getContrastTextColor(brandColor || "#111111"),
      fontSize: 18,
      fontWeight: 700,
      cursor: "default",
    }}
  >
    ↑
  </button>
</div>
  </div>
</div>
  </div>
</section>

<button
  type="button"
  className="st-upgradeBtn"
  style={{ width: "fit-content" }}
  onClick={saveAssistantBranding}
>
  Save branding
</button>

    <section className="st-card">
      <h3>Assistant behavior</h3>

      <ChoiceGroup
        label="Assistant tone"
        options={[
          "Professional",
          "Friendly",
          "Sales-focused",
          "Luxury boutique",
          "Fast & concise",
        ]}
        defaultValue="Friendly"
        storageKey="tz_ai_tone"
      />

      <ChoiceGroup
  label="Default response style"
  options={["Concise", "Natural", "Detailed when helpful"]}
  defaultValue="Natural"
  storageKey="tz_ai_response_style"
/>

<ChoiceGroup
  label="Product recommendation behavior"
  options={[
    "Helpful only",
    "Balanced",
    "Proactively recommend products",
  ]}
  defaultValue="Balanced"
  storageKey="tz_ai_product_behavior"
/>

      <Toggle label="AI continues helping while waiting for human" desc="Best for small businesses when no one is immediately available." />
      <Toggle label="Pause AI during human takeover" desc="When staff clicks Take over, Tiko stays quiet." />
      <Toggle label="Mark human requests with red dot" desc="Escalated conversations become easy to spot." />
    </section>

    <section className="st-card">
      <h3>Escalation triggers</h3>
      <Toggle
  label="Customer asks for a person"
  storageKey="tz_ai_escalate_person"
/>

<Toggle
  label="Angry or urgent message"
  storageKey="tz_ai_escalate_urgent"
/>

<Toggle
  label="Refund or cancellation dispute"
  storageKey="tz_ai_escalate_refund"
/>

<Toggle
  label="Manager request"
  storageKey="tz_ai_escalate_manager"
/>
    </section>
  </div>
) : null}

          {active === "notifications" ? (
            <div className="st-cardGrid">
              <section className="st-card">
                <h3>Human escalation alerts</h3>
                <Toggle
                  label="Browser notification"
                  desc="Show a desktop alert when a customer needs a human."
                  storageKey="tz_browser_notifications"
                />
                <Toggle
  label="Play sound"
  desc="Soft ping when a red-dot conversation appears."
  storageKey="tz_setting_escalation_sound"
  onAfterToggle={(next) => setSoundEnabled(next)}
/>

<ChoiceGroup
  label="Sound level"
  options={["Soft", "Standard", "Loud"]}
  defaultValue="Soft"
  storageKey="tz_setting_sound_level"
/>

                <Toggle
                  label="Vibrate on mobile"
                  desc="Uses phone vibration when supported."
                  storageKey="tz_setting_escalation_vibrate"
                />

              </section>

              <section className="st-card">
                <h3>Inbox indicators</h3>

                <Toggle
                  label="Blue dot for active customer"
                  desc="Shows when a customer was active recently."
                  storageKey="tz_setting_active_customer_dot"
                />

                <Toggle
                  label="Blink red dot three times"
                  desc="Catches attention without becoming annoying."
                  storageKey="tz_setting_blink_red_dot"
                />
                <Toggle
  label="Quiet hours"
  desc="Mute sound/vibration during 10 PM–8 AM. Red dots still appear."
  defaultOn={false}
  storageKey="tz_setting_quiet_hours"
/>
              </section>
            </div>
          ) : null}

          {active === "voice" ? (
  <div className={!hasVoiceSubscription ? "st-lockedSection" : ""}>
            <div className="st-cardGrid">
              <section className="st-card">
                <h3>Voice style</h3>

                <ChoiceGroup
  label="Voice personality"
  options={[
    "Warm female",
    "Calm male",
    "Neutral assistant",
    "Energetic sales assistant",
  ]}
  defaultValue="Warm female"
  storageKey="tz_voice_personality"
/>
<ChoiceGroup
  label="Voice response style"
  options={[
    "Short & concise",
    "Natural conversation",
    "Detailed & supportive",
  ]}
  defaultValue="Natural conversation"
  storageKey="tz_voice_response_style"
/>
<ChoiceGroup
  label="Orb movement"
  options={[
    "Subtle floating",
    "Energetic floating",
    "Minimal movement",
  ]}
  defaultValue="Subtle floating"
  storageKey="tz_orb_movement"
/>
<ChoiceGroup
  label="Tap-to-speak behavior"
  options={[
    "Tap to start listening",
    "Hold to talk",
    "Automatic after greeting",
  ]}
  defaultValue="Tap to start listening"
  storageKey="tz_voice_tap_behavior"
/>
<ChoiceGroup
  label="Voice auto-play"
  options={[
    "Never auto-play voice",
    "Play only after user speaks first",
    "Always speak greeting automatically",
  ]}
  defaultValue="Play only after user speaks first"
  storageKey="tz_voice_auto_play"
/>
<ChoiceGroup
  label="Orb speaking animation"
  options={[
    "Soft pulse",
    "Energetic pulse",
    "Minimal animation",
  ]}
  defaultValue="Soft pulse"
  storageKey="tz_orb_speaking_animation"
/>
                <ChoiceGroup
                  label="Assistant voice"
                  options={["Female", "Male", "Neutral"]}
                  defaultValue="Female"
                />
                <ChoiceGroup
                  label="Response length"
                  options={["Short", "Natural", "Detailed"]}
                  defaultValue="Natural"
                />
                <Toggle label="Voice replies enabled" />
                <Toggle label="Hold to talk on desktop" />
              </section>

              <section className="st-card">
                <h3>Orb behavior</h3>
                <Toggle label="Floating orb animation" />
                <Toggle label="Tap orb to speak" />
                <Toggle label="Show orb in assistant header" />
              </section>
            </div>
          {!hasVoiceSubscription ? (
  <div className="st-upgradeBox">
    <strong>Voice & Orb is a premium add-on</strong>

    <p>
      Upgrade to enable realtime voice conversations,
      orb customization, and advanced voice settings.
    </p>

    <button type="button" className="st-upgradeBtn">
      Upgrade plan
    </button>
  </div>
) : null}
  </div>
) : null}

          {active === "widget" ? (
            <div className="st-cardGrid">
              <section className="st-card">
                <h3>Website widget</h3>
                <ChoiceGroup
                  label="Bubble position"
                  options={["Bottom right", "Bottom left"]}
                  defaultValue="Bottom right"
                />
                <Toggle label="Show welcome message" />
                <Toggle label="Show product suggestions" />
                <Toggle label="Enable voice in widget" />
              </section>

              <section className="st-card">
                <h3>Branding</h3>
                <label className="st-field">
                  <span className="st-label">Assistant name</span>
                  <input placeholder="Kevin Zhang Assistant" />
                </label>
                <label className="st-field">
  <span className="st-label">Assistant greeting</span>
  <textarea
    className="st-textarea"
    placeholder="Hi! I'm here if you need help with products, orders, shipping, or returns."
    defaultValue="Hi! I'm here if you need help with products, orders, shipping, or returns."
  />
</label>
              </section>
            </div>
          ) : null}
        </main>
      </div>

      <style jsx global>{`
        .st-page{
          display:grid;
          gap:16px;
          max-width:1180px;
        }

        .st-header h1{
          margin:0;
          font-size:28px;
          font-weight:900;
          letter-spacing:-.03em;
          color:#111827;
        }

        .st-header p{
          margin:6px 0 0;
          font-size:14px;
          color:#64748b;
          line-height:1.5;
        }

        .st-layout{
          display:grid;
          grid-template-columns:280px minmax(0,1fr);
          gap:16px;
          align-items:start;
        }

        .st-side{
          display:grid;
          gap:8px;
        }

        .st-navItem{
          text-align:left;
          border:1px solid #e5e7eb;
          background:#fff;
          border-radius:14px;
          padding:12px;
          cursor:pointer;
          display:grid;
          gap:4px;
          color:#111827;
        }

        .st-navItem:hover{
          background:#f8fafc;
        }

        .st-navItem.active{
  background:#f8fafc;
  border-color:#cbd5e1;
  box-shadow:0 1px 2px rgba(15,23,42,.04);
}

        .st-navItem strong{
          font-size:13px;
        }

        .st-navItem span{
          font-size:12px;
          line-height:1.35;
          color:#64748b;
        }

        .st-main{
          display:grid;
          gap:14px;
          min-width:0;
        }

        .st-sectionHead{
          border:1px solid #e5e7eb;
          background:#fff;
          border-radius:16px;
          padding:16px;
        }

        .st-sectionHead h2{
          margin:0;
          font-size:20px;
          font-weight:900;
          color:#111827;
        }

        .st-sectionHead p{
          margin:5px 0 0;
          font-size:13px;
          color:#64748b;
        }

        .st-cardGrid{
          display:grid;
          gap:14px;
        }

        .st-card{
          border:1px solid #e5e7eb;
          background:#fff;
          border-radius:16px;
          padding:16px;
          display:grid;
          gap:14px;
        }

        .st-card h3{
          margin:0;
          font-size:15px;
          font-weight:900;
          color:#111827;
        }

        .st-grid2{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
        }

        .st-field{
          display:grid;
          gap:6px;
        }

        .st-label{
          font-size:12px;
          font-weight:800;
          color:#475569;
        }

        input, textarea{
          width:100%;
          box-sizing:border-box;
          border:1px solid #d1d5db;
          background:#fff;
          border-radius:12px;
          padding:10px 12px;
          font-size:13px;
          color:#111827;
          outline:none;
        }

        textarea{
          min-height:86px;
          resize:vertical;
        }

        input:focus, textarea:focus{
          border-color:#94a3b8;
        }

.st-radioRow{
  width:100%;
  border:none;
  border-top:1px solid #eef2f7;
  background:transparent;
  padding:14px 0;
  display:grid;
  grid-template-columns:minmax(0,1fr) 28px;
  gap:18px;
  align-items:center;
  text-align:left;
  cursor:pointer;
  color:#111827;
}

.st-radioRow:first-of-type{
  border-top:none;
}

.st-radioRow:hover{
  background:#f8fafc;
}

.st-radioRow strong{
  display:block;
  font-size:13px;
  font-weight:800;
  color:#111827;
}

.st-radioRow small{
  display:block;
  margin-top:4px;
  max-width:420px;
  font-size:12px;
  line-height:1.35;
  color:#64748b;
}

.st-radioDot{
  width:16px;
  height:16px;
  border-radius:999px;
  border:2px solid #cbd5e1;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  justify-self:end;
}

.st-radioRow.is-on .st-radioDot{
  border-color:#6366f1;
}

.st-radioRow.is-on .st-radioDot::after{
  content:"";
  width:6px;
  height:6px;
  border-radius:999px;
  background:#6366f1;
}

        .st-choiceRow{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .st-choice{
          border:1px solid #d1d5db;
          background:#fff;
          border-radius:999px;
          padding:8px 12px;
          font-size:12px;
          font-weight:700;
          color:#475569;
          cursor:pointer;
        }

        .st-choice.active{
  background:#eff6ff;
  border-color:#bfdbfe;
  color:#1d4ed8;
}

        @media (max-width:900px){
          .st-page{
            padding:0 12px 24px;
          }

          .st-layout{
            grid-template-columns:1fr;
          }

          .st-side{
            display:flex;
            gap:8px;
            overflow-x:auto;
            padding-bottom:4px;
          }

          .st-navItem{
            min-width:190px;  
          }

            .st-brandingGrid{
    grid-template-columns:1fr;
  }
          .st-grid2{
            grid-template-columns:1fr;
          }
        }

        .st-navItem{
  justify-items:start !important;
  align-items:start !important;
}

.st-navItem strong,
.st-navItem span{
  text-align:left !important;
  justify-self:start !important;
}

.st-side .st-navItem{
  width:100% !important;
  justify-content:flex-start !important;
  place-items:start !important;
}

.st-side .st-navItem strong,
.st-side .st-navItem span{
  width:100% !important;
  display:block !important;
  text-align:left !important;
}

.st-teamMember{
  border:1px solid #e5e7eb;
  background:#f8fafc;
  border-radius:14px;
  padding:12px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.st-teamMember strong{
  display:block;
  font-size:13px;
  color:#111827;
}

.st-teamMember small{
  display:block;
  margin-top:4px;
  font-size:12px;
  color:#64748b;
}

.st-roleBadge{
  min-height:30px;
  min-width:64px;

  border:1px solid #bfdbfe;
  background:#eff6ff;
  color:#1d4ed8;

  border-radius:999px;
  padding:6px 10px;

  display:inline-flex;
  align-items:center;
  justify-content:center;
  text-align:center;

  font-size:12px;
  font-weight:800;
}

.st-inviteRow{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
}

.st-inviteBtn{
  border:1px solid #cbd5e1;
  background:#111827;
  color:#fff;
  border-radius:12px;
  padding:0 14px;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
}

.st-teamActions{
  display:flex;
  align-items:center;
  gap:8px;
}

.st-removeBtn{
  min-height:30px;
  border:1px solid #fecaca;
  background:#fff;
  color:#dc2626;
  border-radius:999px;
  padding:6px 12px;
  font-size:12px;
  font-weight:800;
  line-height:1;
  cursor:pointer;
}

.st-removeBtn:hover{
  background:#fef2f2;
}

.st-roleBadge,
.st-removeBtn{
  min-width:64px;
  justify-content:center;
}

.st-emptyState{
  border:1px dashed #dbe4ee;
  background:#f8fafc;
  color:#64748b;
  border-radius:14px;
  padding:14px;
  font-size:13px;
  text-align:center;
}

.st-notifyBtn{
  min-height:30px;
  min-width:64px;

  border:1px solid #bfdbfe;
  background:#eff6ff;
  color:#1d4ed8;

  border-radius:999px;
  padding:6px 10px;

  display:inline-flex;
  align-items:center;
  justify-content:center;
  text-align:center;

  font-size:12px;
  font-weight:800;
  line-height:1;
  cursor:pointer;
}

.st-teamMember--grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) 96px 70px;
  align-items:center;
}

.st-teamMember--grid .st-notifyBtn,
.st-teamMember--grid .st-removeBtn{
  justify-self:end;
}

.st-lockedSection{
  position:relative;
}

.st-lockedSection .st-card{
  opacity:.55;
  pointer-events:none;
  user-select:none;
}

.st-upgradeBox{
  margin-top:16px;
  border:1px solid #dbeafe;
  background:#eff6ff;
  border-radius:18px;
  padding:18px;
}

.st-upgradeBox strong{
  display:block;
  font-size:14px;
  color:#111827;
}

.st-upgradeBox p{
  margin-top:8px;
  font-size:13px;
  line-height:1.5;
  color:#475569;
}

.st-upgradeBtn{
  margin-top:14px;
  border:none;
  background:#111827;
  color:#fff;
  border-radius:12px;
  padding:10px 14px;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
}

.st-colorPicker{
  display:grid;
  grid-template-columns:repeat(5, 74px);
  gap:12px 14px;
  align-items:start;
}

.st-colorTile{
  width:74px;
  border:none;
  background:none;
  padding:0;
  cursor:pointer;
  text-align:center;
  display:grid;
  justify-items:center;
  gap:6px;
}

.st-colorTileSwatch{
  width:58px;
  height:58px;
  border-radius:0;
  border:1px solid #d1d5db;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:16px;
  font-weight:600;
  line-height:1;
}

.st-colorTileCode{
  display:block;
  width:74px;
  font-size:10px;
  font-weight:800;
  color:#111827;
  text-align:center;
  white-space:nowrap;
}

.st-colorTile.is-selected .st-colorTileSwatch{
  box-shadow:0 0 0 3px #111827;
}

.st-colorTileCustom .st-colorTilePlus{
  width:58px;
  height:58px;
  border:1px solid #d1d5db;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  font-weight:700;
  background:#fff;
}

@media (max-width:900px){
  .st-brandingGrid{
    grid-template-columns:1fr;
  }

  .st-colorPicker{
    grid-template-columns:repeat(5, 64px);
    gap:12px;
  }

  .st-colorTile{
    width:64px;
  }

  .st-colorTileCode{
    width:64px;
    font-size:9px;
  }

  .st-colorTileSwatch,
  .st-colorTileCustom .st-colorTilePlus{
    width:52px;
    height:52px;
  }
}

.st-colorTileSwatch{
  width:56px;
  height:56px;
  margin:0 auto 6px;
  border-radius:0;
  border:1px solid #d1d5db;
}

.st-colorTileCode{
  display:block;
  font-size:11px;
  font-weight:600;
  color:#111827;
}

.st-colorTile.is-selected .st-colorTileSwatch{
  box-shadow:0 0 0 3px #111827;
}

.st-colorTileCustom .st-colorTilePlus{
  width:56px;
  <height:56></height:56>px;
  margin:0 auto 6px;
  border:1px solid #d1d5db;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
  font-weight:700;
  background:#fff;
}

.st-brandingGrid{
  display:grid;
  grid-template-columns:minmax(0, 1fr) 220px;
  gap:24px;
  align-items:start;
}

@media (max-width:1200px){
  .st-brandingGrid{
    grid-template-columns:1fr;
  }
}

.st-customColorRow{
  display:grid;
  grid-template-columns:58px minmax(0,1fr);
  gap:12px;
  align-items:end;
  margin-top:12px;
  max-width:360px;
}

.st-customColorSwatch{
  width:58px;
  height:58px;
  border:1px solid #d1d5db;
  background:#fff;
}

.st-customColorInputWrap{
  display:grid;
  gap:6px;
}

.st-customColorLabel{
  font-size:11px;
  font-weight:800;
  color:#475569;
}

.st-brandingPreview{
  margin-left:12px;
}

.st-customColorHint{
  font-size:12px;
  color:#64748b;
}
      `}</style>
    </div>
  );
}