// src/app/dashboard/settings/CreateWorkspaceCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWorkspaceCard() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("tikozap.myshopify.com");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onCreate() {
    setMsg(null);
    const name = storeName.trim();
    if (!name) {
      setMsg("Please enter a workspace / store name.");
      return;
    }

    setLoading(true);
    try {
      const domains = allowedDomains
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const r = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeName: name,
          allowedDomains: domains,
        }),
      });

      const data = await r.json();
      if (!r.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${r.status}`);
      }

      setMsg(
        `Created "${data.tenant.storeName}". Public key: ${data.tenant.publicKey}`
      );

      // If your app uses tz_tenant_id cookie in middleware/layout,
      // a refresh should switch the sidebar to the new tenant.
      router.refresh();

      // Optionally route somewhere:
      // router.push("/dashboard/widget");
    } catch (e: any) {
      setMsg(e?.message || "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, maxWidth: 720 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        Create a new workspace
      </h2>

      <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.8 }}>
        This creates a <b>Tenant</b> + <b>Membership</b> + <b>Widget</b>. The widget
        public key (tz_...) is generated automatically.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Workspace / Store name</span>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder='e.g. "TikoZap Demo Store"'
            style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Allowed domains (comma-separated)</span>
          <input
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="tikozap.myshopify.com, yourdomain.com, *.yourdomain.com"
            style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}
          />
          <small style={{ opacity: 0.75 }}>
            Put <code>tikozap.myshopify.com</code> here for Shopify dev store testing.
          </small>
        </label>

        <button
          onClick={onCreate}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: loading ? "#f3f4f6" : "#111827",
            color: loading ? "#111827" : "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Creating..." : "Create workspace"}
        </button>

        {msg && (
          <div style={{ padding: 10, borderRadius: 10, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
