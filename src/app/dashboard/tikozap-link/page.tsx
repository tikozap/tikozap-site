// src/app/dashboard/tikozap-link/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import MobilePageHeader from "../_components/MobilePageHeader";

const fieldLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const fieldWrap: CSSProperties = {
  display: "grid",
  gap: 6,
};

type ProductForm = {
  title: string;
  price: string;
  image: string;
};

const emptyProduct = (): ProductForm => ({
  title: "",
  price: "",
  image: "",
});

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (typeof value !== "string" || !value.trim()) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function TikoZapLinkPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copiedMsg, setCopiedMsg] = useState("");

  const [slug, setSlug] = useState("my-store");
const [storeName, setStoreName] = useState("My Store");

const [logoUrl, setLogoUrl] = useState("");
const [tagline, setTagline] = useState("Tagline for store");
const [subheading, setSubheading] = useState("Store’s subheading");

const [assistantName, setAssistantName] = useState("Store Assistant");
const [greeting, setGreeting] = useState(
  "Hi! I can help with products, order tracking, shipping, and returns."
);

const [footerLine, setFooterLine] = useState("");
const [contactEmail, setContactEmail] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [returnNote, setReturnNote] = useState("");

  const [showProductsNav, setShowProductsNav] = useState(true);
  const [showContactNav, setShowContactNav] = useState(true);
  const [showFooterBrand, setShowFooterBrand] = useState(true);

  const [bestSeller, setBestSeller] = useState<ProductForm>({
    title: "Lush Active Skincare Set",
    price: "$58",
    image: "",
  });

  const [products, setProducts] = useState<ProductForm[]>(
    Array.from({ length: 9 }, () => emptyProduct())
  );

  const previewHref = `/l/${slug || "my-store"}`;
  const starterLinkUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/l/${slug || "my-store"}`
    : `/l/${slug || "my-store"}`;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/starter-link", { cache: "no-store" });
      const json = await res.json();

      if (!json?.starterLink) return;

      const data = json.starterLink;
      const page = data.page || {};

      setSlug(data.slug || "my-store");
      setStoreName(data.storeName || "My Store");
      setAssistantName(data.assistant?.assistantName || "Store Assistant");
      setGreeting(
        data.assistant?.greeting ||
          "Hi! I can help with products, order tracking, shipping, and returns."
      );

      setLogoUrl(page.logoUrl || "");
      setTagline(page.tagline || "Tagline for store");
      setSubheading(page.subheading || "Store’s subheading");
      setFooterLine(page.footerLine || data.storeName || "");
      setContactEmail(page.contactEmail || "");
      setShippingNote(page.shippingNote || "");
      setReturnNote(page.returnNote || "");

      setShowProductsNav(page.showProductsNav ?? true);
      setShowContactNav(page.showContactNav ?? true);
      setShowFooterBrand(page.showFooterBrand ?? true);

      setBestSeller(
        safeJsonParse<ProductForm>(page.bestSellerJson, {
          title: "Lush Active Skincare Set",
          price: "$58",
          image: "",
        })
      );

      const parsedProducts = safeJsonParse<ProductForm[]>(page.productsJson, []);
      setProducts([
        ...parsedProducts,
        ...Array.from({ length: Math.max(0, 9 - parsedProducts.length) }, () =>
          emptyProduct()
        ),
      ].slice(0, 9));
    } finally {
      setLoading(false);
    }
  }

  async function saveData() {
    setSaving(true);
    setSavedMsg("");

    try {
      const cleanProducts = products.filter(
        (p) => p.title.trim() || p.price.trim() || p.image.trim()
      );

      const res = await fetch("/api/starter-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          storeName,
          assistant: {
            assistantName,
            greeting,
          },
          page: {
            logoUrl,
            tagline,
            subheading,
            footerLine,
            contactEmail,
            shippingNote,
            returnNote,
            bestSellerJson: JSON.stringify(bestSeller),
            productsJson: JSON.stringify(cleanProducts),
            showProductsNav,
            showContactNav,
            showFooterBrand,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not save Starter Link.");
      }

      setSavedMsg("Saved.");
    } catch (e: any) {
      setSavedMsg(e?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function updateProduct(index: number, patch: Partial<ProductForm>) {
    setProducts((prev) =>
      prev.map((product, idx) =>
        idx === index ? { ...product, ...patch } : product
      )
    );
  }

  async function copyStarterLink() {
  try {
    await navigator.clipboard.writeText(starterLinkUrl);
    setCopiedMsg("Copied.");
    window.setTimeout(() => setCopiedMsg(""), 1800);
  } catch {
    setCopiedMsg("Could not copy.");
  }
}

  return (
    <div className="db-container">
      <MobilePageHeader title="Starter Link" />

      <div className="db-pageStack">
        <div className="db-top">
          <div>
            <h1 className="db-title">Starter Link</h1>
            <p className="db-sub">
              Your storefront page with web chat assistant for your customers.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="db-card">Loading Starter Link settings...</div>
        ) : null}

<div className="db-card">
  <div className="db-cardTitle">Starter Link setup</div>

  <p className="db-cardText">
    Share this link anywhere customers can find you.
  </p>

  <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
    <label style={fieldWrap}>
      <span style={fieldLabel}>Your Starter Link URL</span>

      <input
        className="db-btn"
        value={starterLinkUrl}
        readOnly
      />
    </label>

    <label style={fieldWrap}>
      <span style={fieldLabel}>Customize link ending</span>

      <input
        className="db-btn"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="your-store-name"
      />
    </label>

    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
<button
  className="db-btn primary"
  type="button"
  onClick={copyStarterLink}
  style={{
    minHeight: 34,
    paddingTop: 0,
    paddingBottom: 0,
    display: "inline-flex",
    alignItems: "center",
  }}
>
  Copy link
</button>

      <Link
        className="db-btn"
        href={previewHref}
        target="_blank"
      >
        Preview page
      </Link>

      {copiedMsg ? (
        <span
          style={{
            fontSize: 13,
            color: copiedMsg === "Copied." ? "#047857" : "#b91c1c",
          }}
        >
          {copiedMsg}
        </span>
      ) : null}
    </div>
  </div>
</div>

        <div className="db-card">
          <div className="db-cardTitle">Branding</div>
          <p className="db-cardText">Build your Starter Link page.</p>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={fieldWrap}>
  <span style={fieldLabel}>Store logo</span>

{logoUrl ? (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <img
      src={logoUrl}
      alt="Store logo preview"
      style={{
        width: 72,
        height: 72,
        objectFit: "cover",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    />

    <button
      type="button"
      className="db-btn"
      onClick={() => setLogoUrl("")}
    >
      Remove
    </button>
  </div>
) : null}

<label className="db-btn" style={{ width: "fit-content" }}>
  Choose logo image
  <input
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(String(reader.result || ""));
      };
      reader.readAsDataURL(file);
    }}
  />
</label>

  <input
    className="db-btn"
    placeholder="Or paste logo image URL"
    value={logoUrl}
    onChange={(e) => setLogoUrl(e.target.value)}
  />
</label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Store name</span>
              <input className="db-btn" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Tagline</span>
              <input className="db-btn" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Subheading</span>
              <textarea className="db-btn" value={subheading} onChange={(e) => setSubheading(e.target.value)} style={{ minHeight: 88, paddingTop: 10, resize: "vertical" }} />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Products</div>
<p className="db-cardText">
  Feature your best seller and 9 products on your storefront page.
</p>

<div
  style={{
    marginTop: 10,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.45,
  }}
>
  Need more products later? Starter supports up to 30 products. Growth supports up to 90.
</div>

          <div style={{ marginTop: 12, display: "grid", gap: 16 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14, background: "#f8fafc" }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Best Seller</div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={fieldWrap}>
                  <span style={fieldLabel}>Title</span>
                  <input className="db-btn" value={bestSeller.title} onChange={(e) => setBestSeller({ ...bestSeller, title: e.target.value })} />
                </label>

                <label style={fieldWrap}>
                  <span style={fieldLabel}>Price</span>
                  <input className="db-btn" value={bestSeller.price} onChange={(e) => setBestSeller({ ...bestSeller, price: e.target.value })} />
                </label>

<label style={fieldWrap}>
  <span style={fieldLabel}>Product image</span>

  {bestSeller.image ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src={bestSeller.image}
        alt="Best seller preview"
        style={{
          width: 72,
          height: 72,
          objectFit: "cover",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      />

      <button
        type="button"
        className="db-btn"
        onClick={() =>
          setBestSeller({ ...bestSeller, image: "" })
        }
      >
        Remove
      </button>
    </div>
  ) : null}

  <label className="db-btn" style={{ width: "fit-content" }}>
    Choose image
    <input
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          setBestSeller({
            ...bestSeller,
            image: String(reader.result || ""),
          });
        };
        reader.readAsDataURL(file);
      }}
    />
  </label>

  <input
    className="db-btn"
    placeholder="Or paste image URL"
    value={bestSeller.image}
    onChange={(e) =>
      setBestSeller({ ...bestSeller, image: e.target.value })
    }
  />
</label>
              </div>
            </div>

            {products.map((product, idx) => (
              <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14, background: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Product {idx + 1}</div>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={fieldWrap}>
                    <span style={fieldLabel}>Product title</span>
                    <input className="db-btn" value={product.title} onChange={(e) => updateProduct(idx, { title: e.target.value })} />
                  </label>

                  <label style={fieldWrap}>
                    <span style={fieldLabel}>Price</span>
                    <input className="db-btn" value={product.price} onChange={(e) => updateProduct(idx, { price: e.target.value })} />
                  </label>

<label style={fieldWrap}>
  <span style={fieldLabel}>Product image</span>

  {product.image ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src={product.image}
        alt={`Product ${idx + 1}`}
        style={{
          width: 72,
          height: 72,
          objectFit: "cover",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      />

      <button
        type="button"
        className="db-btn"
        onClick={() =>
          updateProduct(idx, { image: "" })
        }
      >
        Remove
      </button>
    </div>
  ) : null}

  <label className="db-btn" style={{ width: "fit-content" }}>
    Choose image
    <input
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          updateProduct(idx, {
            image: String(reader.result || ""),
          });
        };
        reader.readAsDataURL(file);
      }}
    />
  </label>

  <input
    className="db-btn"
    placeholder="Or paste image URL"
    value={product.image}
    onChange={(e) =>
      updateProduct(idx, { image: e.target.value })
    }
  />
</label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Assistant</div>
          <p className="db-cardText">Name your chat assistant.</p>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={fieldWrap}>
              <span style={fieldLabel}>Assistant name</span>
              <input className="db-btn" value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Greeting message</span>
              <textarea className="db-btn" value={greeting} onChange={(e) => setGreeting(e.target.value)} style={{ minHeight: 88, paddingTop: 10, resize: "vertical" }} />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Footer & contact</div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={fieldWrap}>
              <span style={fieldLabel}>Footer text</span>
              <input className="db-btn" value={footerLine} onChange={(e) => setFooterLine(e.target.value)} />
            </label>

          <p
           style={{
            margin: 0,
            fontSize: 12,
            color: "#6b7280",
          }}
       >
          Your store name, owner name, or short message. Powered by TikoZap is added automatically.
       </p>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Contact email</span>
              <input className="db-btn" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Shipping note</span>
              <input className="db-btn" value={shippingNote} onChange={(e) => setShippingNote(e.target.value)} />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Return note</span>
              <input className="db-btn" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Public page controls</div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={showProductsNav} onChange={(e) => setShowProductsNav(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Show Products menu link</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" checked={showContactNav} onChange={(e) => setShowContactNav(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Show Contact menu link</span>
            </label>
          </div>
        </div>

        <div className="db-card">
          <div className="db-cardTitle">Save changes</div>
          <p className="db-cardText">Save your Starter Link settings, then preview the public page.</p>

          <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="db-btn primary" type="button" onClick={saveData} disabled={saving}>
              {saving ? "Saving..." : "Save Starter Link"}
            </button>

<Link
  className="db-btn"
  href={previewHref}
  target="_blank"
  style={{
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
  }}
>
  Preview page
</Link>

            {savedMsg ? <span style={{ fontSize: 13, color: savedMsg === "Saved." ? "#047857" : "#b91c1c" }}>{savedMsg}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}