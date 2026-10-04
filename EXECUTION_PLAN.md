# TikoZap Practical Execution Plan

This plan is optimized for shipping fast without losing reliability.

## 1) Product focus (what we are building first)

**Primary loop (must work end-to-end):**
1. Merchant connects store and sets policies/knowledge.
2. Customer asks question via widget.
3. AI responds with grounded answer.
4. Staff can take over in inbox.
5. Team sees measurable outcomes (response time, deflection, escalations).

Everything else is secondary until this loop is stable.

---

## 2) Success metrics (track weekly)

- % conversations auto-resolved
- Median first response time
- Escalation rate to human
- Hallucination/error rate (from eval set)
- Time-to-onboard a new merchant (from signup to first useful AI reply)

---

## 3) 8-week delivery plan

## Phase A (Week 1-2): Foundation hardening
- [ ] Remove repo noise and backup artifacts
- [ ] Normalize git hygiene (`.gitignore`, generated files)
- [ ] Keep CI-safe checks stable (`npm run check`)
- [ ] Unify auth/session flow for demo and dashboard routes
- [ ] Add basic API abuse controls (rate limit on public demo/widget endpoints)

**Exit criteria:** Clean deploy pipeline, reproducible build, no auth dead-ends.

## Phase B (Week 3-4): Quality + evaluation
- [ ] Build an eval dataset (100+ realistic support prompts)
- [ ] Add pass/fail rubric (accuracy, safety, handoff behavior)
- [ ] Track score changes per prompt/model update
- [ ] Add “unknown intent” and “needs-human” handling paths

**Exit criteria:** Quality can be measured and improved systematically.

## Phase C (Week 5-6): Core product differentiation
- [ ] Improve inbox workflow (takeover, notes, tags, status, context)
- [ ] Knowledge ingestion improvements (policies, FAQ updates)
- [ ] Add insight dashboard (deflection, escalation, unresolved intents)

**Exit criteria:** Teams can run real support workflows and see ROI metrics.

## Phase D (Week 7-8): GTM readiness
- [ ] Billing and usage limits
- [ ] Design partner rollout checklist
- [ ] Case-study-ready metrics and onboarding docs

**Exit criteria:** Product can be sold and onboarded with predictable outcomes.

---

## 4) Immediate backlog (start now)

Priority order:
1. Build/deploy reliability
2. Auth and tenancy consistency
3. Public endpoint protection
4. Evaluation harness
5. KPI dashboard surfaces

Rule: each work item should ship in a small commit, with lint/build green before merge.
