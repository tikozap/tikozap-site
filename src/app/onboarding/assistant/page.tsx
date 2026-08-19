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
    tenant: {
      select: {
        settingsJson: true,
      },
    },
  },
});

let settings: Record<string, string> = {};

try {
  settings = widget?.tenant?.settingsJson
    ? JSON.parse(widget.tenant.settingsJson)
    : {};
} catch {
  settings = {};
}

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
      initialAssistantName={
  settings.tz_assistant_name?.trim() ||
  widget?.assistantName?.trim() ||
  'Assistant'
}
initialGreeting={
  settings.tz_assistant_greeting?.trim() ||
  widget?.greeting?.trim() ||
  "Hi! I’m here to help with products, orders, shipping, and returns."
}
      initialStoreInfo={storeInfoDoc?.content || ''}
    />
  );
}