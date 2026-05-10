// src/app/dashboard/conversations/page.tsx

import './conversations.css';

import { redirect } from 'next/navigation';
import ConversationsClient from './_components/ConversationsClient';
import { getAuthedUserAndTenant } from '@/lib/auth';
import MobilePageHeader from '../_components/MobilePageHeader';

export default async function Page() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) redirect('/login');
  return <ConversationsClient />;
}
