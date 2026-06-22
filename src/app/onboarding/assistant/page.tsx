// src/app/onboarding/assistant/page.tsx

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import AssistantStepClient from './AssistantStepClient';

export default async function AssistantStep() {
  const auth = await getAuthedUserAndTenant();
  if (!auth?.tenant?.id) redirect('/login');

  const widget = await prisma.widget.findUnique({
    where: { tenantId: auth.tenant.id },
    select: {
      assistantName: true,
      greeting: true,
    },
  });

  const storeInfoDoc = await prisma.knowledgeDoc.findFirst({
    where: {
      tenantId: auth.tenant.id,
      title: 'Store info',
    },
    select: {
      content: true,
    },
  });

  return (
    <AssistantStepClient
      initialAssistantName={widget?.assistantName || 'Store Assistant'}
      initialGreeting={
        widget?.greeting ||
        "Hi! I’m here to help with products, orders, shipping, and returns."
      }
      initialStoreInfo={storeInfoDoc?.content || ''}
    />
  );
}