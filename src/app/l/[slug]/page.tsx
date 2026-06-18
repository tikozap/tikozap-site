// src/app/l/[slug]/page.tsx

import { prisma } from "@/lib/prisma";
import { newWidgetPublicKey, isTzWidgetKey } from "@/lib/widgetKey";
import StarterLinkAssistant from "./_components/StarterLinkAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeSlug(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const DEMO_BEST_SELLER = {
  id: "best-1",
  title: "Lush Active Skincare Set",
  price: "$58",
  image:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80",
};
const DEMO_FEATURED = [
  {
    id: "feat-1",
    title: "Classic Midi Dress",
    price: "$89",
    image:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "feat-2",
    title: "Summer Floral Dress",
    price: "$79",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "feat-3",
    title: "City Rain Jacket",
    price: "$89",
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80",
  },
];

const DEMO_PROMPTS = [
  "Show me best sellers",
  "Find something under $50",
  "Track my order",
];

const TRUST_PILLS = ["Fast answers", "Easy support", "Product help"];

export default async function StarterLinkPage({
  params,
}: {
  params: { slug: string };
}) {
      const slug = safeSlug(params.slug);
  const isDemoSlug = slug === "demo" || slug === "demo-boutique";

  const tenant = await prisma.tenant.findFirst({
    where: isDemoSlug
      ? {
          OR: [
            { slug: "demo-boutique" },
            { starterLinkSlug: "demo" },
            { starterLinkSlug: "demo-boutique" },
            { storeName: "Demo Boutique" },
          ],
        }
      : {
          starterLinkEnabled: true,
          OR: [{ starterLinkSlug: slug }, { slug }],
        },
select: {
  id: true,
  slug: true,
  storeName: true,
  settingsJson: true,
  starterLinkPage: true,
  widget: {
    select: {
  publicKey: true,
  installedAt: true,
  assistantName: true,
  brandColor: true,
  greeting: true,
}
  },
},
  });

  if (!tenant && !isDemoSlug) {
    return (
      <div style={{ maxWidth: 760, margin: "48px auto", padding: 16 }}>
        <h1>Link not found</h1>
        <p>This TikoZap Starter Link doesn’t exist (or is disabled).</p>
      </div>
    );
  }

let storeName = "My Store";
let tagline = "Tagline for store";
let subheading = "Store’s subheading";
let assistantName = "Demo Boutique Assistant";
let greeting =
  "Hi! I can help with products, order tracking, shipping, and returns.";
let footerLine = "My Store";

let widgetPublicKey = "tz_demo_demo";
let brandColor = "#111827";

let storeLogoUrl = "";
let contactEmail = "";
let shippingNote = "";
let returnNote = "";

let showProductsNav = true;
let showContactNav = true;
let showFooterBrand = true;

let bestSeller = DEMO_BEST_SELLER;
let featuredProducts = DEMO_FEATURED;

const showMerchantLogin = false;

  if (tenant) {
    const widgetRow = tenant.widget
      ? tenant.widget
      : await prisma.widget.create({
          data: {
            tenantId: tenant.id,
            publicKey: newWidgetPublicKey(),
            enabled: true,
          },
          select: {
  publicKey: true,
  installedAt: true,
  assistantName: true,
  brandColor: true,
  greeting: true,
}
        });

    widgetPublicKey = widgetRow.publicKey;

    const canRotate =
      process.env.NODE_ENV !== "production" || !widgetRow.installedAt;

    if (!isTzWidgetKey(widgetPublicKey) && canRotate) {
      const rotated = await prisma.widget.update({
        where: { tenantId: tenant.id },
        data: { publicKey: newWidgetPublicKey() },
        select: { publicKey: true },
      });

      widgetPublicKey = rotated.publicKey;
    }

    storeName = tenant.storeName;
const page = tenant.starterLinkPage;
const settings = parseJson(
  (tenant as any).settingsJson,
  {}
) as Record<string, string>;

if (page) {
  storeLogoUrl = page.logoUrl || "";
  tagline = page.tagline || tagline;
  subheading = page.subheading || subheading;
  footerLine = page.footerLine || footerLine;

  contactEmail = page.contactEmail || "";
  shippingNote = page.shippingNote || "";
  returnNote = page.returnNote || "";

  showProductsNav = page.showProductsNav;
  showContactNav = page.showContactNav;
  showFooterBrand = page.showFooterBrand;

  bestSeller = parseJson(page.bestSellerJson, DEMO_BEST_SELLER);
  featuredProducts = parseJson(page.productsJson, DEMO_FEATURED);
}

assistantName =
  settings.tz_assistant_name?.trim() ||
  widgetRow.assistantName?.trim() ||
  `${storeName} Assistant`;

greeting =
  settings.tz_assistant_greeting?.trim() ||
  widgetRow.greeting?.trim() ||
  "Hi! I can help with products, order tracking, shipping, and returns.";

if (!page?.footerLine) {
  footerLine = storeName;
}

brandColor =
  settings.tz_brand_color?.trim() ||
  widgetRow.brandColor?.trim() ||
  "#111827";
  }

return (
  <div className="sl-page">
    <div className="sl-shell">
      <header className="sl-nav">
  <div className="sl-brand">
    {storeLogoUrl ? (
      <img src={storeLogoUrl} alt={storeName} className="sl-brandLogo" />
    ) : null}

    <div className="sl-brandText">{storeName}</div>
  </div>

  <div className="sl-navRight">
    <nav className="sl-desktopNav" aria-label="Store">
      {showProductsNav ? (
        <a href="#products" className="sl-navLink">Products</a>
      ) : null}

      {showContactNav ? (
        <a href="#footer" className="sl-navLink">Contact</a>
      ) : null}
    </nav>
  </div>
</header>
        <div className="sl-desktopLayout">
        <main className="sl-mainCol">
<section className="sl-hero">
  <h1 className="sl-title">{tagline}</h1>
<p className="sl-subheading">{subheading}</p>
</section>

<section className="sl-bestSeller">
  <div className="sl-sectionTitle">Best Seller</div>

  <article className="sl-bestCard">
    <img
      src={bestSeller.image}
      alt={bestSeller.title}
      className="sl-bestImage"
    />

    <div className="sl-bestMeta">
      <div>
        <div className="sl-bestBadge">Customer favorite</div>
        <div className="sl-bestTitle">{bestSeller.title}</div>
        <div className="sl-bestPrice">{bestSeller.price}</div>
      </div>

      <button type="button" className="sl-bestBtn">
        Ask about this
      </button>
    </div>
  </article>
</section>

<section id="products" className="sl-products">
  <div className="sl-sectionTitle">In Stock</div>

  <div className="sl-productGrid">
    {featuredProducts.slice(0, 9).map((item) => (
      <article key={item.id} className="sl-productCard">
        <img
          src={item.image}
          alt={item.title}
          className="sl-productImage"
        />
        <div className="sl-productMeta">
          <div className="sl-productTitle">{item.title}</div>
          <div className="sl-productPrice">{item.price}</div>
        </div>
      </article>
    ))}
  </div>
</section>

        <footer id="footer" className="sl-footer">
          <div className="sl-footerLine">
  {footerLine || storeName}
</div>

<div className="sl-poweredLine">
  Powered by TikoZap
</div>
{contactEmail ? <div className="sl-footerLine">{contactEmail}</div> : null}
{shippingNote ? <div className="sl-footerLine">{shippingNote}</div> : null}
{returnNote ? <div className="sl-footerLine">{returnNote}</div> : null}
        </footer>

    </main>

    <aside className="sl-assistantRail">
      <StarterLinkAssistant
  publicKey={widgetPublicKey}
  assistantName={assistantName}
  greeting={greeting}
  premium={false}
  brandColor={brandColor}
  desktopDocked
/>
    </aside>
  </div>
</div>

      <style>{`
        .sl-page{
          min-height:100vh;
          background:#f8fafc;
          color:#111827;
        }

        .sl-shell{
          max-width:1120px;
          margin:0 auto;
          padding:16px;
        }

        .sl-nav{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:6px 0 14px;
        }

.sl-desktopNav{
  display:none;
  align-items:center;
  gap:24px;
}

.sl-navLink{
  font-size:16px;
  color:#6b7280;
  text-decoration:none;
}

.sl-navLink:hover{
  color:#111827;
}

        .sl-brand{
          display:flex;
          align-items:center;
          gap:10px;
          min-width:0;
        }

        .sl-brandLogo{
          width:36px;
          height:36px;
          object-fit:cover;
          border-radius:12px;
          border:1px solid #d1d5db;
          background:#fff;
          flex:0 0 36px;
        }

        .sl-brandText{
          font-size:18px;
          font-weight:800;
          color:#0f172a;
          min-width:0;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .sl-navRight{
          display:flex;
          align-items:center;
          gap:12px;
          flex:0 0 auto;
        }

        .sl-loginLink{
          font-size:14px;
          color:#6b7280;
          text-decoration:none;
        }

        .sl-menuBtn{
          width:48px;
          height:48px;
          border-radius:16px;
          border:1px solid #e5e7eb;
          background:#fff;
          color:#6b7280;
          font-size:26px;
          line-height:1;
          flex:0 0 48px;
        }

        .sl-hero{
          padding:10px 0 6px;
        }

        .sl-title{
          margin:0;
          font-size:34px;
          line-height:1.05;
          font-weight:900;
          letter-spacing:-0.03em;
        }

        .sl-tagline{
          margin:12px 0 0;
          font-size:16px;
          line-height:1.5;
          color:#4b5563;
        }

        .sl-subheading{
          margin:8px 0 0;
          font-size:14px;
          line-height:1.5;
          color:#6b7280;
        }

        .sl-ctaRow{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:16px;
        }

        .sl-cta{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:44px;
          padding:0 16px;
          border-radius:999px;
          text-decoration:none;
          font-size:14px;
          font-weight:700;
          border:1px solid #d1d5db;
        }

        .sl-ctaPrimary{
          background:#111827;
          border-color:#111827;
          color:#fff;
        }

        .sl-ctaSecondary{
          background:#fff;
          color:#111827;
        }
        
        .sl-assistantCard{
          margin-top:18px;
          border:1px solid #e5e7eb;
          border-radius:22px;
          background:#fff;
          padding:18px;
          box-shadow:0 1px 2px rgba(15,23,42,.04);
        }

        .sl-assistantName{
          font-size:14px;
          font-weight:800;
        }

        .sl-assistantCopy{
          margin:10px 0 0;
          font-size:15px;
          line-height:1.65;
          color:#374151;
        }

        .sl-prompts{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:16px;
        }

        .sl-promptBtn{
          border:1px solid #e5e7eb;
          border-radius:999px;
          background:#fff;
          color:#111827;
          padding:12px 16px;
          font-size:14px;
          font-weight:700;
        }

        .sl-trust{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:18px;
        }

        .sl-trustItem{
          border:1px solid #e5e7eb;
          border-radius:999px;
          background:#fff;
          padding:10px 14px;
          font-size:13px;
          color:#4b5563;
        }

.sl-logoRow{
  display:flex;
  align-items:flex-start;
  gap:14px;
}

.sl-storeLogoLarge{
  width:52px;
  height:52px;
  border-radius:16px;
  object-fit:cover;
  border:1px solid #e5e7eb;
  background:#fff;
  flex:0 0 52px;
}

.sl-storeLogoFallback{
  width:52px;
  height:52px;
  border-radius:16px;
  border:1px solid #e5e7eb;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:14px;
  font-weight:900;
  color:#111827;
  flex:0 0 52px;
}

.sl-storeEyebrow{
  font-size:14px;
  font-weight:800;
  color:#111827;
  margin-bottom:10px;
}

.sl-bestSeller{
  margin-top:26px;
}

.sl-bestCard{
  border:1px solid #e5e7eb;
  border-radius:22px;
  background:#fff;
  overflow:hidden;
  box-shadow:0 1px 2px rgba(15,23,42,.04);
}

.sl-bestImage{
  width:100%;
  aspect-ratio:16 / 9;
  object-fit:cover;
  display:block;
  background:#f3f4f6;
}

.sl-bestMeta{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  padding:16px;
}

.sl-bestBadge{
  width:max-content;
  border:1px solid #e5e7eb;
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  font-weight:700;
  color:#6b7280;
  margin-bottom:10px;
}

.sl-bestTitle{
  font-size:18px;
  font-weight:900;
  line-height:1.25;
  color:#111827;
}

.sl-bestPrice{
  margin-top:6px;
  font-size:14px;
  font-weight:800;
  color:#6b7280;
}

.sl-bestBtn{
  border:1px solid #111827;
  background:#111827;
  color:#fff;
  border-radius:999px;
  padding:12px 14px;
  font-size:13px;
  font-weight:800;
  white-space:nowrap;
}

        .sl-products{
          margin-top:26px;
        }

        .sl-sectionTitle{
          font-size:15px;
          font-weight:800;
          color:#374151;
          margin-bottom:12px;
        }

        .sl-productGrid{
          display:grid;
          grid-template-columns:1fr;
          gap:16px;
        }

        .sl-productCard{
          border:1px solid #e5e7eb;
          border-radius:22px;
          background:#fff;
          overflow:hidden;
          box-shadow:0 1px 2px rgba(15,23,42,.04);
        }

        .sl-productImage{
          width:100%;
          aspect-ratio:4 / 5;
          object-fit:cover;
          display:block;
          background:#f3f4f6;
        }

        .sl-productMeta{
          display:grid;
          gap:6px;
          padding:16px;
        }

        .sl-productTitle{
          font-size:16px;
          font-weight:800;
          line-height:1.35;
        }

        .sl-productPrice{
          font-size:14px;
          font-weight:700;
          color:#6b7280;
        }

        .sl-footer{
          margin-top:36px;
          padding:18px 0 28px;
          border-top:1px solid #e5e7eb;
        }

        .sl-footerLine{
          font-size:13px;
          color:#6b7280;
        }

.sl-desktopLayout{
  display:block;
}

.sl-assistantRail{
  display:block;
}

@media (min-width: 760px){
  .sl-shell{
    max-width:1320px;
    padding:24px;
  }

  .sl-nav{
    margin-bottom:22px;
  }

  .sl-desktopLayout{
  display:block;
  position:relative;
  padding-right:0;
  transition:padding-right 300ms ease;
}

.sl-desktopLayout:has(.sl-assistantPanel){
  padding-right:448px;
}

.sl-mainCol{
  min-width:0;
  transition:max-width 300ms ease;
}

.sl-assistantRail{
  display:block;
  min-width:0;
  position:fixed;
  right:max(24px, calc((100vw - 1320px) / 2 + 24px));
  top:96px;
  bottom:32px;
  width:min(420px, calc(100vw - 48px));
  height:auto;
  z-index:20;
}

.sl-assistantRail :global(.sl-assistantLauncher--docked){
  right:max(32px, calc((100vw - 1320px) / 2 + 32px));
  bottom:32px;
}

  .sl-desktopNav{
    display:flex;
  }

  .sl-menuBtn{
    display:none;
  }

  .sl-productGrid{
    grid-template-columns:repeat(3, minmax(0, 1fr));
  }

  .sl-poweredLine{
  margin-top:8px;
  font-size:12px;
  font-weight:700;
  color:#9ca3af;
}
}
      `}</style>
    </div>
  );
}