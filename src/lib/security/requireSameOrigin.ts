// src/lib/security/requireSameOrigin.ts

import 'server-only';

function isLocalDevHost(hostname: string) {
  const host = hostname.trim().toLowerCase();

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1'
  ) {
    return true;
  }

  if (host.startsWith('192.168.')) {
    return true;
  }

  if (host.startsWith('10.')) {
    return true;
  }

  const match = host.match(/^172\.(\d+)\./);

  if (match) {
    const second = Number(match[1]);

    if (second >= 16 && second <= 31) {
      return true;
    }
  }

  return false;
}

export function requireSameOrigin(req: Request): boolean {
  const secFetchSite =
    req.headers.get('sec-fetch-site')?.trim().toLowerCase() || '';

  // Modern browsers give us the clearest signal.
  if (
    secFetchSite === 'same-origin' ||
    secFetchSite === 'same-site' ||
    secFetchSite === 'none'
  ) {
    return true;
  }

  const origin = req.headers.get('origin');

  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(req.url);

    if (
      originUrl.protocol === requestUrl.protocol &&
      originUrl.host === requestUrl.host
    ) {
      return true;
    }

    // Local-device testing only.
    // Never permit this exception in production.
    if (process.env.NODE_ENV !== 'production') {
      const forwardedHost =
        req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || '';

      const requestHostname = forwardedHost
        ? forwardedHost.split(':')[0]
        : requestUrl.hostname;

      if (
        isLocalDevHost(originUrl.hostname) &&
        isLocalDevHost(requestHostname)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}