import './conversations.css';

import { redirect } from 'next/navigation';
import ConversationsClient from './_components/ConversationsClient';
import { getAuthedUserAndTenant } from '@/lib/auth';

export default async function Page() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) redirect('/demo-login');
  return <ConversationsClient />;
}
