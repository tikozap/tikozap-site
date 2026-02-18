import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type DemoReplySource = 'rule' | 'model' | 'canned';

type DemoReplyMeta = {
  scoreDelta: {
    accuracy: number;
    safety: number;
    handoff: number;
    setupFit: number;
  };
  signals: {
    mentionsStarterLink: boolean;
    mentionsHandoff: boolean;
    mentionsSafePreview: boolean;
    mentionsSetupPath: boolean;
  };
  rationale: {
    accuracy: string;
    safety: string;
    handoff: string;
    setupFit: string;
  };
};

function frame(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function sanitizeSource(value: unknown): DemoReplySource {
  if (value === 'model' || value === 'rule' || value === 'canned') return value;
  return 'canned';
}

function sanitizeMeta(value: unknown): DemoReplyMeta {
  const fallback: DemoReplyMeta = {
    scoreDelta: { accuracy: 5, safety: 5, handoff: 3, setupFit: 4 },
    signals: {
      mentionsStarterLink: false,
      mentionsHandoff: false,
      mentionsSafePreview: true,
      mentionsSetupPath: false,
    },
    rationale: {
      accuracy: 'Using safe preview fallback.',
      safety: 'Safe preview mode is always enabled in demo.',
      handoff: 'Ask about escalation to see explicit handoff behavior.',
      setupFit: 'Ask about setup to see a stronger setup-fit score.',
    },
  };

  if (!value || typeof value !== 'object') return fallback;
  const v = value as Record<string, any>;
  return {
    scoreDelta: {
      accuracy: typeof v.scoreDelta?.accuracy === 'number' ? v.scoreDelta.accuracy : fallback.scoreDelta.accuracy,
      safety: typeof v.scoreDelta?.safety === 'number' ? v.scoreDelta.safety : fallback.scoreDelta.safety,
      handoff: typeof v.scoreDelta?.handoff === 'number' ? v.scoreDelta.handoff : fallback.scoreDelta.handoff,
      setupFit: typeof v.scoreDelta?.setupFit === 'number' ? v.scoreDelta.setupFit : fallback.scoreDelta.setupFit,
    },
    signals: {
      mentionsStarterLink: v.signals?.mentionsStarterLink === true,
      mentionsHandoff: v.signals?.mentionsHandoff === true,
      mentionsSafePreview: v.signals?.mentionsSafePreview !== false,
      mentionsSetupPath: v.signals?.mentionsSetupPath === true,
    },
    rationale:
      v.rationale && typeof v.rationale === 'object'
        ? {
            accuracy:
              typeof v.rationale.accuracy === 'string'
                ? v.rationale.accuracy
                : fallback.rationale.accuracy,
            safety:
              typeof v.rationale.safety === 'string'
                ? v.rationale.safety
                : fallback.rationale.safety,
            handoff:
              typeof v.rationale.handoff === 'string'
                ? v.rationale.handoff
                : fallback.rationale.handoff,
            setupFit:
              typeof v.rationale.setupFit === 'string'
                ? v.rationale.setupFit
                : fallback.rationale.setupFit,
          }
        : fallback.rationale,
  };
}

function passthroughHeaders(req: Request): Headers {
  const headers = new Headers();
  headers.set('content-type', 'application/json');

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  const realIp = req.headers.get('x-real-ip');
  if (realIp) headers.set('x-real-ip', realIp);
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) headers.set('cf-connecting-ip', cfIp);
  const userAgent = req.headers.get('user-agent');
  if (userAgent) headers.set('user-agent', userAgent);

  return headers;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const startedAt = Date.now();
  const upstreamUrl = new URL('/api/demo-assistant', req.url);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      headers: passthroughHeaders(req),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error calling /api/demo-assistant from stream endpoint', error);
    return NextResponse.json(
      { ok: false, error: 'Could not start streaming response.' },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  }

  const payload: any = await upstream.json().catch(() => ({}));
  const reply = typeof payload.reply === 'string' ? payload.reply : '';
  const source = sanitizeSource(payload.source);
  const safePreview = payload.safePreview !== false;
  const meta = sanitizeMeta(payload.meta);

  let cancelled = false;
  const encoder = new TextEncoder();
  const tokens = reply.split(/(\s+)/).filter(Boolean);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, eventPayload: unknown) => {
        if (cancelled) return;
        controller.enqueue(encoder.encode(frame(event, eventPayload)));
      };

      send('meta', { source, safePreview, meta });

      let idx = 0;
      const pump = () => {
        if (cancelled) return;

        if (idx >= tokens.length) {
          send('done', {
            reply,
            source,
            safePreview,
            meta,
            serverMs: Date.now() - startedAt,
          });
          controller.close();
          return;
        }

        send('delta', { chunk: tokens[idx] });
        idx += 1;
        setTimeout(pump, idx < 12 ? 18 : 10);
      };

      pump();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
