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

type StarterLinkProduct = {
  id: string;
  title: string;
  price: string;
  image: string;
};

const EMPTY_BEST_SELLER: StarterLinkProduct = {
  id: "",
  title: "",
  price: "",
  image: "",
};

export default async function StarterLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = safeSlug(rawSlug);

const tenant = await prisma.tenant.findFirst({
  where: {
    starterLinkEnabled: true,
    OR: [
      { starterLinkSlug: slug },
      { slug },
    ],
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
  assistantIdentity: true,
  brandColor: true,
  greeting: true,
}
  },
},
  });

if (!tenant) {
  return (
    <div style={{ maxWidth: 760, margin: "48px auto", padding: 16 }}>
      <h1>Link not found</h1>
      <p>This TikoZap Starter Link doesn’t exist (or is disabled).</p>
    </div>
  );
}

let storeName = "My Store";
let tagline = "or store";
let subheading = "Store’s subheading";
let assistantName = "Store Assistant";
let widgetPublicKey = "";
let assistantIdentity = "Female";
let greeting =
  "Hi! I can help with products, order tracking, shipping, and returns.";
let aboutText = "";

let brandColor = "#111827";

let storeLogoUrl = "";
let contactEmail = "";
let shippingNote = "";
let returnNote = "";

let showProductsNav = true;

let showContactNav = true;

let featuredProductType: "bestsellers" | "newArrivals" = "bestsellers";

let bestSeller: StarterLinkProduct = EMPTY_BEST_SELLER;
let featuredProducts: StarterLinkProduct[] = [];

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
  assistantIdentity: true,
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

  bestSeller = parseJson<StarterLinkProduct>(
  page.bestSellerJson,
  EMPTY_BEST_SELLER
);

  featuredProducts = parseJson<StarterLinkProduct[]>(
  page.productsJson,
  []
);
  // Reuse the existing footerLine database field as the merchant's About us text.
  const savedAboutText = page.footerLine?.trim() || "";

aboutText = /powered by tikozap/i.test(savedAboutText)
  ? ""
  : savedAboutText;

  shippingNote = page.shippingNote || "";
  returnNote = page.returnNote || "";

showProductsNav = page.showProductsNav;

showContactNav = page.showContactNav;

featuredProductType =
  page.featuredProductType === "newArrivals"
    ? "newArrivals"
    : "bestsellers";
}

contactEmail =
  settings.supportEmail?.trim() ||
  page?.contactEmail ||
  "";

assistantName =
  settings.tz_assistant_name?.trim() ||
  widgetRow.assistantName?.trim() ||
  `${storeName} Assistant`;

assistantIdentity =
  settings.tz_assistant_identity?.trim() ||
  widgetRow.assistantIdentity?.trim() ||
  "Female";

greeting =
  settings.tz_assistant_greeting?.trim() ||
  widgetRow.greeting?.trim() ||
  "Hi! I can help with products, order tracking, shipping, and returns.";

brandColor =
  settings.tz_brand_color?.trim() ||
  widgetRow.brandColor?.trim() ||
  "#111827";
  }

  const hasBestSeller = Boolean(
    bestSeller.title?.trim() ||
      bestSeller.price?.trim() ||
      bestSeller.image?.trim()
  );

  const visibleProducts = featuredProducts.filter(
    (product) =>
      product.title?.trim() ||
      product.price?.trim() ||
      product.image?.trim()
  );

  const hasProducts = hasBestSeller || visibleProducts.length > 0;

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
      {showProductsNav && hasProducts ? (
        <a href="#products" className="sl-navLink">Products</a>
      ) : null}

      {showContactNav && contactEmail ? (
        <a href="#contact" className="sl-navLink">Contact</a>
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

<div id="products">
  {hasBestSeller ? (
    <section className="sl-bestSeller">
      <div className="sl-sectionTitle">
  {featuredProductType === "newArrivals"
    ? "New Arrivals"
    : "Bestsellers"}
</div>

      <article className="sl-bestCard">
        {bestSeller.image ? (
          <img
            src={bestSeller.image}
            alt={
  bestSeller.title ||
  (featuredProductType === "newArrivals"
    ? "New arrival"
    : "Bestseller")
}
            className="sl-bestImage"
          />
        ) : null}

        <div className="sl-bestMeta">
          <div>
            <div className="sl-bestBadge">
  {featuredProductType === "newArrivals"
    ? "Just arrived"
    : "Customer favorite"}
</div>
            {bestSeller.title ? (
              <div className="sl-bestTitle">{bestSeller.title}</div>
            ) : null}
            {bestSeller.price ? (
              <div className="sl-bestPrice">{bestSeller.price}</div>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  ) : null}

  {visibleProducts.length > 0 ? (
    <section className="sl-products">
      <div className="sl-sectionTitle">In Stock</div>

      <div className="sl-productGrid">
{visibleProducts.slice(0, 9).map((item, idx) => (
  <article key={item.id || idx} className="sl-productCard">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title || "Product"}
                className="sl-productImage"
              />
            ) : null}
            <div className="sl-productMeta">
              {item.title ? (
                <div className="sl-productTitle">{item.title}</div>
              ) : null}
              {item.price ? (
                <div className="sl-productPrice">{item.price}</div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  ) : null}
</div>

        <footer id="footer" className="sl-footer">
          <nav className="sl-footerNav" aria-label="Store information">
            {aboutText ? <a href="#about">About us</a> : null}
            {hasProducts ? <a href="#products">Products</a> : null}
            {contactEmail ? <a href="#contact">Contact</a> : null}
            {shippingNote ? <a href="#shipping">Shipping</a> : null}
            {returnNote ? <a href="#returns">Returns</a> : null}
          </nav>

          <div className="sl-footerDetails">
            {aboutText ? (
              <section id="about" className="sl-footerDetail">
                <h2>About us</h2>
                <p>{aboutText}</p>
              </section>
            ) : null}

            {contactEmail ? (
              <section id="contact" className="sl-footerDetail">
                <h2>Contact</h2>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </section>
            ) : null}

            {shippingNote ? (
              <section id="shipping" className="sl-footerDetail">
                <h2>Shipping</h2>
                <p>{shippingNote}</p>
              </section>
            ) : null}

            {returnNote ? (
              <section id="returns" className="sl-footerDetail">
                <h2>Returns</h2>
                <p>{returnNote}</p>
              </section>
            ) : null}
          </div>

          <a
            className="sl-poweredLine"
            href="https://tikozap.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Powered by TikoZap"
          >
<span>Powered by</span>
<img
  src="/tikozaplogo.svg"
  alt=""
  className="sl-poweredLogo"
  aria-hidden="true"
/>
<strong>TikoZap</strong>
          </a>
        </footer>

    </main>

    <aside className="sl-assistantRail">
      <StarterLinkAssistant
  publicKey={widgetPublicKey}
  assistantName={assistantName}
  assistantIdentity={assistantIdentity}
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
  align-items:flex-start;
  justify-content:flex-start;
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
  padding:24px 18px 28px;
  border-top:1px solid #d6dde6;
  border-radius:14px;
  background:#e2e8f0;
}

        .sl-footerNav{
          display:flex;
          flex-wrap:wrap;
          gap:10px 20px;
        }

        .sl-footerNav a{
          color:#374151;
          font-size:13px;
          font-weight:700;
          text-decoration:none;
        }

        .sl-footerNav a:hover{
          color:#111827;
          text-decoration:underline;
        }

        .sl-footerDetails{
          display:grid;
          gap:18px;
          margin-top:22px;
        }

        .sl-footerDetail{
          scroll-margin-top:24px;
        }

        .sl-footerDetail h2{
          margin:0;
          color:#111827;
          font-size:13px;
          font-weight:800;
        }

        .sl-footerDetail p,
        .sl-footerDetail a{
          margin:6px 0 0;
          color:#6b7280;
          font-size:13px;
          line-height:1.6;
        }

        .sl-footerDetail a{
          display:inline-block;
          text-decoration:none;
        }

        .sl-footerDetail a:hover{
          text-decoration:underline;
        }

        .sl-poweredLine{
          width:max-content;
          display:inline-flex;
          align-items:center;
          gap:6px;
          margin-top:24px;
          color:#9ca3af;
          font-size:12px;
          text-decoration:none;
        }

        .sl-poweredLine strong{
          color:#6b7280;
          font-weight:800;
        }

.sl-poweredLogo{
  width:20px;
  height:20px;
  display:block;
  object-fit:contain;
  flex:0 0 20px;
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

  .sl-footerDetails{
    grid-template-columns:repeat(2, minmax(0, 1fr));
  }

}
      `}</style>
    </div>
  );
}