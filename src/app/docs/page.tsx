'use client';

const featureSections = [
  { id: 'ai-support', title: '24/7 AI support' },
  { id: 'store-aware', title: 'Store-aware answers' },
  { id: 'omnichannel', title: 'Omnichannel inbox' },
  { id: 'easy-install', title: 'One-click install' },
  { id: 'proactive', title: 'Proactive engagement' },
  { id: 'multilingual', title: 'Multilingual & sentiment-aware' },
  { id: 'safe-actions', title: 'Safe actions & guardrails' },
  { id: 'handoff', title: 'Human handoff' },
  { id: 'analytics', title: 'Analytics & control center' },
];

export default function DocsPage() {
  return (
    <main id="main" className="has-sticky docs-page">
      {/* Page hero (unified style) */}
      <section className="page-hero">
        <div className="container">
          <h1>Docs &amp; FAQ</h1>
          <p className="small">
            Quick start, feature deep-dives, and common questions about TikoZap.
          </p>
        </div>
      </section>

      {/* Main 2-column layout */}
      <section className="docs-main">
        <div className="container docs-layout">
          {/* Left: on-this-page nav */}
          <aside className="docs-nav" aria-label="Documentation sections">
            <h2 className="docs-nav__title">Table of contents</h2>
            <ul>
              <li>
                <a href="#quick-start">Quick start</a>
              </li>
              <li>
                <a href="#features">Core features</a>
              </li>
              {featureSections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
              <li>
                <a href="#billing">Limits &amp; billing</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </aside>

          {/* Right: all docs content */}
          <div className="docs-body stack">
            {/* Quick start */}
            <section id="quick-start" className="card stack docs-section">
              <h2>Quick start</h2>
              <ol>
                <li>Sign up and connect your store data (catalog, orders, policies).</li>
                <li>
                  Choose your entry point: install the website widget, or use Starter Link
                  if you do not have a website yet.
                </li>
                <li>
                  Approve actions (e.g., discount limits, RMA rules) and go live.
                </li>
              </ol>
            </section>

            {/* Core feature sections (same as Features tiles) */}
            <section id="features" className="card stack docs-section">
              <h2>Core features</h2>
              <p className="small">
                These sections match the tiles on the Features page so you can see exactly
                what each capability does and how to configure it.
              </p>

              {/* ONE COLUMN: read one feature at a time */}
              <div className="feature-docs-column">
                {featureSections.map((s) => (
                  <section key={s.id} id={s.id} className="stack feature-doc">
                    <h3>{s.title}</h3>

                    {s.id === 'ai-support' ? (
                      <>
                        <p>
                          <strong>24/7 AI support</strong> keeps a trained helper on your
                          site at all times, answering common questions about orders,
                          shipping, returns, sizing, and more without waiting for a human.
                          Instead of inboxes piling up overnight or on weekends, customers
                          get instant answers in the chat widget.
                        </p>
                        <p>
                          TikoZap uses your connected data sources (catalog, orders,
                          policies, FAQs) plus a modern language model to generate answers
                          that match your store. If the AI is not confident, it can ask a
                          clarifying question or hand the conversation to you instead of
                          guessing.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Connect your store data.</strong> In the dashboard, add
                            your catalog, order system, and policy/FAQ pages as data sources
                            so the AI has something real to work with.
                          </li>
                          <li>
                            <strong>Install the chat widget.</strong> Copy the snippet from
                            the dashboard and paste it into your site before{' '}
                            <code>&lt;/head&gt;</code>, or install the TikoZap app if your
                            platform supports it.
                          </li>
                          <li>
                            <strong>Choose your hours and handoff rules.</strong> Decide
                            whether the AI should run 24/7 or only outside business hours,
                            and when to route a chat to a human instead.
                          </li>
                          <li>
                            <strong>Set the tone of voice.</strong> Pick a tone (friendly,
                            professional, playful) and add a short brand description so
                            answers sound like your store.
                          </li>
                          <li>
                            <strong>Test and approve.</strong> Ask a few common questions
                            (shipping, returns, order status) and adjust any answers you
                            don&apos;t like. Approved edits become the default reply next
                            time.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'store-aware' ? (
                      <>
                        <p>
                          <strong>Store-aware answers</strong> means the AI doesn&apos;t
                          guess or give generic responses—it reads from your own catalog,
                          orders, shipping rules, and policies so every answer is specific
                          to your store. Customers can ask about product details, delivery
                          times, or return options and get answers that match what they
                          would see in your backend.
                        </p>
                        <p>
                          Behind the scenes, TikoZap uses retrieval to pull facts from your
                          connected data sources before it generates a reply. That keeps
                          answers consistent with your product pages, order statuses, and
                          policy text instead of relying on the model&apos;s memory.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Connect your catalog.</strong> Link your e-commerce
                            platform or upload a product feed so TikoZap can see titles,
                            variants, prices, stock status, and key attributes.
                          </li>
                          <li>
                            <strong>Add order &amp; policy data.</strong> Connect your order
                            system (or API) and link shipping/returns/FAQ pages so questions
                            about &quot;Where is my order?&quot; or &quot;What is your
                            return policy?&quot; can be answered from the source of truth.
                          </li>
                          <li>
                            <strong>Define what the bot can say.</strong> In the dashboard,
                            confirm which data sources are allowed for answers (e.g.,
                            products + policies, but not internal notes).
                          </li>
                          <li>
                            <strong>Preview a few scenarios.</strong> Ask the bot about a
                            specific product, a shipping zone, and a return rule and verify
                            that the answer matches what&apos;s in your store admin.
                          </li>
                          <li>
                            <strong>Turn on citations (optional).</strong> Enable &quot;show
                            sources&quot; so customers can see which page or data source an
                            answer came from, increasing trust.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'omnichannel' ? (
                      <>
                        <p>
                          <strong>Omnichannel inbox</strong> brings conversations from your
                          site widget, email, and other connected channels into one
                          timeline. Instead of switching between tabs, you see the full
                          history with a customer in a single place.
                        </p>
                        <p>
                          TikoZap can handle common questions automatically and then hand
                          off to a human when needed, but the record of what happened stays
                          in one inbox. That makes it easier for your team to collaborate
                          and keep replies consistent.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Connect your channels.</strong> In the inbox settings,
                            connect your site widget and any supported email or messaging
                            channels you want to unify.
                          </li>
                          <li>
                            <strong>Set routing rules.</strong> Decide how new conversations
                            are assigned—round robin, by topic, or to a specific owner.
                          </li>
                          <li>
                            <strong>Turn on AI assist.</strong> Allow TikoZap to suggest
                            replies or handle specific categories (e.g., order status)
                            while your team focuses on edge cases.
                          </li>
                          <li>
                            <strong>Customize views.</strong> Use filters and tags (e.g.,
                            &quot;VIP,&quot; &quot;Returns,&quot; &quot;Wholesale&quot;) to
                            create saved views for your team.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'easy-install' ? (
                      <>
                        <p>
                          <strong>One-click install</strong> is designed so you can get
                          TikoZap live without a developer. On supported platforms you add
                          the app, confirm your settings, and the widget appears
                          automatically. If you do not have a website yet, you can launch
                          with a shareable Starter Link in minutes.
                        </p>
                        <p>
                          For custom sites, you can still install with a small snippet—no
                          heavy SDKs or build steps. Once the widget is in place, all
                          styling and behavior are controlled from the dashboard. Starter
                          Link uses the same assistant configuration and inbox workflow.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Choose your platform.</strong> In the install section,
                            pick your e-commerce platform (e.g., Shopify, custom, etc.) or
                            choose Starter Link if you are not using a website yet.
                          </li>
                          <li>
                            <strong>Use the one-click app (if available).</strong> For
                            supported platforms, click &quot;Install&quot; and follow the
                            app prompts—no copy/paste needed.
                          </li>
                          <li>
                            <strong>Or paste the snippet.</strong> For custom sites, copy
                            the widget snippet and paste it before <code>&lt;/head&gt;</code>{' '}
                            on the pages where you want chat to appear.
                          </li>
                          <li>
                            <strong>Preview on your site.</strong> Open your storefront in a
                            new tab and confirm the widget appears and loads correctly.
                          </li>
                          <li>
                            <strong>Share Starter Link (optional).</strong> Copy your hosted
                            support URL and share it in social bios, marketplace chats, or a
                            QR code for customers without a website flow.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'proactive' ? (
                      <>
                        <p>
                          <strong>Proactive engagement</strong> lets TikoZap start helpful
                          conversations instead of waiting for customers to click the
                          widget. You can gently offer help on key pages, recover abandoned
                          carts, or highlight key policies before checkout.
                        </p>
                        <p>
                          Campaigns run within the guardrails you define, so visitors see
                          relevant prompts instead of spammy popups. You can measure how
                          many chats and conversions each campaign drives.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Pick a trigger.</strong> Choose when prompts appear—for
                            example, time on page, exit intent on cart, or return visitors.
                          </li>
                          <li>
                            <strong>Define the audience.</strong> Limit campaigns to certain
                            pages, devices, or segments (e.g., first-time visitors or
                            customers with items in cart).
                          </li>
                          <li>
                            <strong>Write the opening message.</strong> Keep it short and
                            specific, like &quot;Need help with sizing?&quot; or
                            &quot;Questions about shipping times?&quot;
                          </li>
                          <li>
                            <strong>Set frequency caps.</strong> Control how often a visitor
                            sees each campaign so the experience stays respectful.
                          </li>
                          <li>
                            <strong>Review performance.</strong> Use the analytics panel to
                            see chats started, responses, and conversions per campaign.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'multilingual' ? (
                      <>
                        <p>
                          <strong>Multilingual &amp; sentiment-aware</strong> support means
                          TikoZap can detect a visitor&apos;s language automatically and
                          reply in that language while also reading the tone of the message.
                        </p>
                        <p>
                          You can keep a consistent brand voice across languages and see
                          when customers are confused, frustrated, or happy, so you can
                          jump in at the right time.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Enable languages.</strong> In settings, choose which
                            languages TikoZap is allowed to use and set a default fallback.
                          </li>
                          <li>
                            <strong>Add brand voice examples.</strong> Provide a few sample
                            replies or phrases in your main language so tone carries over
                            when translated.
                          </li>
                          <li>
                            <strong>Turn on sentiment flags.</strong> Enable indicators for
                            low satisfaction or frustration so those chats can be
                            prioritized or routed to a human.
                          </li>
                          <li>
                            <strong>Test in each language.</strong> Ask a few common
                            questions in each enabled language and verify that answers are
                            accurate and on-brand.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'safe-actions' ? (
                      <>
                        <p>
                          <strong>Safe actions &amp; guardrails</strong> let you decide
                          exactly what TikoZap is allowed to do in your store—and what it
                          should never do. Instead of an AI that can change orders or hand
                          out discounts freely, you define clear rules: which actions are
                          allowed, what limits apply, and when a human must approve or take
                          over.
                        </p>
                        <p>
                          Typical actions include applying small discounts, adding order
                          notes, starting returns, or sending follow-up templates. TikoZap
                          can always answer questions without doing any actions at all;
                          actions are an optional extra layer you control.
                        </p>

                        <h4>How to configure safe actions</h4>
                        <ol>
                          <li>
                            <strong>Choose what the bot can do.</strong> In the dashboard,
                            decide whether TikoZap should only answer questions, suggest
                            actions for you to click, or be allowed to perform certain
                            low-risk actions automatically (for example: apply up to 10%
                            discount on delayed orders).
                          </li>
                          <li>
                            <strong>Set hard limits.</strong> For each action type, define
                            limits such as max discount %, which order statuses are
                            eligible, and when returns or RMAs are allowed. The AI can
                            never go beyond these limits.
                          </li>
                          <li>
                            <strong>Define approvals &amp; roles.</strong> Choose which
                            roles can approve actions (owner, manager, staff). High-impact
                            actions can require a human click, while small actions can be
                            auto-approved.
                          </li>
                          <li>
                            <strong>Configure handoff rules.</strong> Tell TikoZap when to
                            stop and escalate instead of guessing—such as high order value,
                            low AI confidence, angry sentiment, or anything that touches VIP
                            customers.
                          </li>
                          <li>
                            <strong>Review the audit log.</strong> Use the log to see a
                            history of AI-suggested and AI-executed actions with timestamps,
                            customer, and rule used. If you don&apos;t like a pattern, you
                            can tighten the rules or turn that action off entirely.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'handoff' ? (
                      <>
                        <p>
                          <strong>Human handoff</strong> makes it easy for TikoZap to step
                          aside when a conversation needs a person. Customers don&apos;t
                          lose context—the human sees the full chat history and any actions
                          the AI already took.
                        </p>
                        <p>
                          You can define when handoff should happen automatically (for
                          example, VIP customers, high order value, or repeated negative
                          sentiment) and give your team one-click controls to take over or
                          return a chat to the bot.
                        </p>

                        <h4>How to set it up</h4>
                        <ol>
                          <li>
                            <strong>Define handoff triggers.</strong> Choose conditions that
                            should route to a human, such as &quot;order value over
                            $200&quot; or &quot;customer said they&apos;re upset.&quot;
                          </li>
                          <li>
                            <strong>Set business hours.</strong> Decide when humans are
                            typically available and how handoff behaves outside those hours.
                          </li>
                          <li>
                            <strong>Assign owners.</strong> Configure who receives handoffs
                            (owner, managers, specific inboxes) and how they&apos;re
                            notified.
                          </li>
                          <li>
                            <strong>Test the flow.</strong> Start a test chat, trigger a
                            handoff, and make sure the transition feels smooth on both
                            sides.
                          </li>
                        </ol>
                      </>
                    ) : s.id === 'analytics' ? (
                      <>
                        <p>
                          <strong>Analytics &amp; control center</strong> shows how TikoZap
                          is performing for your store: how many chats it handled, how much
                          time it saved, which questions are most common, and where
                          customers still need human help.
                        </p>
                        <p>
                          These insights help you improve your FAQs, adjust policies, and
                          decide when to tighten or loosen guardrails. You can also monitor
                          satisfaction scores and response times over time.
                        </p>

                        <h4>How to use it</h4>
                        <ol>
                          <li>
                            <strong>Check the overview weekly.</strong> Look at total chats,
                            time saved, and thumbs-up rate to get a quick health check.
                          </li>
                          <li>
                            <strong>Review top questions.</strong> Use the &quot;top
                            questions&quot; list to decide which FAQs or policy pages need
                            clearer wording.
                          </li>
                          <li>
                            <strong>Watch CSAT and sentiment.</strong> Track satisfaction
                            and sentiment trends; if they dip, review recent chats to see
                            what changed.
                          </li>
                          <li>
                            <strong>Adjust settings.</strong> Use what you learn to tweak
                            prompts, guardrails, and handoff rules, then check the dashboard
                            again after changes.
                          </li>
                        </ol>
                      </>
                    ) : (
                      <>
                        <p>
                          Explain what <strong>{s.title}</strong> is solving for a store
                          owner in one or two sentences. Focus on outcomes: fewer tickets,
                          faster replies, more sales, or better customer experience.
                        </p>
                        <p>
                          Then outline how to turn it on in the TikoZap dashboard—where to
                          click, what to connect, and any limits that apply on each plan.
                        </p>
                      </>
                    )}
                  </section>
                ))}
              </div>
            </section>

            {/* Limits & billing */}
            <section id="billing" className="card stack docs-section">
              <h2>Limits, billing &amp; overage</h2>
              <p>
                TikoZap is billed by plan and chat volume, with simple overage and fair-use
                storage limits. This page explains how we count chats, what happens at your
                limits, and how trials work.
              </p>

              <h3>Monthly chat limits by plan</h3>
              <p className="small">
                A <strong>chat</strong> is a conversation between a visitor and TikoZap
                (and optionally a human) within a rolling session. Multiple messages in the
                same session count as one chat.
              </p>
              <ul>
                <li>
                  <strong>Starter:</strong> 1,000 chats / month
                </li>
                <li>
                  <strong>Pro:</strong> 5,000 chats / month
                </li>
                <li>
                  <strong>Business:</strong> 15,000 chats / month
                </li>
                <li>
                  <strong>Agency / White-label:</strong> pooled chats across client
                  workspaces (designed for agencies and service providers)
                </li>
              </ul>

              <p className="small">
                You can monitor usage in the dashboard at any time. We&apos;ll nudge you by
                email and in-app if you&apos;re approaching your plan&apos;s monthly limit.
              </p>

              <h3>Overage</h3>
              <p>
                If you go over your plan&apos;s included chats in a billing month, we
                don&apos;t shut the bot off. Instead, overage is billed in simple blocks:
              </p>
              <p>
                <strong>$5 per extra 1,000 chats</strong> on all tiers (soft cap;
                auto-billed).
              </p>
              <p className="small">
                Example: If your Pro plan includes 5,000 chats and you use 6,200 chats in a
                month, you&apos;ll be billed for your Pro plan plus 2 extra blocks of
                overage (2 × 1,000 chats).
              </p>

              <h3>Storage &amp; fair use</h3>
              <p>
                Knowledge sources (FAQs, policies, product data, and other documents) count
                toward a fair-use storage pool for your account.
              </p>
              <ul>
                <li>
                  <strong>Starter:</strong> 50&nbsp;MB
                </li>
                <li>
                  <strong>Pro:</strong> 200&nbsp;MB
                </li>
                <li>
                  <strong>Business:</strong> 1&nbsp;GB
                </li>
                <li>
                  <strong>Agency / White-label:</strong> pooled 3&nbsp;GB across client
                  workspaces, then $4 / GB
                </li>
              </ul>
              <p className="small">
                You can delete or archive sources at any time to free up space. We&apos;ll
                notify you before you exceed storage so there are no surprises.
              </p>

              <h3>Trials &amp; billing</h3>
              <ul>
                <li>
                  <strong>14-day full Pro trial</strong> for new accounts.
                </li>
                <li>
                  <strong>No credit card required</strong> to start a trial on Starter or
                  Pro plans.
                </li>
                <li>
                  A card is required to trial <strong>Business</strong> or{' '}
                  <strong>Agency / White-label</strong>, due to higher limits and advanced
                  features.
                </li>
                <li>
                  If you don&apos;t upgrade at the end of the trial, your account can be
                  downgraded to a lighter &quot;Starter&quot; mode so you don&apos;t lose
                  your settings and memory.
                </li>
              </ul>

              <p className="small">
                You can change plans, update billing details, or cancel from the billing
                page in your dashboard. Changes take effect on your next billing cycle
                unless otherwise noted.
              </p>
            </section>

            {/* FAQ */}
            <section id="faq" className="card stack docs-section">
              <h2>FAQ</h2>
              <section className="faq">
                <details open>
                  <summary>How do I install the widget?</summary>
                  <p>
                    Copy the snippet from your dashboard and paste it before{' '}
                    <code>&lt;/head&gt;</code>. No code required.
                  </p>
                </details>
                <details>
                  <summary>What data does TikoZap use?</summary>
                  <p>
                    Only the data sources you connect (products, orders, policies).
                    Answers include citations.
                  </p>
                </details>
                <details>
                  <summary>What if I do not have a website yet?</summary>
                  <p>
                    Use Starter Link. It gives you a hosted support page and the same inbox
                    workflow, so you can start now and add a widget later.
                  </p>
                </details>
                <details>
                  <summary>Can I control actions?</summary>
                  <p>
                    Yes—enable/disable actions and set limits (e.g., max discount, RMA
                    reasons) per role.
                  </p>
                </details>
                <details>
                  <summary>How do you monitor talking quality with Twilio?</summary>
                  <p>
                    TikoZap uses a two-layer approach: <strong>transport quality</strong>{' '}
                    (first response speed, jitter, packet loss, MOS) and{' '}
                    <strong>conversation quality</strong> (accuracy, safe behavior,
                    handoff readiness). Use Twilio Voice Insights metrics for transport and
                    combine them with conversation scoring so voice can escalate early when
                    quality drops. Send Twilio payloads to{' '}
                    <code>/api/webhooks/twilio/voice</code> and review the summary in your
                    dashboard metrics.
                  </p>
                </details>
              </section>
            </section>
          </div>
        </div>
      </section>

      <style jsx>{`
        .docs-page {
          padding-bottom: 3rem;
        }

        .page-hero {
          padding: 1.75rem 0 0.75rem;
        }
        .page-hero h1 {
          margin: 0 0 0.25rem;
        }
        .page-hero .small {
          max-width: 40rem;
        }

        .docs-main {
          padding-top: 0.25rem;
        }

        .docs-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1.5rem;
        }

        .docs-nav {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          background: #ffffff;
          font-size: 0.9rem;
        }

        .docs-nav__title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 0.5rem;
        }

        .docs-nav ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.25rem;
        }

        .docs-nav a {
          text-decoration: none;
        }

        .docs-nav a:hover,
        .docs-nav a:focus-visible {
          text-decoration: underline;
        }

        .docs-body {
          gap: 1.5rem;
        }

        .docs-section {
          scroll-margin-top: 5.25rem; /* keep anchors clear of sticky nav */
        }

        .feature-docs-column {
          display: grid;
          gap: 1.25rem;
          margin-top: 0.75rem;
        }

        .feature-doc h3 {
          margin-bottom: 0.25rem;
        }

        @media (min-width: 56rem) {
          .docs-layout {
            grid-template-columns: minmax(11rem, 13rem) minmax(0, 1fr);
            align-items: flex-start;
          }

          .docs-nav {
            position: sticky;
            top: 5rem; /* below top nav */
          }
        }
      `}</style>
    </main>
  );
}
