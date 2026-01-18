import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Stored format: s2:<saltHex>:<hashHex>
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `s2:${salt.toString('hex')}:${derived.toString('hex')}`;
}

/**
 * verifyPassword(password, hash)  ✅
 * (also tolerates verifyPassword(hash, password))
 */
export function verifyPassword(a: string, b: string): boolean {
  let password = a;
  let stored = b;

  if (a.startsWith('s2:') && !b.startsWith('s2:')) {
    stored = a;
    password = b;
  }

  try {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;

    const [, saltHex, hashHex] = parts;
    if (!saltHex || !hashHex) return false;

    const expected = Buffer.from(hashHex, 'hex');

    // ✅ preferred (new/correct): salt bytes from hex
    const saltBytes = Buffer.from(saltHex, 'hex');
    const actual1 = scryptSync(password, saltBytes, expected.length);
    if (timingSafeEqual(actual1, expected)) return true;

    // ✅ legacy fallback (your old signup): salt treated as UTF-8 string
    const actual2 = scryptSync(password, saltHex, expected.length);
    return timingSafeEqual(actual2, expected);
  } catch {
    return false;
  }
}

