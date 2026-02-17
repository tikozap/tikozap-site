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

## Execution roadmap
See `EXECUTION_PLAN.md` for the practical delivery plan and weekly priorities.

## Deploy
Push to GitHub → import to Vercel → add tikozap.com in Vercel Domains and set GoDaddy DNS.
