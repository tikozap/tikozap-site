# TikoZap Frontend Starter (v0.2)
Next.js + TypeScript + Tailwind with a clean marketing homepage.

## Run
npm install
npm run dev
# open http://localhost:3000

## Verify
npm run check

## Evaluate assistant quality
npm run eval:support

## Demo quality APIs
- `POST /api/demo-assistant/stream` (SSE streaming mode)
- `POST /api/quality/two-layer` (transport + conversation score)
- `POST /api/webhooks/twilio/voice` (Twilio voice webhook ingestor)
- `GET /api/quality/twilio/summary?window=24h|7d|30d` (authed dashboard summary)
- `GET /api/billing/usage` (authed monthly plan usage)
- `POST /api/billing/plan` with `{ "plan": "starter" | "pro" | "business" }`
- `GET/POST /api/design-partner/rollout` (tenant rollout checklist workflow)

## Twilio webhook setup (voice quality)
Set one of these verification options:
- `TWILIO_WEBHOOK_SECRET` (recommended quick setup; send via `x-tikozap-webhook-secret`)
- `TWILIO_AUTH_TOKEN` (validates `X-Twilio-Signature`)

Then point Twilio webhook to:
- `https://<your-domain>/api/webhooks/twilio/voice?tenantSlug=<your-tenant-slug>`

## Twilio webhook smoke test
Run a quick end-to-end ingest test (sends JSON + form payloads):

```bash
TWILIO_SMOKE_BASE_URL=http://localhost:3000 \
TWILIO_SMOKE_TENANT_SLUG=demo-store \
TWILIO_WEBHOOK_SECRET=your-secret \
npm run smoke:twilio:webhook
```

Dry run (prints what would be sent, no network requests):

```bash
npm run smoke:twilio:webhook:dry
```

Optional: verify authed summary endpoint in same script by setting:
- `TWILIO_SMOKE_AUTH_COOKIE="tz_session=...; tz_tenant=..."`

## Execution roadmap
See `EXECUTION_PLAN.md` for the practical delivery plan and weekly priorities.

## Deploy
Push to GitHub → import to Vercel → add tikozap.com in Vercel Domains and set GoDaddy DNS.
