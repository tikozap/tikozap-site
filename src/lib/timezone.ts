// src/lib/timezone.ts
export const DEFAULT_TZ = 'America/New_York';

export function cleanTz(tz: unknown) {
  const t = String(tz || '').trim();
  return t || DEFAULT_TZ;
}

export function formatNowInTz(tzInput?: unknown) {
  const tz = cleanTz(tzInput);
  const now = new Date();

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
    timeZoneName: 'short',
  }).format(now);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
    timeZoneName: 'short',
  }).format(now);

  const monthStr = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: tz,
    timeZoneName: 'short',
  }).format(now);

  const yearStr = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    timeZone: tz,
    timeZoneName: 'short',
  }).format(now);

  return { tz, dateStr, timeStr, monthStr, yearStr };
}
