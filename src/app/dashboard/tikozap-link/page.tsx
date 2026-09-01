// src/app/dashboard/tikozap-link/page.tsx

"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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

function validateImageFile(file: File) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    alert('Please choose a JPG, PNG, or WebP image.');
    return false;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('Please choose an image smaller than 2 MB.');
    return false;
  }

  return true;
}

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

const [savedSnapshot, setSavedSnapshot] = useState("");
const [pendingHref, setPendingHref] = useState<string | null>(null);
const allowNavigationRef = useRef(false);

  const [slug, setSlug] = useState("my-store");
const [storeName, setStoreName] = useState("My Store");

const [logoUrl, setLogoUrl] = useState("");
const [tagline, setTagline] = useState("Tagline for store");
const [subheading, setSubheading] = useState("Store’s subheading");

const [assistantName, setAssistantName] = useState("Store Assistant");
const [greeting, setGreeting] = useState(
  "Hi! I can help with products, order tracking, shipping, and returns."
);

const [aboutText, setAboutText] = useState("");
const [contactEmail, setContactEmail] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [returnNote, setReturnNote] = useState("");

  const [showProductsNav, setShowProductsNav] = useState(true);
  const [showContactNav, setShowContactNav] = useState(true);

  const [bestSeller, setBestSeller] = useState<ProductForm>(emptyProduct());

const [featuredProductType, setFeaturedProductType] =
  useState<"bestsellers" | "newArrivals">("bestsellers");


  const [products, setProducts] = useState<ProductForm[]>(
    Array.from({ length: 9 }, () => emptyProduct())
  );

  const [starterLinkEnabled, setStarterLinkEnabled] = useState(false);
  const [changingEnabled, setChangingEnabled] = useState(false);

  const starterLinkSnapshot = useMemo(
  () =>
    JSON.stringify({
      slug,
      storeName,
      logoUrl,
      tagline,
      subheading,
      assistantName,
      greeting,
      aboutText,
      contactEmail,
      shippingNote,
      returnNote,
      showProductsNav,
      showContactNav,
      bestSeller,
      featuredProductType,
      products,
    }),
  [
    slug,
    storeName,
    logoUrl,
    tagline,
    subheading,
    assistantName,
    greeting,
    aboutText,
    contactEmail,
    shippingNote,
    returnNote,
    showProductsNav,
    showContactNav,
    bestSeller,
    featuredProductType,
    products,
  ]
);

const hasUnsavedChanges =
  Boolean(savedSnapshot) &&
  starterLinkSnapshot !== savedSnapshot;

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

      setStarterLinkEnabled(Boolean(data.enabled));
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
      // The existing footerLine field now stores the merchant's About us text.
      setAboutText(page.footerLine || "");
      setContactEmail(page.contactEmail || "");
      setShippingNote(page.shippingNote || "");
      setReturnNote(page.returnNote || "");

setShowProductsNav(page.showProductsNav ?? true);
setShowContactNav(page.showContactNav ?? true);

const loadedFeaturedProductType =
  page.featuredProductType === "newArrivals"
    ? "newArrivals"
    : "bestsellers";

setFeaturedProductType(loadedFeaturedProductType);

const loadedBestSeller = safeJsonParse<ProductForm>(
  page.bestSellerJson,
  emptyProduct()
);

setBestSeller(loadedBestSeller);

const parsedProducts = safeJsonParse<ProductForm[]>(
  page.productsJson,
  []
);

const loadedProducts = [
  ...parsedProducts,
  ...Array.from(
    { length: Math.max(0, 9 - parsedProducts.length) },
    () => emptyProduct()
  ),
].slice(0, 9);

setProducts(loadedProducts);

setSavedSnapshot(
  JSON.stringify({
    slug: data.slug || "my-store",
    storeName: data.storeName || "My Store",
    logoUrl: page.logoUrl || "",
    tagline: page.tagline || "Tagline for store",
    subheading: page.subheading || "Store’s subheading",
    assistantName:
      data.assistant?.assistantName || "Store Assistant",
    greeting:
      data.assistant?.greeting ||
      "Hi! I can help with products, order tracking, shipping, and returns.",
    aboutText: page.footerLine || "",
    contactEmail: page.contactEmail || "",
    shippingNote: page.shippingNote || "",
    returnNote: page.returnNote || "",
    showProductsNav: page.showProductsNav ?? true,
    showContactNav: page.showContactNav ?? true,
    featuredProductType: loadedFeaturedProductType,
    bestSeller: loadedBestSeller,
    products: loadedProducts,
  })
);
    } finally {
      setLoading(false);
    }
  }

  async function saveData(): Promise<boolean> {
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
          enabled: starterLinkEnabled,
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
            footerLine: aboutText,
            contactEmail,
            shippingNote,
            returnNote,
            bestSellerJson: JSON.stringify(bestSeller),
            productsJson: JSON.stringify(cleanProducts),
            featuredProductType,
            showProductsNav,
            showContactNav,
            showFooterBrand: true,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Could not save Starter Link.");
      }

      setSavedMsg("Saved.");
setSavedSnapshot(starterLinkSnapshot);

return true;
} catch (e: any) {

  setSavedMsg(e?.message || "Could not save.");

  return false;

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

async function toggleStarterLinkEnabled() {
  if (changingEnabled) return;

  const next = !starterLinkEnabled;
  setChangingEnabled(true);

  try {
    const res = await fetch("/api/starter-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "set-enabled",
        enabled: next,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      throw new Error(
        data?.error || "Could not update Starter Link."
      );
    }

    setStarterLinkEnabled(Boolean(data.enabled));
  } catch (error: any) {
    alert(
      error?.message ||
        "Could not update Starter Link."
    );
  } finally {
    setChangingEnabled(false);
  }
}

useEffect(() => {
  if (!hasUnsavedChanges) return;

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (allowNavigationRef.current) return;

    event.preventDefault();
    event.returnValue = "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener(
      "beforeunload",
      handleBeforeUnload
    );
  };
}, [hasUnsavedChanges]);

useEffect(() => {
  if (!hasUnsavedChanges) return;

  const handleClick = (event: MouseEvent) => {
    if (allowNavigationRef.current) return;

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a");

    if (!anchor) return;

    const href = anchor.getAttribute("href");

    if (!href || !href.startsWith("/dashboard")) return;

    if (
      anchor.getAttribute("target") === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setPendingHref(href);
  };

  document.addEventListener("click", handleClick, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
  };
}, [hasUnsavedChanges]);

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
    Share a simple storefront anywhere customers can find you.
  </p>

  <button
    type="button"
    className={`sl-enableRow ${starterLinkEnabled ? "is-on" : ""}`}
    onClick={toggleStarterLinkEnabled}
    disabled={changingEnabled}
    aria-pressed={starterLinkEnabled}
  >
    <span>
      <strong>Enable Starter Link</strong>
      <small>
        Create a public storefront with your assistant that you can share anywhere.
      </small>
    </span>

    <span className="sl-enableDot" aria-hidden="true" />
  </button>

  {starterLinkEnabled ? (
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
        <span style={fieldLabel}>Starter Link address</span>

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
              color:
                copiedMsg === "Copied."
                  ? "#047857"
                  : "#b91c1c",
            }}
          >
            {copiedMsg}
          </span>
        ) : null}
      </div>
    </div>
  ) : null}
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
          <div className="db-cardTitle">Store information</div>
          <p className="db-cardText">
            Add the information customers can open from your storefront footer.
          </p>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <label style={fieldWrap}>
              <span style={fieldLabel}>About us</span>
              <textarea
                className="db-btn"
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Tell customers about your store, products, and what makes your business special."
                style={{ minHeight: 96, paddingTop: 10, resize: "vertical" }}
              />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Support email</span>
              <input
                type="email"
                className="db-btn"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="support@yourstore.com"
              />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Shipping information</span>
              <textarea
                className="db-btn"
                value={shippingNote}
                onChange={(e) => setShippingNote(e.target.value)}
                placeholder="Tell customers where you ship and how long delivery usually takes."
                style={{ minHeight: 80, paddingTop: 10, resize: "vertical" }}
              />
            </label>

            <label style={fieldWrap}>
              <span style={fieldLabel}>Return information</span>
              <textarea
                className="db-btn"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Explain your return window and any important conditions."
                style={{ minHeight: 80, paddingTop: 10, resize: "vertical" }}
              />
            </label>

            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Footer links appear automatically when information is added. Powered by TikoZap is always included.
            </p>
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
    accept="image/jpeg,image/png,image/webp"
    style={{ display: "none" }}
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!validateImageFile(file)) return;

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

  Feature a bestseller or new arrival and 9 products on your storefront page.

</p>

<div
  style={{
    marginTop: 12,
    display: "inline-flex",
    padding: 4,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#f8fafc",
    gap: 4,
  }}
>
  <button
    type="button"
    onClick={() => setFeaturedProductType("bestsellers")}
    style={{
      border: 0,
      borderRadius: 9,
      padding: "8px 14px",
      fontWeight: 800,
      cursor: "pointer",
      background:
        featuredProductType === "bestsellers" ? "#ffffff" : "transparent",
      color:
        featuredProductType === "bestsellers" ? "#111827" : "#6b7280",
      boxShadow:
        featuredProductType === "bestsellers"
          ? "0 1px 3px rgba(0,0,0,0.10)"
          : "none",
    }}
  >
    Bestsellers
  </button>

  <button
    type="button"
    onClick={() => setFeaturedProductType("newArrivals")}
    style={{
      border: 0,
      borderRadius: 9,
      padding: "8px 14px",
      fontWeight: 800,
      cursor: "pointer",
      background:
        featuredProductType === "newArrivals" ? "#ffffff" : "transparent",
      color:
        featuredProductType === "newArrivals" ? "#111827" : "#6b7280",
      boxShadow:
        featuredProductType === "newArrivals"
          ? "0 1px 3px rgba(0,0,0,0.10)"
          : "none",
    }}
  >
    New Arrivals
  </button>
</div>

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

              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                {featuredProductType === "newArrivals"
                  ? "New Arrivals"
                  : "Bestsellers"}
              </div>

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
      accept="image/jpeg,image/png,image/webp"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!validateImageFile(file)) return;

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
      accept="image/jpeg,image/png,image/webp"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!validateImageFile(file)) return;

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

      {pendingHref ? (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "rgba(17, 24, 39, 0.38)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sl-unsaved-title"
      style={{
        width: "100%",
        maxWidth: 440,
        background: "#ffffff",
        borderRadius: 16,
        padding: 24,
        boxShadow:
          "0 24px 70px rgba(17, 24, 39, 0.22)",
      }}
    >
      <h2
        id="sl-unsaved-title"
        style={{
          margin: 0,
          fontSize: 20,
          color: "#111827",
        }}
      >
        You have unsaved changes.
      </h2>

      <p
        style={{
          margin: "8px 0 20px",
          color: "#6b7280",
        }}
      >
        Save your changes before leaving?
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="db-btn"
          onClick={() => setPendingHref(null)}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="db-btn"
          onClick={() => {
            const href = pendingHref;

            allowNavigationRef.current = true;
            window.location.href = href;
          }}
          disabled={saving}
        >
          Leave without saving
        </button>

        <button
          type="button"
          className="db-btn primary"
          onClick={async () => {
            const href = pendingHref;

            const saved = await saveData();

            if (!saved) return;

            allowNavigationRef.current = true;
            window.location.href = href;
          }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & leave"}
        </button>
      </div>
    </div>
  </div>
) : null}
      <style jsx>{`
  .sl-enableRow {
    width: 100%;
    margin-top: 12px;
    border: none;
    border-top: 1px solid #eef2f7;
    background: transparent;
    padding: 14px 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 28px;
    gap: 18px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    color: #111827;
  }

  .sl-enableRow:hover {
    background: #f8fafc;
  }

  .sl-enableRow strong {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #111827;
  }

  .sl-enableRow small {
    display: block;
    margin-top: 4px;
    max-width: 420px;
    font-size: 12px;
    line-height: 1.35;
    color: #64748b;
  }

  .sl-enableDot {
    width: 20px;
    height: 20px;
    border-radius: 999px;
    border: 2px solid #cbd5e1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    justify-self: end;
  }

  .sl-enableRow.is-on .sl-enableDot {
    border-color: #6366f1;
  }

  .sl-enableRow.is-on .sl-enableDot::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #6366f1;
  }
`}</style>
    </div>
  );
}