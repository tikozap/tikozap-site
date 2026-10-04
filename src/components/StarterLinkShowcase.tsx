// src/components/StarterLinkShowcase.tsx

export default function StarterLinkShowcase() {
  return (
    <section className="section-band-white starter-showcase">
      <div className="container-xl starter-showcase-inner">
        <div className="starter-showcase-copy">
          <h2>No website? No problem.</h2>
<ul className="starter-bullets">
  <li>Launch your business page in minutes</li>
  <li>Use one link to drive sales on any platform</li>
  <li>Your AI employee helps customers 24/7</li>
</ul>
        </div>

        <div
          className="starter-phone"
          aria-label="Starter Link store and chat preview"
        >
          <div className="starter-phone-layer starter-phone-layer-store">
            <img
              src="/art/starter-link-store.png"
              alt="Starter Link storefront for Luna Fashion"
              className="starter-phone-img"
            />
          </div>

          <div className="starter-phone-layer starter-phone-layer-chat">
            <img
              src="/art/starter-link-chat.png"
              alt="Starter Link AI chat with human handoff"
              className="starter-phone-img"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .starter-showcase {
          padding: 4rem 0 4.5rem;
        }

.starter-showcase-inner {
  display: grid;
  gap: 2.25rem;
  align-items: center;
  justify-items: center;
  text-align: left;
}

.starter-showcase-copy {
  width: 100%;
  max-width: 520px;
}

.starter-showcase-copy h2 {
  margin: 0;
  font-size: clamp(34px, 3.2vw, 48px);
  white-space: nowrap;
  line-height: 1.02;
  letter-spacing: -0.045em;
  font-weight: 800;
  color: #111827;
}

.starter-bullets {
  list-style: disc;
  max-width: 520px;
  margin: 1rem 0 0 0.15rem;
  padding-left: 1.65rem;
  color: #64748b;
}

.starter-bullets li {
  margin: 0.35rem 0;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.45;
}

        .starter-phone {
          position: relative;
          width: min(390px, 82vw);
          aspect-ratio: 420 / 880;
          overflow: hidden;
          border-radius: 56px;
          background: #fff;
        }

        .starter-phone-layer {
          position: absolute;
          inset: 0;
          background: #fff;
        }

        .starter-phone-img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .starter-phone-layer-store {
          z-index: 2;
          animation: starterStoreFade 9.6s ease-in-out infinite;
        }

        .starter-phone-layer-chat {
          z-index: 1;
          animation: starterChatFade 9.6s ease-in-out infinite;
        }

        @keyframes starterStoreFade {
          0%, 40% {
            opacity: 1;
          }
          48%, 90% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes starterChatFade {
          0%, 40% {
            opacity: 0;
          }
          48%, 90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

@media (max-width: 959px) {
  .starter-showcase-copy h2 {
    text-align: center;
  }

  .starter-bullets {
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (min-width: 960px) {
  .starter-showcase {
    padding: 5rem 0 5.5rem;
  }

.starter-showcase-inner {
  grid-template-columns: minmax(300px, 390px) minmax(520px, 1fr);
  column-gap: 96px;
  text-align: left;
  justify-items: stretch;
  transform: translateX(110px);
}

.starter-showcase-copy {
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  max-width: 520px;
  margin-left: 72px;
}

  .starter-phone {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
    width: min(390px, 100%);
  }

  .starter-showcase-copy p {
    margin-left: 0;
    margin-right: 0;
  }
}
      `}</style>
    </section>
  );
}