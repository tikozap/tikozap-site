import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import {
  CASE_STUDY_WINDOW_MS,
  caseStudyMetricsToCsv,
  getCaseStudyMetrics,
  type CaseStudyWindowKey,
} from '@/lib/caseStudyMetrics';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const rawWindow = url.searchParams.get('window') || '30d';
  const windowKey: CaseStudyWindowKey =
    rawWindow in CASE_STUDY_WINDOW_MS ? (rawWindow as CaseStudyWindowKey) : '30d';
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  const metrics = await getCaseStudyMetrics({
    tenantId: auth.tenant.id,
    window: windowKey,
  });

  if (format === 'csv') {
    const csv = caseStudyMetricsToCsv(metrics);
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="tikozap-case-study-${windowKey}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }

  return NextResponse.json({
    ok: true,
    window: windowKey,
    metrics,
  });
}
