// src/app/l/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import StarterWidgetEmbed from './_components/StarterWidgetEmbed';

export const dynamic = 'force-dynamic';

export default async function StarterLinkPage({ params }: { params: { slug: string } }) {
  const link = await prisma.starterLink.findFirst({
    where: { slug: params.slug, published: true },
    select: {
      id: true,
      tenantId: true,
      slug: true,
      title: true,
      tagline: true,
      greeting: true,
      buttonsJson: true,
    },
  });

  if (!link) {
    return (
      <div style={{ maxWidth: 760, margin: '48px auto', padding: 16 }}>
        <h1>Link not found</h1>
        <p>This TikoZap Link is unavailable or unpublished.</p>
      </div>
    );
  }

  const buttons: Array<{ label: string; url: string }> = link.buttonsJson ? JSON.parse(link.buttonsJson) : [];

  // Pull the tenant widget publicKey (so bubble can connect to Inbox)
  const widget = await prisma.widget.findFirst({
    where: { tenantId: link.tenantId },
    select: { publicKey: true },
  });

  const publicKey = widget?.publicKey || '';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      {/* Auto-embed the real widget bubble and auto-open it */}
      <StarterWidgetEmbed publicKey={publicKey} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 999 }}>
          No Website Needed
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.75 }}>Powered by TikoZap</div>
      </div>

      <header style={{ marginTop: 16 }}>
        <h1 style={{ margin: 0 }}>{link.title ?? 'Store'}</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.85 }}>{link.tagline ?? 'Chat with us anytime.'}</p>

        {buttons.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {buttons.slice(0, 6).map((b) => (
              <a
                key={b.label}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                {b.label}
              </a>
            ))}
          </div>
        )}
      </header>

      <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Chat is available via the bubble (bottom-right).
        </div>
      </div>
    </div>
  );
}
