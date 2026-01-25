// src/app/l/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import StarterWidgetEmbed from './_components/StarterWidgetEmbed';

function safeButtons(buttonsJson: string | null) {
  try {
    const arr = JSON.parse(buttonsJson || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.label === 'string' && typeof x.url === 'string')
      .slice(0, 6);
  } catch {
    return [];
  }
}

export default async function StarterLinkPage({ params }: { params: { slug: string } }) {
  const link = await prisma.starterLink.findFirst({
    where: { slug: params.slug },
    include: { tenant: { include: { widget: true } } },
  });

  if (!link) {
    return (
      <div style={{ maxWidth: 760, margin: '48px auto', padding: 16 }}>
        <h1>Link not found</h1>
        <p>This TikoZap Link doesn’t exist.</p>
      </div>
    );
  }

  if (!link.published) {
    return (
      <div style={{ maxWidth: 760, margin: '48px auto', padding: 16 }}>
        <h1>Link not published</h1>
        <p>This TikoZap Link is currently a draft.</p>
      </div>
    );
  }

  const buttons = safeButtons(link.buttonsJson);
  const publicKey = link.tenant?.widget?.publicKey || '';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {publicKey ? <StarterWidgetEmbed publicKey={publicKey} /> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 999 }}>
          No Website Needed
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.75 }}>Powered by TikoZap</div>
      </div>

      <header style={{ marginTop: 16 }}>
        <h1 style={{ margin: 0 }}>{link.title ?? link.tenant.storeName}</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.85 }}>{link.tagline ?? 'Chat with us anytime.'}</p>

        {buttons.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {buttons.map((b: any) => (
              <a
                key={b.label}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 12, textDecoration: 'none' }}
              >
                {b.label}
              </a>
            ))}
          </div>
        )}
      </header>

      <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Tip: The chat bubble (bottom-right) is your storefront assistant. It opens automatically on this Link page.
        </div>
      </div>
    </div>
  );
}
