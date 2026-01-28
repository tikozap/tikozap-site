// src/lib/security/originAllowlist.ts
const ALWAYS_ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "app.tikozap.com",
  "link.tikozap.com",
  "tikozap.com",
]);

export function normalizeHost(h: string) {
  const s = String(h || "").trim().toLowerCase();
  if (!s) return "";
  return s.startsWith("www.") ? s.slice(4) : s;
}

function hostFromUrlHeader(v: string | null) {
  if (!v) return "";
  try {
    const u = new URL(v);
    return normalizeHost(u.hostname);
  } catch {
    return "";
  }
}

export function getOriginHost(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  return hostFromUrlHeader(origin) || hostFromUrlHeader(referer) || "";
}

export function isHostAllowed(host: string, allowedDomains: string[]) {
  const h = normalizeHost(host);
  if (!h) return false;

  if (ALWAYS_ALLOWED_HOSTS.has(h)) return true;

  for (const raw of allowedDomains || []) {
    const rule = String(raw || "").trim().toLowerCase();
    if (!rule) continue;

    if (rule.startsWith("*.")) {
      const suffix = rule.slice(1); // ".example.com"
      if (h.endsWith(suffix)) return true;
      continue;
    }

    const r = normalizeHost(rule);
    if (h === r) return true;
  }

  return false;
}
