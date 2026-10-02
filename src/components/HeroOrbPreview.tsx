// src/components/HeroOrbPreview.tsx

"use client";

import { Orb } from "@/components/Orb";

type Props = {
  onPenClick: () => void;
  onMicClick: () => void;
};

export default function HeroOrbPreview({ onPenClick, onMicClick }: Props) {
  return (
    <div className="hero-right">
      <div className="hero-orb hero-orb-float">
        <Orb state="idle" tiltX={0} tiltY={0} />
      </div>

      <div className="hero-controls">
        <button
          className="orb-btn"
          aria-label="Open chat demo"
          type="button"
          onClick={onPenClick}
        >
          <svg
            viewBox="0 0 24 24"
            className="hero-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>

        <button
          className="orb-btn"
          aria-label="Open voice demo"
          type="button"
          onClick={onMicClick}
        >
          <svg
            viewBox="0 0 24 24"
            className="hero-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v4" />
          </svg>
        </button>
      </div>
    </div>
  );
}