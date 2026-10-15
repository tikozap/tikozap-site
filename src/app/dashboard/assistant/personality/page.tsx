// src/app/dashboard/assistant/personality/page.tsx

'use client';

import { useEffect, useState } from 'react';
import MobilePageHeader from '../../_components/MobilePageHeader';

const DEFAULTS = {
  tz_ai_tone: 'Friendly',
  tz_ai_response_style: 'Concise',
  tz_ai_product_behavior: 'Balanced',
  tz_voice_response_style: 'Short & concise',
  tz_assistant_greeting:
    "Hi! I'm here if you need help with products, orders, shipping, or returns.",
};

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="personality-field">
      <div className="personality-label">{label}</div>
      <div className="personality-choiceRow">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`personality-choice ${value === opt ? 'active' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AssistantPersonalityPage() {
  const [tone, setTone] = useState(DEFAULTS.tz_ai_tone);
  const [responseStyle, setResponseStyle] = useState(DEFAULTS.tz_ai_response_style);
  const [salesStyle, setSalesStyle] = useState(DEFAULTS.tz_ai_product_behavior);
  const [voiceStyle, setVoiceStyle] = useState(DEFAULTS.tz_voice_response_style);
  const [greeting, setGreeting] = useState(DEFAULTS.tz_assistant_greeting);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const settings = data?.settings || {};

        setTone(settings.tz_ai_tone || DEFAULTS.tz_ai_tone);
        setResponseStyle(settings.tz_ai_response_style || DEFAULTS.tz_ai_response_style);
        setSalesStyle(settings.tz_ai_product_behavior || DEFAULTS.tz_ai_product_behavior);
        setVoiceStyle(settings.tz_voice_response_style || DEFAULTS.tz_voice_response_style);
        setGreeting(settings.tz_assistant_greeting || DEFAULTS.tz_assistant_greeting);
      })
      .catch(() => {});
  }, []);

  async function savePersonality() {
    setSaving(true);

    try {
      const raw = localStorage.getItem('tz_settings_cache');
      const cached = raw ? JSON.parse(raw) : {};

      const nextSettings = {
        ...cached,
        tz_ai_tone: tone,
        tz_ai_response_style: responseStyle,
        tz_ai_product_behavior: salesStyle,
        tz_voice_response_style: voiceStyle,
        tz_assistant_greeting: greeting,
      };

      localStorage.setItem('tz_settings_cache', JSON.stringify(nextSettings));

      Object.entries(nextSettings).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: nextSettings }),
      });

      window.dispatchEvent(new Event('tz-settings-change'));
      alert('Personality saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="db-container">
      <MobilePageHeader title="Personality" />

      <div className="db-pageStack">
        <div className="personality-hero">
          <div>
            <h1 className="db-title">Personality</h1>
            <p className="db-sub">
              Describe your best employee. Tiko will use that style when helping customers.
            </p>
          </div>
        </div>

        <section className="personality-principle">
          Never ask merchants to configure AI. Ask them to describe their best employee.
        </section>

        <div className="personality-grid">
          <section className="personality-card">
            <h2>Communication</h2>

            <Choice
              label="Tone"
              value={tone}
              options={['Friendly', 'Professional', 'Luxury boutique', 'Fast & concise']}
              onChange={setTone}
            />

            <Choice
              label="Response length"
              value={responseStyle}
              options={['Very short', 'Concise', 'Natural', 'Detailed when helpful']}
              onChange={setResponseStyle}
            />

            <label className="personality-field">
              <span className="personality-label">Greeting</span>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi! I'm here if you need help with products, orders, shipping, or returns."
              />
            </label>
          </section>

          <section className="personality-card">
            <h2>Sales & Voice</h2>

            <Choice
              label="Selling style"
              value={salesStyle}
              options={['Helpful only', 'Balanced', 'Proactively recommend products']}
              onChange={setSalesStyle}
            />

            <Choice
              label="Voice response style"
              value={voiceStyle}
              options={['Short & concise', 'Natural conversation', 'Detailed & supportive']}
              onChange={setVoiceStyle}
            />

            <div className="personality-preview">
              <strong>Preview</strong>
              <p>{greeting}</p>
              <p>
                Sure — I can help with that. I’ll keep the answer {responseStyle.toLowerCase()} and use a {tone.toLowerCase()} tone.
              </p>
            </div>
          </section>
        </div>

        <button type="button" className="personality-save" onClick={savePersonality}>
          {saving ? 'Saving...' : 'Save Personality'}
        </button>
      </div>

      <style jsx>{`
        .personality-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .personality-principle {
          background: #111827;
          color: #ffffff;
          border-radius: 20px;
          padding: 18px 20px;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.4;
        }

        .personality-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .personality-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 18px;
          display: grid;
          gap: 16px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }

        .personality-card h2 {
          margin: 0;
          font-size: 18px;
          color: #111827;
        }

        .personality-field {
          display: grid;
          gap: 8px;
        }

        .personality-label {
          font-size: 12px;
          font-weight: 900;
          color: #475569;
        }

        .personality-choiceRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .personality-choice {
          border: 1px solid #d1d5db;
          background: #ffffff;
          border-radius: 999px;
          padding: 9px 13px;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .personality-choice.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        textarea {
          width: 100%;
          min-height: 96px;
          resize: vertical;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 12px;
          font-size: 14px;
          color: #111827;
          box-sizing: border-box;
        }

        .personality-preview {
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          border-radius: 16px;
          padding: 14px;
          display: grid;
          gap: 8px;
        }

        .personality-preview strong {
          color: #111827;
          font-size: 13px;
        }

        .personality-preview p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .personality-save {
          width: fit-content;
          border: none;
          background: #111827;
          color: #ffffff;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .db-pageStack {
            padding: 0 12px 24px;
          }

          .personality-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}