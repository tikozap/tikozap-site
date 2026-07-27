// src/app/about/page.tsx

import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — TikoZap",
  description:
    "TikoZap exists because every business deserves a great AI teammate.",
};

const teammateQualities = [
  {
    title: "Learns",
    body: "Understands your business and improves through coaching.",
  },
  {
    title: "Helps",
    body: "Supports customers every day.",
  },
  {
    title: "Communicates",
    body: "Chats, speaks, and answers phone calls naturally.",
  },
  {
    title: "Protects",
    body: "Respects your business and customer information.",
  },
  {
    title: "Connects",
    body: "Speaks your customers’ language.",
  },
  {
    title: "Collaborates",
    body: "Works alongside your team and knows when to ask for help.",
  },
];

export default function AboutPage() {
  return (
    <main id="main" className="about-page">
      <section className="about-hero">
        <div className="container-xl about-container">
          <p className="about-eyebrow">About TikoZap</p>

          <h1>
            Every business deserves
            <br />
            a great AI teammate.
          </h1>

          <p className="about-hero-copy">
            This is the belief that inspired TikoZap—and continues to guide
            everything we build.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="container-xl story-container">
          <h2>Running a business is personal.</h2>

          <div className="story-copy">
            <p>Every order represents a customer.</p>
            <p>Every question is a chance to earn trust.</p>
            <p>Every conversation helps build a relationship.</p>

            <p>
              But no matter how passionate a business owner is, one person
              can&apos;t answer every message, every phone call, and every
              customer question around the clock.
            </p>

            <p>
              Growing a business shouldn&apos;t mean being available every
              minute of every day.
            </p>

            <p className="story-emphasis">
              We believe every business deserves a teammate who is.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-soft">
        <div className="container-xl story-container">
          <h2>It started with a simple question.</h2>

          <div className="story-copy">
            <p className="story-question">
              What if every business could have a teammate who never gets
              tired, keeps learning, and is always ready to help?
            </p>

            <p>Not another chatbot.</p>
            <p>Not another complicated AI tool.</p>

            <p className="story-emphasis">A teammate.</p>

            <p>
              Someone who answers customer questions, speaks on the phone,
              learns the business, remembers coaching, asks for help when
              needed, and works alongside people every day.
            </p>

            <p>That simple question became TikoZap.</p>
          </div>
        </div>
      </section>

      <section className="about-reveal" aria-label="Our realization">
        <div className="container-xl reveal-container">
          <p>We weren&apos;t building software.</p>
          <p className="reveal-strong">We were building a teammate.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="container-xl story-container">
          <h2>That realization changed everything.</h2>

          <div className="realization-list">
            <div>
              <p>Instead of asking merchants to write prompts...</p>
              <strong>We let them teach.</strong>
            </div>

            <div>
              <p>Instead of asking them to configure AI...</p>
              <strong>We let them coach.</strong>
            </div>

            <div>
              <p>Instead of replacing people...</p>
              <strong>We built AI that works with people.</strong>
            </div>
          </div>

          <p className="realization-ending">
            Because that&apos;s what great teammates do.
          </p>
        </div>
      </section>

      <section className="about-section about-soft">
        <div className="container-xl qualities-container">
          <header className="qualities-head">
            <h2>A great teammate...</h2>
            <p>
              These aren&apos;t just product features. They&apos;re the
              qualities we believe every AI teammate should have.
            </p>
          </header>

          <div className="qualities-list">
            {teammateQualities.map((quality) => (
              <article className="quality-row" key={quality.title}>
                <h3>{quality.title}</h3>
                <p>{quality.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container-xl story-container">
          <h2>Technology should feel human.</h2>

          <div className="story-copy">
            <p>Businesses don&apos;t hire software.</p>
            <p>They hire people they can trust.</p>

            <p>
              We believe AI should earn that same trust. That means admitting
              when it&apos;s unsure, learning from corrections, working
              alongside human teammates, and always keeping merchants in
              control.
            </p>
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div className="container-xl mission-container">
          <p className="mission-eyebrow">Our mission</p>

          <h2>Every business deserves a great AI teammate.</h2>

          <div className="mission-copy">
            <p>Not because AI is replacing people.</p>

            <p>
              Because people deserve better tools, better support, and better
              teammates.
            </p>

            <p>
              Technology will continue to evolve. AI will become more capable.
              Businesses will continue to grow.
            </p>

            <p className="mission-unchanged">Our mission won&apos;t.</p>

            <p>
              We&apos;ll continue building AI teammates that help businesses
              grow while keeping people at the center of every decision.
            </p>
          </div>
        </div>
      </section>

      <section className="welcome-section">
        <div className="container-xl welcome-container">
          <Image
            src="/tikozaplogo.svg"
            alt=""
            width={56}
            height={56}
            className="welcome-logo"
          />

          <h2>Welcome to TikoZap.</h2>

          <p>We&apos;re not building AI to replace people.</p>

          <p className="welcome-final">
            We&apos;re building the teammate every business deserves.
          </p>
        </div>
      </section>

      <style>{`
        .about-page {
          background: #ffffff;
          color: #111827;
        }

        .about-container,
        .story-container,
        .qualities-container {
          max-width: 920px;
          margin-inline: auto;
        }

        .about-hero {
          padding: 5rem 0 5.5rem;
          background:
            radial-gradient(
              circle at 82% 18%,
              rgba(99, 102, 241, 0.14),
              transparent 30%
            ),
            linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .about-eyebrow,
        .mission-eyebrow {
          margin: 0 0 0.9rem;
          color: #2563eb;
          font-size: 0.82rem;
          font-weight: 750;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .about-hero h1 {
          max-width: 900px;
          margin: 0;
          font-size: clamp(46px, 6vw, 76px);
          line-height: 0.99;
          letter-spacing: -0.06em;
          font-weight: 850;
          color: #111827;
        }

        .about-hero-copy {
          max-width: 720px;
          margin: 1.6rem 0 0;
          font-size: clamp(20px, 2vw, 27px);
          line-height: 1.5;
          color: #475569;
        }

        .about-section {
          padding: 5.5rem 0;
        }

        .about-soft {
          background: #f8fafc;
          border-top: 1px solid #eef2f7;
          border-bottom: 1px solid #eef2f7;
        }

        .story-container h2,
        .qualities-head h2 {
          max-width: 760px;
          margin: 0;
          font-size: clamp(35px, 4vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 820;
          color: #111827;
        }

        .story-copy {
          max-width: 760px;
          margin-top: 2rem;
        }

        .story-copy p {
          margin: 0 0 1rem;
          font-size: clamp(17px, 1.4vw, 20px);
          line-height: 1.8;
          color: #475569;
        }

        .story-copy p + p {
          margin-top: 0.4rem;
        }

        .story-question {
          font-size: clamp(21px, 2vw, 27px) !important;
          line-height: 1.55 !important;
          color: #1e293b !important;
        }

        .story-emphasis {
          color: #111827 !important;
          font-weight: 750;
        }

        .about-reveal {
          padding: 7.5rem 0;
          background: #111827;
          color: #ffffff;
        }

        .reveal-container {
          max-width: 1020px;
          margin-inline: auto;
          text-align: center;
        }

        .about-reveal p {
          margin: 0;
          font-size: clamp(34px, 5vw, 66px);
          line-height: 1.08;
          letter-spacing: -0.05em;
          font-weight: 520;
          color: #cbd5e1;
        }

        .about-reveal .reveal-strong {
          margin-top: 0.45rem;
          color: #ffffff;
          font-weight: 850;
        }

        .realization-list {
          display: grid;
          gap: 2.2rem;
          max-width: 760px;
          margin-top: 2.5rem;
        }

        .realization-list div {
          padding-left: 1.25rem;
          border-left: 3px solid #c7d2fe;
        }

        .realization-list p {
          margin: 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.6;
        }

        .realization-list strong {
          display: block;
          margin-top: 0.4rem;
          color: #111827;
          font-size: clamp(20px, 2vw, 25px);
          line-height: 1.35;
        }

        .realization-ending {
          margin: 2.5rem 0 0;
          color: #111827;
          font-size: 1.15rem;
          font-weight: 750;
        }

        .qualities-head p {
          max-width: 700px;
          margin: 1rem 0 0;
          color: #64748b;
          font-size: 1.08rem;
          line-height: 1.7;
        }

        .qualities-list {
          margin-top: 3rem;
          border-top: 1px solid #cbd5e1;
        }

        .quality-row {
          display: grid;
          grid-template-columns: minmax(150px, 0.45fr) 1fr;
          gap: 2rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid #cbd5e1;
        }

        .quality-row h3 {
          margin: 0;
          color: #111827;
          font-size: 1.25rem;
          font-weight: 800;
        }

        .quality-row p {
          margin: 0;
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.65;
        }

        .mission-section {
          padding: 7rem 0;
          background:
            radial-gradient(
              circle at 20% 20%,
              rgba(37, 99, 235, 0.22),
              transparent 34%
            ),
            linear-gradient(145deg, #111827 0%, #172554 100%);
          color: #ffffff;
        }

        .mission-container {
          max-width: 980px;
          margin-inline: auto;
          text-align: center;
        }

        .mission-eyebrow {
          color: #93c5fd;
        }

        .mission-container h2 {
          max-width: 900px;
          margin: 0 auto;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 1.02;
          letter-spacing: -0.055em;
          font-weight: 850;
          color: #ffffff;
        }

        .mission-copy {
          max-width: 720px;
          margin: 2.3rem auto 0;
        }

        .mission-copy p {
          margin: 0 0 1rem;
          color: #cbd5e1;
          font-size: clamp(17px, 1.4vw, 20px);
          line-height: 1.75;
        }

        .mission-copy .mission-unchanged {
          color: #ffffff;
          font-size: clamp(22px, 2.3vw, 30px);
          font-weight: 800;
        }

        .welcome-section {
          padding: 6.5rem 0 7rem;
          background: #ffffff;
        }

        .welcome-container {
          max-width: 800px;
          margin-inline: auto;
          text-align: center;
        }

        .welcome-logo {
          width: 56px;
          height: auto;
          margin: 0 auto 1.5rem;
        }

        .welcome-container h2 {
          margin: 0;
          font-size: clamp(38px, 4.5vw, 58px);
          line-height: 1.05;
          letter-spacing: -0.045em;
          font-weight: 850;
          color: #111827;
        }

        .welcome-container p {
          margin: 1.3rem 0 0;
          color: #64748b;
          font-size: clamp(18px, 1.6vw, 22px);
          line-height: 1.6;
        }

        .welcome-container .welcome-final {
          margin-top: 0.45rem;
          color: #111827;
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .about-hero {
            padding: 3.75rem 0 4rem;
          }

          .about-hero h1 br {
            display: none;
          }

          .about-section {
            padding: 4rem 0;
          }

          .about-reveal {
            padding: 5.5rem 0;
          }

          .quality-row {
            grid-template-columns: 1fr;
            gap: 0.55rem;
            padding: 1.45rem 0;
          }

          .mission-section {
            padding: 5rem 0;
          }

          .welcome-section {
            padding: 4.75rem 0 5.25rem;
          }
        }
      `}</style>
    </main>
  );
}