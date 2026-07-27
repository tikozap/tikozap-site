// src/app/dashboard/assistant/memory/page.tsx

'use client';

import { useState } from 'react';
import AssistantSectionMenu from '../_components/AssistantSectionMenu';
import MobilePageHeader from '../../_components/MobilePageHeader';
import { useAssistantIdentity } from '../_components/useAssistantIdentity';


type MemoryEntry = {
  id: string;
  title: string;
  type: 'customer' | 'product' | 'business' | 'experience';
  notes: string[];
};

const MEMORY: MemoryEntry[] = [
  {
    id: 'michael',
    type: 'customer',
    title: 'Michael',
    notes: [
      'Michael usually shops about once a month.',
      'He compares products carefully before buying and appreciates detailed answers.',
      'I recommend two or three carefully selected products instead of a long product list.',
      'Because sizing has been a concern before, I suggest the size guide before recommending jackets.',
    ],
  },
  {
    id: 'waterproof',
    type: 'product',
    title: 'Water-resistant vs Waterproof',
    notes: [
      'When customers ask whether a jacket is waterproof, explain the difference early.',
      'Water-resistant means suitable for light rain.',
      'Waterproof means designed for prolonged exposure to water.',
      'This helps customers choose the right product without expecting more protection than the jacket provides.',
    ],
  },
  {
    id: 'returns',
    type: 'business',
    title: 'Returns',
    notes: [
      'Customers need clear, calm explanations about whether an item can be returned or exchanged.',
      'When the customer ordered the wrong item, first check whether an exchange would solve the problem.',
      'If the item arrived damaged or defective, treat it as a service problem, not a customer mistake.',
    ],
  },
  {
    id: 'gift-shoppers',
    type: 'experience',
    title: 'Gift shoppers',
    notes: [
      'Gift shoppers care most about delivery timing and whether the item feels appropriate for the recipient.',
      'Complete outfit or matching-product ideas help gift shoppers decide faster.',
      'Ask about occasion, recipient style, and deadline before recommending products.',
    ],
  },
];

function searchEmmaMemory(question: string): MemoryEntry {
  const normalized = question.toLowerCase();

  if (normalized.includes('waterproof') || normalized.includes('water-resistant')) {
    return MEMORY.find((entry) => entry.id === 'waterproof')!;
  }

  if (normalized.includes('return') || normalized.includes('exchange')) {
    return MEMORY.find((entry) => entry.id === 'returns')!;
  }

  if (normalized.includes('gift')) {
    return MEMORY.find((entry) => entry.id === 'gift-shoppers')!;
  }

  return MEMORY.find((entry) => entry.id === 'michael')!;
}

export default function MemoryPage() {
  const { assistantName } = useAssistantIdentity();
  const [question, setQuestion] = useState('');
  const [entry, setEntry] = useState<MemoryEntry | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');

  function askEmma() {
    const text = question.trim();
    if (!text) return;

    setLastQuestion(text);
    setEntry(searchEmmaMemory(text));
  }

  function useSuggestion(text: string) {
    setQuestion(text);
    setLastQuestion(text);
    setEntry(searchEmmaMemory(text));
  }

  return (
    <div className="db-container">
      <MobilePageHeader
  title="Memory"
  rightAction={<AssistantSectionMenu />}
/>

      <div className="db-pageStack mem-page">
<div className="assistant-sectionPageHeader">
  <div>
    <h1 className="db-title">Memory</h1>
    <p className="db-sub">{assistantName}&apos;s Notebook</p>
  </div>

  <div className="assistant-sectionDesktopSwitcher">
    <AssistantSectionMenu />
  </div>
</div>

        <section className="mem-searchHero">
          <h2>Ask me anything I&apos;ve learned.</h2>

          <div className="mem-searchRow">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') askEmma();
              }}
              placeholder="What have you learned about..."
            />

            <button type="button" onClick={askEmma}>
              Ask {assistantName}
            </button>
          </div>

          <div className="mem-suggestions">
            <button
              type="button"
              onClick={() => useSuggestion('What do you remember about Michael?')}
            >
              Michael
            </button>

            <button
              type="button"
              onClick={() =>
                useSuggestion('What have you learned about waterproof jackets?')
              }
            >
              Waterproof jackets
            </button>

            <button
              type="button"
              onClick={() => useSuggestion('How do we usually explain returns?')}
            >
              Returns
            </button>

            <button
              type="button"
              onClick={() => useSuggestion('What have you learned about gift shoppers?')}
            >
              Gift shoppers
            </button>
          </div>
        </section>

        {entry ? (
          <section className="mem-answer">
            <div className="mem-answerCard">
              <div className="mem-answerTop">
                <div className="mem-answerIcon">📖</div>
                <div>
                  <span>{entry.type}</span>
                  <h2>{entry.title}</h2>
                </div>
              </div>

              <h3>Here&apos;s what I remember.</h3>

              <div className="mem-answerList">
                {entry.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
              <p className="mem-footer">
  Built from customer conversations, mentoring, and experience.
</p>
            </div>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .mem-page {
          max-width: 760px;
          margin: 0 auto;
        }

        .mem-searchHero,
        .mem-answerCard {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .mem-searchHero {
          display: grid;
          gap: 14px;
        }

        .mem-searchHero h2 {
          margin: 0;
          color: #111827;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .mem-searchRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .mem-searchRow input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 999px;
          padding: 13px 16px;
          font-size: 14px;
          color: #111827;
          outline: none;
        }

        .mem-searchRow input:focus {
          border-color: #111827;
        }

        .mem-searchRow button {
          border: none;
          background: #111827;
          color: #ffffff;
          border-radius: 999px;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .mem-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mem-suggestions button {
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          color: #475569;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .mem-suggestions button:hover {
          background: #ffffff;
          color: #111827;
          border-color: #cbd5e1;
        }

        .mem-answer {
          display: grid;
          gap: 8px;
        }

        .mem-query {
          margin: 0 0 0 4px;
          color: #64748b;
          font-size: 13px;
        }

        .mem-answerCard {
          display: grid;
          gap: 14px;
        }

        .mem-answerTop {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .mem-answerIcon {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .mem-answerTop span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 900;
          text-transform: capitalize;
        }

        .mem-answerTop h2 {
          margin: 2px 0 0;
          color: #111827;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .mem-answerCard h3 {
          margin: 0;
          color: #111827;
          font-size: 17px;
        }

        .mem-answerList {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
        }

        .mem-answerList p {
          margin: 0;
          color: #111827;
          font-size: 15px;
          line-height: 1.65;
        }

        .mem-answerList p + p {
          margin-top: 12px;
        }

.mem-footer {
  margin: 0;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}

.assistant-sectionPageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.assistant-sectionDesktopSwitcher {
  flex: 0 0 auto;
}

@media (max-width: 900px) {
  .assistant-sectionDesktopSwitcher {
    display: none;
  }
}

        @media (max-width: 900px) {
          .db-pageStack.mem-page {
            padding: 0 12px 24px;
          }

          .mem-searchRow {
            grid-template-columns: 1fr;
          }

          .mem-searchRow button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}