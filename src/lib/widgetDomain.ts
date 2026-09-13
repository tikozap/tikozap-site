// src/lib/widgetDomain.ts

function normalizeHost(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "");
}

export function extractRequestHost(req: Request) {
  const origin =
    req.headers.get("origin") ||
    req.headers.get("referer") ||
    "";

  if (!origin) return "";

  try {
    return normalizeHost(new URL(origin).hostname);
  } catch {
    return normalizeHost(origin);
  }
}

export function isAllowedDomain(
  requestHost: string,
  allowedDomains: string[]
) {
  const host = normalizeHost(requestHost);

  // allow localhost/dev automatically
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost")
  ) {
    return true;
  }

  const list = Array.isArray(allowedDomains)
    ? allowedDomains
    : [];

  // no restriction configured yet
  if (list.length === 0) {
    return true;
  }

  for (const raw of list) {
    const domain = normalizeHost(raw);

    if (!domain) continue;

    // exact
    if (host === domain) return true;

    // subdomain
    if (host.endsWith("." + domain)) return true;
  }

  return false;
}