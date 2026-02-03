// src/app/api/widget/settings/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { newWidgetPublicKey, isTzWidgetKey } from "@/lib/widgetKey";

export const runtime = 'nodejs';

const BUILD_MARK = "widget-settings-2026-01-28a";

const Body = z.object({
  enabled: z.boolean().optional().nullable(),
  assistantName: z.string().max(80).optional().nullable(),
  greeting: z.string().max(400).optional().nullable(),
  brandColor: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((v) => !v || /^#?[0-9a-fA-F]{6}$/.test(v), 'brandColor must be a hex like #111111'),

  // ✅ Milestone 7: allowed domains (either list OR textarea text)
  allowedDomains: z.array(z.string().max(200)).optional().nullable(),
  allowedDomainsText: z.string().max(4000).optional().nullable(),
});

function normalizeHex(v: string | null | undefined) {
  if (!v) return null;
  return v.startsWith('#') ? v : `#${v}`;
}

function normalizeDomainToken(raw: string) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';

  // allow wildcard prefix: *.example.com
  const isWildcard = s.startsWith('*.');
  const wildcardPrefix = isWildcard ? '*.' : '';

  if (isWildcard) s = s.slice(2);

  // strip protocol if pasted
  s = s.replace(/^https?:\/\//, '');

  // remove path/query/hash
  s = s.split('/')[0].split('?')[0].split('#')[0];

  // strip port
  s = s.split(':')[0];

  // normalize www
  if (s.startsWith('www.')) s = s.slice(4);

  // very light validation (hostname-ish)
  if (!s || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return '';

  return wildcardPrefix + s;
}

function parseDomainsText(text: string) {
  const parts = String(text || '')
    .split(/[\n,]/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();

  for (const p of parts) {
    const v = normalizeDomainToken(p);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizeDomainsInput(
  allowedDomains?: string[] | null,
  allowedDomainsText?: string | null
) {
  if (typeof allowedDomainsText === 'string' && allowedDomainsText.trim()) {
    return parseDomainsText(allowedDomainsText);
  }

  const list = Array.isArray(allowedDomains) ? allowedDomains : [];
  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    const v = normalizeDomainToken(item);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

const selectWidget = {
  tenantId: true,
  publicKey: true,
  installedAt: true,
  enabled: true,
  assistantName: true,
  greeting: true,
  brandColor: true,
  allowedDomains: true,
} as const;

export async function GET() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authed.tenant.id;

  let widget = await prisma.widget.findUnique({
    where: { tenantId },
    select: selectWidget,
  });

   if (!widget) {
widget = await prisma.widget.create({
  data: { tenantId, publicKey: newWidgetPublicKey() },
  select: selectWidget,
});
  } else if (!isTzWidgetKey(widget.publicKey)) {
    widget = await prisma.widget.update({
      where: { tenantId },
      data: { publicKey: newWidgetPublicKey() },
      select: selectWidget,
    });
  }

  return NextResponse.json({ ok: true, widget });
}

export async function POST(req: Request) {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authed.tenant.id;

  const raw = await req.json().catch(() => ({}));
  const body = Body.parse(raw);

  const has = (k: string) => Object.prototype.hasOwnProperty.call(raw, k);

  // enabled is special: only accept boolean; ignore null
  const enabledVal = typeof body.enabled === 'boolean' ? body.enabled : undefined;

  const shouldUpdateDomains = has('allowedDomains') || has('allowedDomainsText');
  const domainsVal = shouldUpdateDomains
    ? normalizeDomainsInput(body.allowedDomains ?? null, body.allowedDomainsText ?? null)
    : undefined;

  const widget = await prisma.widget.upsert({
    where: { tenantId },
    create: {
      tenantId, publicKey: newWidgetPublicKey(),
      enabled: enabledVal ?? true,
      assistantName: has('assistantName') ? body.assistantName ?? null : null,
      greeting: has('greeting') ? body.greeting ?? null : null,
      brandColor: has('brandColor') ? normalizeHex(body.brandColor ?? null) : null,
      allowedDomains: domainsVal ?? [],
    },
    update: {
      ...(has('enabled') && enabledVal !== undefined ? { enabled: enabledVal } : {}),
      ...(has('assistantName') ? { assistantName: body.assistantName ?? null } : {}),
      ...(has('greeting') ? { greeting: body.greeting ?? null } : {}),
      ...(has('brandColor') ? { brandColor: normalizeHex(body.brandColor ?? null) } : {}),
      ...(shouldUpdateDomains && domainsVal !== undefined ? { allowedDomains: domainsVal } : {}),
    },
    select: selectWidget,
  });

return NextResponse.json({ ok: true, widget, build: BUILD_MARK });
}
