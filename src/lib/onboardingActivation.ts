import 'server-only';

import { prisma } from '@/lib/prisma';

export const ACTIVATION_EVENTS = {
  savedStarterLink: 'activation_saved_starter_link',
  copiedStarterLink: 'activation_copied_starter_link',
  copiedBioTemplate: 'activation_copied_bio_template',
  copiedMarketplaceDmTemplate: 'activation_copied_marketplace_dm_template',
  openedQrTemplate: 'activation_opened_qr_template',
  openedStarterLink: 'activation_opened_starter_link',
  confirmedInstallOrShare: 'activation_confirmed_install_or_share',
  sentFirstTestMessage: 'activation_sent_test_message',
} as const;

export const ALLOWED_ACTIVATION_EVENTS = new Set<string>(Object.values(ACTIVATION_EVENTS));

type ChecklistRule = {
  id: string;
  label: string;
  anyOf: string[];
};

const CHECKLIST_RULES: ChecklistRule[] = [
  {
    id: 'save_starter_link',
    label: 'Save Starter Link settings',
    anyOf: [ACTIVATION_EVENTS.savedStarterLink],
  },
  {
    id: 'copy_share_template',
    label: 'Copy Starter Link or a channel template',
    anyOf: [
      ACTIVATION_EVENTS.copiedStarterLink,
      ACTIVATION_EVENTS.copiedBioTemplate,
      ACTIVATION_EVENTS.copiedMarketplaceDmTemplate,
      ACTIVATION_EVENTS.openedQrTemplate,
    ],
  },
  {
    id: 'open_starter_link',
    label: 'Open your Starter Link preview',
    anyOf: [ACTIVATION_EVENTS.openedStarterLink],
  },
  {
    id: 'confirm_install_or_share',
    label: 'Confirm install/share is complete',
    anyOf: [ACTIVATION_EVENTS.confirmedInstallOrShare],
  },
  {
    id: 'send_test_message',
    label: 'Send first test message in onboarding',
    anyOf: [ACTIVATION_EVENTS.sentFirstTestMessage],
  },
];

export type ActivationChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ActivationStatus = {
  trackedEvents: string[];
  checklist: ActivationChecklistItem[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
  isComplete: boolean;
};

function buildStatus(events: Set<string>): ActivationStatus {
  const checklist = CHECKLIST_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    done: rule.anyOf.some((event) => events.has(event)),
  }));
  const completedCount = checklist.filter((item) => item.done).length;
  const totalCount = checklist.length;
  const completionPct = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  return {
    trackedEvents: Array.from(events),
    checklist,
    completedCount,
    totalCount,
    completionPct,
    isComplete: completedCount >= totalCount,
  };
}

export function emptyActivationStatus(): ActivationStatus {
  return buildStatus(new Set<string>());
}

export async function getActivationStatus(tenantId: string): Promise<ActivationStatus> {
  const rows = await prisma.metricEvent.findMany({
    where: {
      tenantId,
      source: 'onboarding',
      event: { in: Array.from(ALLOWED_ACTIVATION_EVENTS) },
    },
    select: {
      event: true,
    },
  });

  const events = new Set(rows.map((row) => row.event));
  return buildStatus(events);
}
