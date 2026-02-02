// src/lib/session.ts
import 'server-only';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'tz_session';

export async function createSession(userId: string) {
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function clearSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}
