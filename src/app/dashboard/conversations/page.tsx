// src/app/dashboard/conversations/page.tsx
import './conversations.css';

import AutoRefresh from './_components/AutoRefresh';
import ConversationsClient from './_components/ConversationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <>
     <AutoRefresh intervalMs={8000} />
      <ConversationsClient />
    </>
  );
}
