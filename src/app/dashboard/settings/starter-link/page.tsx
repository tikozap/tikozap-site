"use client";

import { useEffect, useMemo, useState } from "react";

type Btn = { label: string; url: string };

export default function StarterLinkSettings() {
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [greeting, setGreeting] = useState("");
  const [buttons, setButtons] = useState<Btn[]>([]);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/starter-link", { cache: "no-store" });
      const data = await res.json();
      setChannel(data.channel);
      setTitle(data.channel.title ?? "");
      setTagline(data.channel.tagline ?? "");
      setGreeting(data.channel.greeting ?? "");
      setButtons((data.channel.buttons ?? []) as Btn[]);
      setPublished(Boolean(data.channel.published));
      setLoading(false);
    })();
  }, []);

  const publicUrl = useMemo(() => {
    if (!channel?.slug) return "";
    return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/l/${channel.slug}`;
  }, [channel?.slug]);

  async function save(nextPublished?: boolean) {
    const res = await fetch("/api/starter-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        tagline,
        greeting,
        buttons,
        published: typeof nextPublished === "boolean" ? nextPublished : published,
      }),
    });
    const data = await res.json();
    setChannel(data.channel);
    setPublished(Boolean(data.channel.published));
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    alert("Link copied!");
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>Starter Link</h1>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        <span style={{ padding: "2px 10px", border: "1px solid #e5e7eb", borderRadius: 999 }}>
          No Website Needed
        </span>
      </p>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #e5e7eb", borderRadius: 14 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Your link</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
          <code style={{ flex: 1, padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
            {publicUrl}
          </code>
          <button onClick={copyLink} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            Copy
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => save(true)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
          >
            Publish
          </button>
          <button
            onClick={() => save(false)}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
          >
            Unpublish
          </button>
          <div style={{ marginLeft: "auto", opacity: 0.75, alignSelf: "center" }}>
            Status: <b>{published ? "Published" : "Draft"}</b>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <Field label="Business name" value={title} onChange={setTitle} />
        <Field label="Tagline" value={tagline} onChange={setTagline} />
        <Field label="Chat greeting" value={greeting} onChange={setGreeting} />

        <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 14 }}>
          <div style={{ fontWeight: 600 }}>Quick buttons (up to 6)</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Example: Call, Directions, Instagram, Menu
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {buttons.map((b, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}>
                <input
                  value={b.label}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setButtons(next);
                  }}
                  placeholder="Label"
                  style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
                />
                <input
                  value={b.url}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[idx] = { ...next[idx], url: e.target.value };
                    setButtons(next);
                  }}
                  placeholder="https://…"
                  style={{ padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
                />
                <button
                  onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                  style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              onClick={() => buttons.length < 6 && setButtons([...buttons, { label: "", url: "" }])}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            >
              Add button
            </button>

            <button
              onClick={() => save()}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 14 }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ marginTop: 8, width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb" }}
      />
    </div>
  );
}
