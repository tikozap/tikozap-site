import 'server-only';

import { prisma } from '@/lib/prisma';

export type RolloutTemplateItem = {
  key: string;
  title: string;
  description: string;
};

export const DESIGN_PARTNER_ROLLOUT_TEMPLATE: RolloutTemplateItem[] = [
  {
    key: 'kickoff_alignment',
    title: 'Kickoff alignment call',
    description: 'Confirm support scope, channels, and ownership with the design partner.',
  },
  {
    key: 'knowledge_and_policy_setup',
    title: 'Knowledge + policy setup',
    description: 'Upload/store policies, FAQs, and top issue intents in Knowledge.',
  },
  {
    key: 'starter_link_or_widget_live',
    title: 'Starter Link/widget live',
    description: 'Publish Starter Link or website widget and verify customer entry path.',
  },
  {
    key: 'handoff_playbook_ready',
    title: 'Handoff playbook ready',
    description: 'Define when AI escalates and who owns manual takeover SLAs.',
  },
  {
    key: 'metrics_baseline_defined',
    title: 'Metrics baseline defined',
    description: 'Capture baseline response time, escalation rate, and resolution quality.',
  },
  {
    key: 'case_study_signal_collected',
    title: 'Case-study signal collected',
    description: 'Collect measurable wins and partner quotes for case-study readiness.',
  },
];

export type DesignPartnerRolloutItem = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  done: boolean;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

export type DesignPartnerRolloutStatus = {
  items: DesignPartnerRolloutItem[];
  completedCount: number;
  totalCount: number;
  completionPct: number;
};

function toStatus(
  rows: Array<{
    id: string;
    key: string;
    title: string;
    description: string | null;
    done: boolean;
    owner: string | null;
    notes: string | null;
    updatedAt: Date;
  }>,
): DesignPartnerRolloutStatus {
  const items: DesignPartnerRolloutItem[] = rows.map((row) => ({
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
    done: row.done,
    owner: row.owner,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  }));

  const completedCount = items.filter((item) => item.done).length;
  const totalCount = items.length;
  const completionPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    items,
    completedCount,
    totalCount,
    completionPct,
  };
}

export async function getDesignPartnerRolloutStatus(
  tenantId: string,
): Promise<DesignPartnerRolloutStatus> {
  const existing = await prisma.designPartnerRolloutItem.findMany({
    where: { tenantId },
    select: {
      key: true,
    },
  });

  const existingKeys = new Set(existing.map((row) => row.key));
  const missing = DESIGN_PARTNER_ROLLOUT_TEMPLATE.filter((item) => !existingKeys.has(item.key));

  if (missing.length > 0) {
    await prisma.designPartnerRolloutItem.createMany({
      data: missing.map((item) => ({
        tenantId,
        key: item.key,
        title: item.title,
        description: item.description,
      })),
    });
  }

  const order = DESIGN_PARTNER_ROLLOUT_TEMPLATE.map((item) => item.key);
  const rows = await prisma.designPartnerRolloutItem.findMany({
    where: { tenantId },
    select: {
      id: true,
      key: true,
      title: true,
      description: true,
      done: true,
      owner: true,
      notes: true,
      updatedAt: true,
    },
  });

  rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return toStatus(rows);
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function updateDesignPartnerRolloutItem(args: {
  tenantId: string;
  itemId: string;
  done?: boolean;
  owner?: string | null;
  notes?: string | null;
}): Promise<DesignPartnerRolloutStatus> {
  const data: {
    done?: boolean;
    owner?: string | null;
    notes?: string | null;
  } = {};
  if (typeof args.done === 'boolean') data.done = args.done;
  if (args.owner !== undefined) data.owner = cleanText(args.owner, 80);
  if (args.notes !== undefined) data.notes = cleanText(args.notes, 500);

  await prisma.designPartnerRolloutItem.updateMany({
    where: {
      id: args.itemId,
      tenantId: args.tenantId,
    },
    data,
  });

  return getDesignPartnerRolloutStatus(args.tenantId);
}
