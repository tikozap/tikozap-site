// src/lib/security/requireSameOrigin.ts

import 'server-only';

export function requireSameOrigin(req: Request): boolean {
  const secFetchSite =
    req.headers.get('sec-fetch-site')?.trim().toLowerCase() || '';

  // Modern browsers give us the clearest signal here.
  if (secFetchSite) {
    return (
      secFetchSite === 'same-origin' ||
      secFetchSite === 'same-site' ||
      secFetchSite === 'none'
    );
  }

  const origin = req.headers.get('origin');
  if (!origin) {
    return false;
  }

  const requestUrl = new URL(req.url);

  try {
    const originUrl = new URL(origin);

    return (
      originUrl.protocol === requestUrl.protocol &&
      originUrl.host === requestUrl.host
    );
  } catch {
    return false;
  }
}