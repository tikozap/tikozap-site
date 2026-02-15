// src/app/dashboard/settings/phone-agent/PhoneAgentSettings.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  enabled: boolean;
  greeting: string;
  fallbackLine: string;
  afterHoursLine: string;
  businessHoursJson: string;

  // read-only / helper fields from API
  inboundNumberE164?: string | null;
  timeZone?: string;
  appBaseUrl?: string; // e.g. https://app.tikozap.com
  tenantId?: string;   // helpful to show webhook URL
};

const DEFAULT_HOURS = `{
  "mon": [["10:00", "18:00"]],
  "tue": [["10:00", "18:00"]],
  "wed": [["10:00", "18:00"]],
  "thu": [["10:00", "18:00"]],
  "fri": [["10:00", "18:00"]],
  "sat": [["11:00", "16:00"]],
  "sun": []
}`;

function safeTrim(v: string) {
  return (v ?? "").toString();
}

function validateHoursJson(raw: string): { ok: boolean; error?: string } {
  const t = (raw || "").trim();
  if (!t) return { ok: true }; // allow empty
  try {
    const parsed = JSON.parse(t);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: "Hours JSON must be an object with keys mon..sun." };
    }
    // Light validation: each day is array of [start,end] pairs
    const days = ["mon","tue","wed","thu","fri","sat","sun"];
    for (const d of days) {
      const v = (parsed as any)[d];
      if (v === undefined) continue; // allow missing days
      if (!Array.isArray(v)) return { ok: false, error: `Field "${d}" must be an array.` };
      for (const slot of v) {
        if (!Array.isArray(slot) || slot.length !== 2) {
          return { ok: false, error: `Each "${d}" slot must be ["HH:MM","HH:MM"].` };
        }
        const [a, b] = slot;
        if (typeof a !== "string" || typeof b !== "string") {
          return { ok: false, error: `Each "${d}" slot must be ["HH:MM","HH:MM"] strings.` };
        }
      }
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

export default function PhoneAgentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    greeting: "",
    fallbackLine: "",
    afterHoursLine: "",
    businessHoursJson: "",
    inboundNumberE164: null,
    timeZone: "America/New_York",
    appBaseUrl: "https://app.tikozap.com",
    tenantId: "",
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      setNote("");

      try {
        const res = await fetch("/api/voice/settings", {
          method: "GET",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load settings");

        if (!alive) return;

        const s = data.settings || {};
        setSettings({
          enabled: s.enabled ?? false,
          greeting: s.greeting ?? "",
          fallbackLine: s.fallbackLine ?? "",
          afterHoursLine: s.afterHoursLine ?? "",
          businessHoursJson: s.businessHoursJson ?? "",
          inboundNumberE164: s.inboundNumberE164 ?? null,
          timeZone: s.timeZone ?? "America/New_York",
          appBaseUrl: data.appBaseUrl ?? "https://app.tikozap.com",
          tenantId: data.tenantId ?? "",
        });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const hoursCheck = useMemo(() => validateHoursJson(settings.businessHoursJson), [settings.businessHoursJson]);

  const webhookUrl = useMemo(() => {
    const base = (settings.appBaseUrl || "").trim() || "https://app.tikozap.com";
    const tid = (settings.tenantId || "").trim();
    if (!tid) return `${base}/api/voice/incoming?tenantId=YOUR_TENANT_ID`;
    return `${base}/api/voice/incoming?tenantId=${encodeURIComponent(tid)}`;
  }, [settings.appBaseUrl, settings.tenantId]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote("Copied ✅");
      setTimeout(() => setNote(""), 1200);
    } catch {
      setNote("Copy failed — please copy manually.");
      setTimeout(() => setNote(""), 2000);
    }
  }

  function prettyFormatJson() {
    const t = (settings.businessHoursJson || "").trim();
    if (!t) {
      setSettings((s) => ({ ...s, businessHoursJson: DEFAULT_HOURS }));
      return;
    }
    try {
      const parsed = JSON.parse(t);
      setSettings((s) => ({ ...s, businessHoursJson: JSON.stringify(parsed, null, 2) }));
      setNote("Formatted ✅");
      setTimeout(() => setNote(""), 1200);
    } catch (e: any) {
      setError(e?.message || "Invalid JSON");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    setNote("");

    // Block save if JSON invalid (but allow empty)
    if (!hoursCheck.ok) {
      setSaving(false);
      setError(hoursCheck.error || "Business hours JSON is invalid");
      return;
    }

    try {
      const res = await fetch("/api/voice/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          greeting: safeTrim(settings.greeting),
          fallbackLine: safeTrim(settings.fallbackLine),
          afterHoursLine: safeTrim(settings.afterHoursLine),
          businessHoursJson: safeTrim(settings.businessHoursJson),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to save");

      // server returns normalized settings
      const s = data.settings || {};
      setSettings((prev) => ({
        ...prev,
        enabled: s.enabled ?? prev.enabled,
        greeting: s.greeting ?? "",
        fallbackLine: s.fallbackLine ?? "",
        afterHoursLine: s.afterHoursLine ?? "",
        businessHoursJson: s.businessHoursJson ?? "",
        inboundNumberE164: s.inboundNumberE164 ?? prev.inboundNumberE164 ?? null,
        timeZone: s.timeZone ?? prev.timeZone,
      }));

      setNote("Saved ✅");
      setTimeout(() => setNote(""), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="db-card p-4">Loading phone agent settings…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="db-card p-4">
        <h1 className="text-xl font-semibold">Phone Agent</h1>
        <p className="mt-1 text-sm opacity-80">
          Configure voice greeting, after-hours behavior, and business hours.
        </p>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {note ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {note}
          </div>
        ) : null}
      </div>

      <div className="db-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <span className="text-sm font-medium">Enable Voice Agent</span>
          </label>

          <button className="db-btn" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="grid gap-3">
          <div className="text-sm">
            <div className="font-medium">Inbound number (E.164)</div>
            <div className="mt-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm opacity-80">
              {settings.inboundNumberE164 || <span className="opacity-60">Not set yet</span>}
            </div>
            <div className="mt-1 text-xs opacity-60">
              This is the Twilio phone number assigned to this store. We’ll use it to route calls to the correct tenant.
            </div>
          </div>

          <div className="text-sm">
            <div className="font-medium">Twilio Voice webhook URL (Permanent)</div>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                readOnly
                value={webhookUrl}
              />
              <button className="db-btn" type="button" onClick={() => copy(webhookUrl)}>
                Copy
              </button>
            </div>
            <div className="mt-1 text-xs opacity-60">
              Set this as your Twilio number’s <b>Voice → A CALL COMES IN</b> webhook.
            </div>
          </div>
        </div>
      </div>

      <div className="db-card p-4 space-y-4">
        <div>
          <div className="text-sm font-medium">Greeting</div>
          <textarea
            className="mt-1 w-full rounded-xl border border-zinc-200 p-2"
            rows={3}
            value={settings.greeting}
            onChange={(e) => setSettings((s) => ({ ...s, greeting: e.target.value }))}
            placeholder="Thanks for calling… How can I help?"
          />
        </div>

        <div>
          <div className="text-sm font-medium">After-hours line</div>
          <textarea
            className="mt-1 w-full rounded-xl border border-zinc-200 p-2"
            rows={2}
            value={settings.afterHoursLine}
            onChange={(e) => setSettings((s) => ({ ...s, afterHoursLine: e.target.value }))}
            placeholder="We’re currently closed. Please leave a message…"
          />
        </div>

        <div>
          <div className="text-sm font-medium">Fallback line (errors / timeouts)</div>
          <textarea
            className="mt-1 w-full rounded-xl border border-zinc-200 p-2"
            rows={2}
            value={settings.fallbackLine}
            onChange={(e) => setSettings((s) => ({ ...s, fallbackLine: e.target.value }))}
            placeholder="Sorry — please leave a message after the tone."
          />
        </div>
      </div>

      <div className="db-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Business Hours JSON</div>
            <div className="text-xs opacity-60">
              Used to decide when to go straight to voicemail (after-hours).
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="db-btn" type="button" onClick={prettyFormatJson}>
              {settings.businessHoursJson.trim() ? "Format" : "Insert Example"}
            </button>
          </div>
        </div>

        <textarea
          className="w-full rounded-xl border border-zinc-200 p-2 font-mono text-xs"
          rows={10}
          value={settings.businessHoursJson}
          onChange={(e) => setSettings((s) => ({ ...s, businessHoursJson: e.target.value }))}
          placeholder={DEFAULT_HOURS}
        />

        <div className="text-xs">
          {hoursCheck.ok ? (
            <span className="text-emerald-700">JSON looks valid ✅</span>
          ) : (
            <span className="text-red-700">Invalid JSON: {hoursCheck.error}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !hoursCheck.ok}
          className="db-btn primary"
          type="button"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        <div className="text-xs opacity-60">
          Timezone: {settings.timeZone || "America/New_York"}
        </div>
      </div>
    </div>
  );
}
