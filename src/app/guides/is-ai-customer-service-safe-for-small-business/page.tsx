// src/app/guides/is-ai-customer-service-safe-for-small-business/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Is AI Customer Service Safe for a Small Business?",
  description:
    "Learn what small businesses should look for in AI customer service security, privacy, data access, permissions, and human control.",
};

export default function GuidePage() {
  return (
    <main className="guide-article-page">
      <article>
        <header className="guide-article-hero">
          <div className="guide-reading">
            <p className="guides-eyebrow">TikoZap Guide</p>

            <h1>Is AI Customer Service Safe for a Small Business?</h1>

            <p className="guide-deck">
              If you let an AI assistant talk to your customers, what happens to
              everything they tell it?
            </p>
          </div>
        </header>

        <div className="guide-reading guide-body">
          <section className="guide-quick-answer">
            <p className="guide-label">The quick answer</p>

            <p>
              That is one of the first questions a small-business owner should
              ask before using AI customer service.
            </p>

            <p>
              Your customers may share names, order information, questions,
              preferences, and details about problems they are trying to solve.
              At the same time, you may teach the AI about your products,
              policies, and the way your business works.
            </p>

            <p>
              So security and privacy aren&apos;t side issues. They are part of
              deciding whether an AI assistant deserves a place on your team.
            </p>

            <p>
              The good news is that using AI for customer service does not have
              to mean giving an AI system unlimited access to your business.
            </p>

            <p>
              A well-designed AI customer-service system should work much more
              like a carefully managed employee: it gets the information it
              needs to do its job, the permissions appropriate for that job, and
              clear limits on what it can do.
            </p>
          </section>

          <section>
            <h2>How is the risk being managed?</h2>

            <p>
              The National Institute of Standards and Technology (NIST) treats
              cybersecurity and privacy as risk-management responsibilities,
              including for small businesses. Its small-business guidance is
              designed specifically to help organizations with limited security
              resources identify and manage those risks.
            </p>

            <p>
              For AI customer service, that means looking at a few practical
              questions:
            </p>

            <ul>
              <li>What information does the AI need?</li>
              <li>Where is that information stored?</li>
              <li>Who can access it?</li>
              <li>What outside providers receive it?</li>
              <li>What is the AI allowed to do?</li>
              <li>
                What happens when the AI shouldn&apos;t make a decision by
                itself?
              </li>
            </ul>

            <p className="guide-key-line">
              Security isn&apos;t about promising that AI has zero risk.
              It&apos;s about understanding what information the AI needs, how
              that information is handled, what the AI is allowed to do, and
              whether the business remains in control.
            </p>
          </section>

          <section>
            <h2>
              What information does an AI customer-service assistant need?
            </h2>

            <p>An AI assistant needs information to be useful.</p>

            <p>
              If a customer asks about shipping, it may need your shipping
              policy. If someone asks whether a product is available, it may
              need product information. If a customer continues an earlier
              conversation, the assistant may need enough conversation history
              to understand what is being discussed.
            </p>

            <p>
              But needing some information does not mean needing everything.
            </p>

            <p>
              An AI customer-service system should be designed around the
              information required for the task rather than unrestricted access
              to an entire business.
            </p>

            <p>
              That distinction becomes more important as AI systems become
              capable of doing more than answering questions.
            </p>

            <p className="guide-key-line">
              The safest AI assistant isn&apos;t the one that knows everything
              and can do everything. It&apos;s the one that has the information
              and authority it needs—and no more.
            </p>
          </section>

          <section>
            <h2>
              Privacy and security are related, but they aren&apos;t the same
              thing
            </h2>

            <p>
              Security is largely about protecting information and systems from
              unauthorized access, misuse, alteration, or loss.
            </p>

            <p>
              Privacy asks another set of questions: what information is
              collected, why it is collected, how it is used, who receives it,
              and how long it is kept.
            </p>

            <p>
              A system can therefore have strong technical security and still
              raise legitimate privacy questions.
            </p>

            <p>
              NIST makes this distinction explicitly: good cybersecurity is
              important, but cybersecurity alone cannot address every privacy
              risk.
            </p>

            <p>
              For a small-business owner, this means you should look beyond a
              statement such as &quot;your data is encrypted.&quot;
            </p>

            <p>
              You should also ask what data the service collects and what it
              does with that data.
            </p>
          </section>

          <section>
            <h2>
              Sometimes the safest data is data the system doesn&apos;t need
            </h2>

            <p>
              Small businesses have a simple security advantage available to
              them: don&apos;t give a system information it doesn&apos;t need to
              perform its job.
            </p>

            <p>
              The Federal Trade Commission has long encouraged businesses to
              think carefully about the personal information they collect and
              retain. The same principle is especially useful when evaluating
              AI.
            </p>

            <p>
              For example, an assistant answering questions about a store&apos;s
              return policy probably doesn&apos;t need access to every customer
              record in the business.
            </p>

            <p>
              An assistant helping customers find products may need a product
              catalog. That does not automatically mean it needs permission to
              edit those products, view customers, or change orders.
            </p>

            <p>
              This is often called the principle of{" "}
              <strong>least privilege</strong>: give a person or system the
              access necessary for the job, rather than giving broad access
              simply because it might be useful someday.
            </p>

            <p className="guide-key-line">
              Good AI security isn&apos;t only about keeping hackers out.
              It&apos;s also about deciding what the AI should know, who should
              have access, and what the AI should be allowed to do.
            </p>
          </section>

          <section>
            <h2>
              What happens when another AI company processes the conversation?
            </h2>

            <p>
              Many AI customer-service products don&apos;t build their own large
              AI models. They use models provided through APIs by companies
              specializing in AI.
            </p>

            <p>That means a business should ask an important question:</p>

            <p className="guide-key-line">
              What does the AI provider do with the information sent to it?
            </p>

            <p>
              The Federal Trade Commission has specifically warned AI companies
              that they must honor their privacy and confidentiality
              commitments, including promises about how customer information is
              used.
            </p>

            <p>
              And &quot;not used for training&quot; should not automatically be
              interpreted as &quot;never retained anywhere.&quot;
            </p>

            <p>Those are different questions.</p>

            <p>
              For example, OpenAI states that data submitted through its API is
              not used to train or improve its models by default unless the
              customer explicitly opts in. OpenAI also states that standard API
              inputs and outputs are generally removed after 30 days unless
              longer retention is legally required.
            </p>

            <p>
              Different providers and configurations can have different
              policies.
            </p>

            <p>
              So when evaluating an AI customer-service service, don&apos;t
              simply ask:
            </p>

            <p>&quot;Does it use AI?&quot;</p>

            <p className="guide-key-line">
              Ask which AI providers receive information, what they receive, and
              what their data policies are.
            </p>
          </section>

          <section>
            <h2>Who controls access to the business?</h2>

            <p>An AI assistant is only one part of the security picture.</p>

            <p>The people using the system matter too.</p>

            <p>
              A customer-service platform should distinguish between businesses,
              users, and permissions so that one account cannot simply access
              another business&apos;s information.
            </p>

            <p>
              Sensitive actions should receive stronger protection than ordinary
              actions.
            </p>

            <p>
              Deleting an account, changing billing, connecting another business
              system, or eventually allowing an AI assistant to take actions on
              behalf of a store should not be treated like answering a product
              question.
            </p>

            <p>
              This becomes increasingly important as AI evolves from answering
              questions to performing work.
            </p>

            <p className="guide-key-line">
              The more an AI assistant is allowed to do, the more important it
              becomes to control what it can access and what actions it is
              authorized to take.
            </p>
          </section>

          <section>
            <h2>What about connecting AI to your online store?</h2>

            <p>
              Connections to ecommerce platforms deserve special attention
              because they can potentially give software access to important
              business information.
            </p>

            <p>A good question to ask is not merely:</p>

            <p>&quot;Can this AI connect to my store?&quot;</p>

            <p>Ask instead:</p>

            <p className="guide-key-line">
              What permission does the connection actually request?
            </p>

            <p>
              If an AI assistant only needs to read product information, there
              may be no reason to give it permission to modify products, access
              customers, or change orders.
            </p>

            <p>
              Permissions should grow only when the job actually requires them.
            </p>

            <p className="guide-key-line">
              Don&apos;t give an AI employee tomorrow&apos;s authority to do
              today&apos;s job.
            </p>
          </section>

          <section>
            <h2>AI should know when not to act</h2>

            <p>Security isn&apos;t only about data.</p>

            <p>It is also about behavior.</p>

            <p>
              An AI assistant may be perfectly capable of answering: &quot;What
              is your return policy?&quot;
            </p>

            <p>
              That does not mean it should automatically have authority to issue
              a refund.
            </p>

            <p>
              It might explain shipping options without having permission to
              change a shipment. It might help a customer understand an order
              problem while leaving an unusual decision to a person.
            </p>

            <p>
              This is where human involvement becomes a security feature rather
              than a weakness.
            </p>

            <p>
              The goal isn&apos;t to make the AI independent at all costs. The
              goal is to let AI handle the work it can handle safely while
              keeping people in control of decisions that need human judgment or
              additional authority.
            </p>

            <p className="guide-key-line">
              AI handles what it can; people handle what they should.
            </p>
          </section>

          <section>
            <h2>
              Seven questions to ask before choosing an AI customer-service
              service
            </h2>

            <p>
              A small-business owner doesn&apos;t need to become a cybersecurity
              engineer to make a sensible decision.
            </p>

            <p>Ask the provider:</p>

            <ol>
              <li>What business and customer information does your AI need?</li>
              <li>
                Is my business&apos;s information separated from other
                businesses?
              </li>
              <li>
                Which outside AI or cloud providers receive my information?
              </li>
              <li>Is my data used to train public AI models?</li>
              <li>
                How are sensitive credentials, such as store access tokens,
                protected?
              </li>
              <li>
                What permissions does the AI receive when I connect my store?
              </li>
              <li>
                Can I keep control of important actions and bring a person into
                the conversation when necessary?
              </li>
            </ol>

            <p className="guide-key-line">
              Clear answers matter more than impressive security vocabulary.
            </p>
          </section>

          <section className="guide-bottom-line">
            <h2>So, is AI customer service safe for a small business?</h2>

            <p>
              It can be—but the answer should never be based simply on the word
              &quot;AI.&quot;
            </p>

            <p>Look at the system around the AI.</p>

            <p>
              A trustworthy AI customer-service service should limit access,
              protect credentials, explain how information is used, choose
              responsible technology providers, separate businesses from one
              another, and keep people in control of important decisions.
            </p>

            <p>
              Small-business owners already make similar trust decisions about
              payment processors, ecommerce platforms, email providers,
              accountants, employees, and other services.
            </p>

            <p>AI deserves the same thoughtful approach.</p>

            <p>
              You don&apos;t need an AI assistant that has access to everything.
            </p>

            <p>
              You need one that has enough access to do its job well—and clear
              boundaries around everything else.
            </p>

            <p className="guide-key-line">
              Good AI customer service isn&apos;t about giving AI control of
              your business. It&apos;s about giving it the right
              responsibilities while keeping the business in control.
            </p>
          </section>

          <section className="guide-tikozap">
            <p className="guide-label">The TikoZap approach</p>

            <h2>Where TikoZap fits</h2>

            <p>
              TikoZap is built around the idea that an AI assistant should work
              as an employee of the store—not as an AI system with unlimited
              authority.
            </p>

            <p>
              The assistant uses the business knowledge and conversation context
              needed to help customers, with structured and bounded context
              rather than unrestricted access to the merchant&apos;s entire
              database.
            </p>

            <p>
              Business data belongs to the merchant. TikoZap&apos;s privacy
              policy states that it does not sell or rent personal, business, or
              customer data and does not use merchants&apos; business data or
              customer conversations to train public AI models.
            </p>

            <p>
              TikoZap uses OpenAI&apos;s API to generate AI responses. OpenAI
              states that API data is not used to train its models by default.
            </p>

            <p>
              Access inside TikoZap is tied to authenticated users and their
              authorized stores. Important actions can require stronger
              authorization; for example, account deletion is restricted to the
              actual store owner and requires explicit confirmation.
            </p>

            <p>
              TikoZap&apos;s current Shopify integration follows the same
              limited-access approach. Shopify access credentials are encrypted
              before database storage and decrypted only in server-side code
              when needed.
            </p>

            <p>
              The production Shopify connection currently requests only{" "}
              <strong>read_products</strong> permission—the access needed to
              read product information. It does not currently request customer,
              order, or product-writing permissions.
            </p>

            <p>That last point is intentional.</p>

            <p>
              As an AI employee becomes capable of doing more work in the
              future, additional permissions should be added only when the job
              actually requires them.
            </p>

            <Link href="/how-it-works" className="guide-link">
              See how TikoZap works →
            </Link>
          </section>

          <section className="guide-sources">
            <h2>Sources &amp; further reading</h2>

            <p>
              This guide was informed by current guidance on small-business
              cybersecurity, privacy, AI data handling, and ecommerce access
              controls.
            </p>

            <ul>
              <li>
                <a
                  href="https://www.nist.gov/publications/nist-cybersecurity-framework-20-small-business-quick-start-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NIST — Cybersecurity Framework 2.0: Small Business Quick-Start
                  Guide
                </a>
              </li>

              <li>
                <a
                  href="https://www.nist.gov/privacy-framework/getting-started-0/learning-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NIST — Privacy Framework resources for small and medium
                  businesses
                </a>
              </li>

              <li>
                <a
                  href="https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/2024/01/ai-companies-uphold-your-privacy-confidentiality-commitments"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Federal Trade Commission — AI Companies: Uphold Your Privacy
                  and Confidentiality Commitments
                </a>
              </li>

              <li>
                <a
                  href="https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Federal Trade Commission — Protecting Personal Information: A
                  Guide for Business
                </a>
              </li>

              <li>
                <a
                  href="https://openai.com/business-data/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI — Business data privacy, security, and compliance
                </a>
              </li>

              <li>
                <a
                  href="https://platform.openai.com/docs/guides/your-data"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI — Data controls in the OpenAI platform
                </a>
              </li>

              <li>
                <a
                  href="https://shopify.dev/docs/api/usage/access-scopes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shopify — API access scopes
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
