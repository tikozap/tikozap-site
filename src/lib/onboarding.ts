import 'server-only';
import { prisma } from '@/lib/prisma';

export async function onboardingRedirectPath(tenantId: string) {
  // Demo tenant is not a real DB row → don’t gate it
  if (!tenantId || tenantId === 'demo-tenant') return null;

  const [knowledgeCount, widget] = await Promise.all([
    prisma.knowledgeDoc.count({ where: { tenantId } }),
    prisma.widget.findUnique({
      where: { tenantId },
      select: {
        assistantName: true,
        greeting: true,
        brandColor: true,
        installedAt: true,
      },
    }),
  ]);

  // If you want "store" to be required first, we need a DB field that
  // /onboarding/store sets (e.g. tenant.websiteUrl or tenant.onboardingStep).
  // For now we gate the steps we can detect:

  if (knowledgeCount === 0) return '/onboarding/knowledge';

  if (!widget?.assistantName || !widget?.greeting || !widget?.brandColor) {
    return '/onboarding/widget';
  }

  if (!widget?.installedAt) return '/onboarding/install';

  return null; // onboarding complete
}
