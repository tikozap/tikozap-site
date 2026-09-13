// src/app/docs/page.tsx

'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  TIKOZAP_HELP_CENTER,
  TIKOZAP_POPULAR_HELP_TOPIC_IDS,
} from '@/lib/tikozapHelpCenter';

export default function DocsPage() {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];

    return TIKOZAP_HELP_CENTER.flatMap((category) =>
      category.topics
        .filter((topic) => {
const haystack = [
  category.title,
  category.description,
  topic.title,
  ...topic.keywords,
]
  .join(' ')
  .toLowerCase();

          return haystack.includes(normalizedQuery);
        })
        .map((topic) => ({
          ...topic,
          categoryTitle: category.title,
        }))
    );
  }, [normalizedQuery]);

const popularTopics = TIKOZAP_HELP_CENTER
  .flatMap((category) =>
    category.topics.map((topic) => ({
      ...topic,
      categoryTitle: category.title,
    }))
  )
  .filter((topic) =>
    (TIKOZAP_POPULAR_HELP_TOPIC_IDS as readonly string[]).includes(
      topic.id
    )
  );

  return (
    <main id="main" className="has-sticky help-page">
      <section className="help-hero">
        <div className="container">
          <div className="help-heroInner">
            <h1>Help Center</h1>

            <p>
              Practical help for setting up, teaching, and working
              with your TikoZap assistant.
            </p>

            <label className="help-search">
              <span className="sr-only">
                Search the Help Center
              </span>

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search the Help Center…"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="help-main">
        <div className="container">
          {normalizedQuery ? (
            <section className="help-searchResults">
              <div className="help-sectionHead">
                <h2>Search results</h2>

                <button
                  type="button"
                  className="help-clear"
                  onClick={() => setQuery('')}
                >
                  Clear search
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="help-resultsList">
                  {searchResults.map((topic) => (
                    <a
                      key={topic.id}
                      href={`#${topic.id}`}
                      className="help-result"
                      onClick={() => setQuery('')}
                    >
                      <strong>{topic.title}</strong>
                      <span>{topic.categoryTitle}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="help-noResults">
                  <strong>No matching help topics.</strong>
                  <p>
                    Try a shorter search such as “Widget”,
                    “Voice”, “trial”, or “Knowledge”.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="help-categories">
                <div className="help-sectionHead">
                  <div>
                    <h2>Browse help</h2>
                    <p>
                      Choose the part of TikoZap you need help with.
                    </p>
                  </div>
                </div>

                <div className="help-categoryGrid">
                  {TIKOZAP_HELP_CENTER.map((category) => (
                    <a
                      key={category.id}
                      href={`#${category.id}`}
                      className="help-categoryCard"
                    >
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                      <span>View help →</span>
                    </a>
                  ))}
                </div>
              </section>

              <section className="help-popular">
                <div className="help-sectionHead">
                  <div>
                    <h2>Popular help</h2>
                    <p>
                      Quick answers to common questions.
                    </p>
                  </div>
                </div>

                <div className="help-popularGrid">
                  {popularTopics.map((topic) => (
                    <a
                      key={topic.id}
                      href={`#${topic.id}`}
                    >
                      {topic.title}
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="help-content">
            {TIKOZAP_HELP_CENTER.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="help-categorySection"
              >
                <div className="help-categoryIntro">
                  <h2>{category.title}</h2>
                  <p>{category.description}</p>
                </div>

                <div className="help-topicList">
                  {category.topics.map((topic) => (
                    <details
                      key={topic.id}
                      id={topic.id}
                      className="help-topic"
                    >
                      <summary>{topic.title}</summary>

<div className="help-topicBody">
  {topic.content.map((paragraph, index) => (
    <p key={index}>{paragraph}</p>
  ))}
</div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="help-support">
            <div>
              <h2>Still need help?</h2>
              <p>
                Contact TikoZap support and tell us what you’re
                trying to do.
              </p>
            </div>

            <a
              href="/contact"
              className="help-supportButton"
            >
              Contact support
            </a>
          </section>
        </div>
      </section>

      <style jsx>{`
        .help-page {
          padding-bottom: 4rem;
          background: #f8fafc;
        }

        .help-hero {
          padding: 2rem 0 1.5rem;
        }

        .help-heroInner {
          max-width: 760px;
        }

        .help-hero h1 {
          margin: 0;
          color: #111827;
          font-size: clamp(2rem, 4vw, 3.25rem);
          letter-spacing: -0.04em;
        }

        .help-hero p {
          max-width: 620px;
          margin: 10px 0 0;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.65;
        }

        .help-search {
          display: block;
          margin-top: 24px;
        }

        .help-search input {
          width: 100%;
          min-height: 54px;
          box-sizing: border-box;
          border: 1px solid #dbe3ea;
          border-radius: 16px;
          background: #ffffff;
          padding: 0 18px;
          color: #111827;
          font-size: 16px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
        }

        .help-search input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .help-main {
          padding-top: 4px;
        }

        .help-sectionHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
        }

        .help-sectionHead h2,
        .help-categoryIntro h2,
        .help-support h2 {
          margin: 0;
          color: #111827;
          letter-spacing: -0.025em;
        }

        .help-sectionHead p,
        .help-categoryIntro p,
        .help-support p {
          margin: 5px 0 0;
          color: #64748b;
          line-height: 1.55;
        }

        .help-categoryGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .help-categoryCard {
          display: block;
          min-height: 150px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          padding: 20px;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }

        .help-categoryCard:hover {
          border-color: #cbd5e1;
          text-decoration: none;
          transform: translateY(-1px);
        }

        .help-categoryCard h3 {
          margin: 0;
          color: #111827;
          font-size: 17px;
        }

        .help-categoryCard p {
          margin: 7px 0 18px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.55;
        }

        .help-categoryCard span {
          color: #2563eb;
          font-size: 13px;
          font-weight: 750;
        }

        .help-popular {
          margin-top: 34px;
        }

        .help-popularGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .help-popularGrid a {
          display: flex;
          align-items: center;
          min-height: 48px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          padding: 0 14px;
          color: #334155;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .help-popularGrid a:hover {
          border-color: #cbd5e1;
          color: #111827;
          text-decoration: none;
        }

        .help-content {
          display: grid;
          gap: 22px;
          margin-top: 40px;
        }

        .help-categorySection {
          scroll-margin-top: 5.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: #ffffff;
          padding: 22px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
        }

        .help-categoryIntro {
          margin-bottom: 16px;
        }

        .help-topicList {
          display: grid;
          gap: 8px;
        }

        .help-topic {
          scroll-margin-top: 5.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
          overflow: hidden;
        }

        .help-topic summary {
          cursor: pointer;
          list-style: none;
          padding: 14px 16px;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
        }

        .help-topic summary::-webkit-details-marker {
          display: none;
        }

        .help-topic summary::after {
          content: '+';
          float: right;
          color: #64748b;
          font-size: 18px;
          font-weight: 500;
        }

        .help-topic[open] summary::after {
          content: '−';
        }

        .help-topicBody {
          border-top: 1px solid #e5e7eb;
          padding: 14px 16px 16px;
          color: #475569;
          font-size: 14px;
          line-height: 1.65;
        }

        .help-topicBody :global(p) {
          margin: 0 0 10px;
        }

        .help-topicBody :global(p:last-child) {
          margin-bottom: 0;
        }

        .help-topicBody :global(code) {
          border-radius: 6px;
          background: #e2e8f0;
          padding: 2px 5px;
          color: #0f172a;
          font-size: 0.92em;
        }

        .help-searchResults {
          margin-bottom: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          padding: 20px;
        }

        .help-clear {
          min-height: 36px;
          border: 1px solid #dbe3ea;
          border-radius: 10px;
          background: #ffffff;
          padding: 0 12px;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .help-resultsList {
          display: grid;
          gap: 8px;
        }

        .help-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: 12px;
          background: #f8fafc;
          padding: 12px 14px;
          color: inherit;
          text-decoration: none;
        }

        .help-result:hover {
          background: #f1f5f9;
          text-decoration: none;
        }

        .help-result strong {
          color: #111827;
          font-size: 14px;
        }

        .help-result span {
          color: #64748b;
          font-size: 12px;
        }

        .help-noResults {
          border-radius: 14px;
          background: #f8fafc;
          padding: 18px;
          color: #475569;
        }

        .help-noResults p {
          margin: 5px 0 0;
          color: #64748b;
        }

        .help-support {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 26px;
          border: 1px solid #dbe3ea;
          border-radius: 20px;
          background: #eef2f7;
          padding: 22px;
        }

        .help-supportButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          flex: 0 0 auto;
          border-radius: 12px;
          background: #111827;
          padding: 0 16px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .help-supportButton:hover {
          color: #ffffff;
          text-decoration: none;
        }

@media (max-width: 700px) {
  .help-page {
    padding-bottom: 2.5rem;
  }

  .help-hero {
    padding-top: calc(1.25rem + 72px);
  }

          .help-categoryGrid,
          .help-popularGrid {
            grid-template-columns: 1fr;
          }

          .help-categoryCard {
            min-height: 0;
            padding: 17px;
          }

          .help-categorySection {
            padding: 16px;
            border-radius: 16px;
          }

          .help-sectionHead {
            align-items: flex-start;
          }

          .help-result {
            align-items: flex-start;
            flex-direction: column;
            gap: 2px;
          }

          .help-support {
            align-items: stretch;
            flex-direction: column;
          }

          .help-supportButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}