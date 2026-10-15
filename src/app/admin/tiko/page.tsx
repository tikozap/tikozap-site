// src/app/admin/tiko/page.tsx

import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin';
import { getUserId } from '@/lib/auth';
import TikoAdminClient from './TikoAdminClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminTikoPage() {
  const userId = await getUserId();

  if (!userId) {
    redirect('/login');
  }

  const admin = await requireAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  return <TikoAdminClient />;
}