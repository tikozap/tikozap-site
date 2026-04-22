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
    where: {
      starterLinkEnabled: true,
      OR: [{ starterLinkSlug: slug }, { slug }],
    },
    select: {
      id: true,
      slug: true,
      storeName: true,
      widget: {
        select: {
          publicKey: true,
          installedAt: true,
          assistantName: true,
          brandColor: true,
        },
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

  let storeName = "Demo Boutique";
  let tagline = "Shop smarter with AI assistance.";
  let subheading = "Featured products and instant answers in one simple link.";
  let assistantName = `${storeName} Assistant`;
  let footerLine = `${storeName} powered by TikoZap`;
  let widgetPublicKey = "tz_demo_demo";
  let brandColor = "#111827";

  const storeLogoUrl = "";
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
          },
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
    assistantName =
      widgetRow.assistantName?.trim() || `${storeName} Assistant`;
    footerLine = `${storeName} powered by TikoZap`;
    brandColor = widgetRow.brandColor?.trim() || "#111827";
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
      <a href="#products" className="sl-navLink">Products</a>
      <a href="#footer" className="sl-navLink">Contact</a>
      {showMerchantLogin ? (
        <a href="/login" className="sl-navLink">Log in</a>
      ) : null}
    </nav>

    <button type="button" className="sl-menuBtn" aria-label="Menu">
      ☰
    </button>
  </div>
</header>
        <section className="sl-hero">
          <h1 className="sl-title">{storeName}</h1>
          <p className="sl-tagline">{tagline}</p>
          <p className="sl-subheading">{subheading}</p>

          <div className="sl-ctaRow">
            <a href="#products" className="sl-cta sl-ctaPrimary">
              Browse products
            </a>
            <button type="button" className="sl-cta sl-ctaSecondary">
              Ask assistant
            </button>
          </div>
        </section>

        <section className="sl-assistantCard">
          <div className="sl-assistantName">{assistantName}</div>
          <p className="sl-assistantCopy">
            Hi! I can help with products, order tracking, shipping, and returns.
          </p>

          <div className="sl-prompts">
            {DEMO_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="sl-promptBtn">
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="sl-trust">
          {TRUST_PILLS.map((item) => (
            <div key={item} className="sl-trustItem">
              {item}
            </div>
          ))}
        </section>

        <section id="products" className="sl-products">
          <div className="sl-sectionTitle">Featured products</div>

          <div className="sl-productGrid">
            {DEMO_FEATURED.map((item) => (
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
          <div className="sl-footerLine">{footerLine}</div>
        </footer>
      </div>

<StarterLinkAssistant
  publicKey={widgetPublicKey}
  assistantName={assistantName}
  premium={false}
  brandColor={brandColor}
/>

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
  font-size:14px;
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

        @media (min-width: 900px){
          .sl-shell{
            padding:24px;
          }

  .sl-desktopNav{
    display:flex;
  }

  .sl-menuBtn{
    display:none;
  }

          .sl-title{
            font-size:44px;
          }

          .sl-tagline{
            font-size:20px;
          }

          .sl-subheading{
            font-size:15px;
          }

          .sl-productGrid{
            grid-template-columns:repeat(3, minmax(0, 1fr));
  }
}
      `}</style>
    </div>
  );
}