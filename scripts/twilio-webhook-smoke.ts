import crypto from 'node:crypto';

type VerifyMode = 'secret' | 'signature' | 'none';

type WebhookRequest = {
  name: string;
  url: string;
  contentType: 'application/json' | 'application/x-www-form-urlencoded';
  bodyRaw: string;
  formForSigning?: URLSearchParams;
};

type EnvConfig = {
  baseUrl: string;
  tenantSlug: string;
  verifyMode: VerifyMode;
  secret: string;
  authToken: string;
  authCookie: string;
  dryRun: boolean;
};

function randomSid(prefix: string): string {
  return `${prefix}${crypto.randomBytes(16).toString('hex')}`;
}

function hmacSha1Base64(secret: string, data: string): string {
  return crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
}

function signatureForForm(
  authToken: string,
  url: string,
  form: URLSearchParams,
): string {
  const entries = Array.from(form.entries()).sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  let data = url;
  for (const [key, value] of entries) {
    data += key + value;
  }
  return hmacSha1Base64(authToken, data);
}

function signatureForBody(authToken: string, url: string, rawBody: string): string {
  return hmacSha1Base64(authToken, url + rawBody);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseVerifyMode(raw: string): VerifyMode {
  const lowered = (raw || '').trim().toLowerCase();
  if (lowered === 'secret') return 'secret';
  if (lowered === 'signature') return 'signature';
  if (lowered === 'none') return 'none';
  return 'none';
}

function resolveVerifyMode(rawMode: string, secret: string, authToken: string): VerifyMode {
  const lowered = (rawMode || '').trim().toLowerCase();
  if (lowered && lowered !== 'auto') {
    const parsed = parseVerifyMode(lowered);
    if (parsed === 'secret' && !secret) {
      throw new Error(
        'TWILIO_SMOKE_VERIFY_MODE=secret requires TWILIO_WEBHOOK_SECRET (or TWILIO_SMOKE_WEBHOOK_SECRET).',
      );
    }
    if (parsed === 'signature' && !authToken) {
      throw new Error(
        'TWILIO_SMOKE_VERIFY_MODE=signature requires TWILIO_AUTH_TOKEN (or TWILIO_SMOKE_AUTH_TOKEN).',
      );
    }
    return parsed;
  }

  if (secret) return 'secret';
  if (authToken) return 'signature';
  return 'none';
}

function getConfig(): EnvConfig {
  const baseUrl = trimTrailingSlash(
    process.env.TWILIO_SMOKE_BASE_URL || 'http://localhost:3000',
  );
  const tenantSlug = process.env.TWILIO_SMOKE_TENANT_SLUG || 'demo-store';
  const secret =
    process.env.TWILIO_WEBHOOK_SECRET || process.env.TWILIO_SMOKE_WEBHOOK_SECRET || '';
  const authToken =
    process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_SMOKE_AUTH_TOKEN || '';
  const authCookie = process.env.TWILIO_SMOKE_AUTH_COOKIE || '';
  const verifyMode = resolveVerifyMode(
    process.env.TWILIO_SMOKE_VERIFY_MODE || 'auto',
    secret,
    authToken,
  );
  const dryRun = process.argv.includes('--dry-run');

  return {
    baseUrl,
    tenantSlug,
    verifyMode,
    secret,
    authToken,
    authCookie,
    dryRun,
  };
}

function webhookHeaders(
  req: WebhookRequest,
  cfg: EnvConfig,
): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': req.contentType,
    'user-agent': 'tikozap-twilio-smoke/1.0',
  };

  if (cfg.verifyMode === 'secret') {
    headers['x-tikozap-webhook-secret'] = cfg.secret;
    return headers;
  }

  if (cfg.verifyMode === 'signature') {
    const signature =
      req.formForSigning != null
        ? signatureForForm(cfg.authToken, req.url, req.formForSigning)
        : signatureForBody(cfg.authToken, req.url, req.bodyRaw);
    headers['x-twilio-signature'] = signature;
  }

  return headers;
}

async function requestJson(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} for ${url}\n${JSON.stringify(data)}`,
    );
  }
  return data;
}

async function sendWebhook(req: WebhookRequest, cfg: EnvConfig): Promise<any> {
  const headers = webhookHeaders(req, cfg);
  return requestJson(req.url, {
    method: 'POST',
    headers,
    body: req.bodyRaw,
  });
}

async function run() {
  const cfg = getConfig();
  const callSid = randomSid('CA');
  const accountSid = randomSid('AC');
  const streamSid = randomSid('MZ');
  const endpoint = `${cfg.baseUrl}/api/webhooks/twilio/voice?tenantSlug=${encodeURIComponent(
    cfg.tenantSlug,
  )}`;

  const jsonPayload = {
    event_type: 'voice-insights.gateway-call-metrics',
    call_sid: callSid,
    account_sid: accountSid,
    stream_sid: streamSid,
    metrics: {
      mos: 4.21,
      jitter_ms: 12.5,
      packet_loss_pct: 0.31,
      round_trip_ms: 168,
    },
    custom: {
      tenantSlug: cfg.tenantSlug,
      source: 'twilio-smoke-json',
    },
  };

  const formPayload = new URLSearchParams({
    EventType: 'voice.insights.edge.summary',
    CallSid: callSid,
    AccountSid: accountSid,
    StreamSid: streamSid,
    Mos: '3.62',
    JitterMs: '34',
    PacketLossPct: '1.90',
    RoundTripMs: '284',
    TenantSlug: cfg.tenantSlug,
  });

  const requests: WebhookRequest[] = [
    {
      name: 'JSON voice metrics',
      url: endpoint,
      contentType: 'application/json',
      bodyRaw: JSON.stringify(jsonPayload),
    },
    {
      name: 'Form voice metrics',
      url: endpoint,
      contentType: 'application/x-www-form-urlencoded',
      bodyRaw: formPayload.toString(),
      formForSigning: formPayload,
    },
  ];

  console.log('Twilio webhook smoke test');
  console.log('-------------------------');
  console.log(`Base URL: ${cfg.baseUrl}`);
  console.log(`Tenant slug: ${cfg.tenantSlug}`);
  console.log(`Verify mode: ${cfg.verifyMode}`);
  console.log(`Call SID: ${callSid}`);

  if (cfg.dryRun) {
    console.log('\nDry run enabled. Would send:');
    for (const req of requests) {
      console.log(`- ${req.name} -> ${req.url} (${req.contentType})`);
    }
    return;
  }

  for (const req of requests) {
    const out = await sendWebhook(req, cfg);
    console.log(`\n${req.name}:`);
    console.log(
      `  ok=${out?.ok === true} eventType=${out?.eventType || 'n/a'} verification=${out?.verification || 'n/a'}`,
    );
    console.log(
      `  metrics mos=${out?.metrics?.mos ?? 'n/a'} jitterMs=${out?.metrics?.jitterMs ?? 'n/a'} packetLossPct=${out?.metrics?.packetLossPct ?? 'n/a'} roundTripMs=${out?.metrics?.roundTripMs ?? 'n/a'}`,
    );
  }

  const twoLayer = await requestJson(`${cfg.baseUrl}/api/quality/two-layer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      callSid,
      transport: {
        firstTokenMs: 620,
        totalResponseMs: 1350,
        usedSse: true,
        fallbackUsed: false,
      },
      conversation: {
        source: 'model',
        userTurns: 3,
        signals: {
          mentionsStarterLink: true,
          mentionsHandoff: true,
          mentionsSafePreview: true,
          mentionsSetupPath: true,
        },
      },
    }),
  });

  console.log('\nTwo-layer linkage:');
  console.log(
    `  twilioLinked=${twoLayer?.twilioLinked === true} overall=${twoLayer?.report?.scores?.overall ?? 'n/a'} grade=${twoLayer?.report?.grade ?? 'n/a'}`,
  );

  if (cfg.authCookie) {
    const summary = await requestJson(
      `${cfg.baseUrl}/api/quality/twilio/summary?window=24h&callSid=${encodeURIComponent(
        callSid,
      )}`,
      {
        method: 'GET',
        headers: {
          cookie: cfg.authCookie,
        },
      },
    );
    console.log('\nTwilio summary (authed):');
    console.log(
      `  totalEvents=${summary?.summary?.totalEvents ?? 'n/a'} grade=${summary?.summary?.health?.grade ?? 'n/a'} score=${summary?.summary?.health?.score ?? 'n/a'}`,
    );
  } else {
    console.log(
      '\nSkipped /api/quality/twilio/summary check (set TWILIO_SMOKE_AUTH_COOKIE to test authed summary).',
    );
  }

  console.log('\nSmoke test completed.');
}

run().catch((err) => {
  console.error('Twilio webhook smoke test failed:', err);
  process.exit(1);
});
