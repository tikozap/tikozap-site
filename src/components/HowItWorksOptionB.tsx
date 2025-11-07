"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = { title: string; blurb: string };

const SETUP_STEPS: Step[] = [
  { title: "Paste one snippet", blurb: "Install once. No code required." },
  { title: "Choose tone & policies", blurb: "Set voice, returns window, discount caps." },
  { title: "Go live", blurb: "Widget appears instantly on your site." },
];

const CONVO_STEPS: Step[] = [
  { title: "Message in", blurb: "Customer asks anything: orders, returns, specs." },
  { title: "Intent & entities", blurb: "Understands purpose, captures details (e.g., order #1003)." },
  { title: "Retrieve (with citations)", blurb: "Finds Products/Policies/Orders; cites Returns.md §1.2." },
  { title: "Guardrails & action/answer", blurb: "Acts within policy: track order, create RMA, allowed discounts." },
  { title: "Handoff & log", blurb: "Escalates with full context; ticket + SLA + analytics." },
];

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const handler = () => setReduce(!!mq.matches);
    handler();
    mq?.addEventListener?.("change", handler);
    return () => mq?.removeEventListener?.("change", handler);
  }, []);
  return reduce;
}

function Flow({
  label,
  steps,
  autoplayOnce = true,
  intervalMs = 900,
  ctaHref,
  ctaText,
}: {
  label: string;
  steps: Step[];
  autoplayOnce?: boolean;
  intervalMs?: number;
  ctaHref?: string;
  ctaText?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const playedRef = useRef(false);

  // Auto-play once (unless reduced motion)
  useEffect(() => {
    if (reduce || !playing) return;
    if (autoplayOnce && playedRef.current) return;
    const id = setInterval(() => {
      setI((prev) => {
        const next = Math.min(prev + 1, steps.length - 1);
        if (next === steps.length - 1 && autoplayOnce) {
          playedRef.current = true;
          setPlaying(false); // stop on last step
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [reduce, playing, steps.length, intervalMs, autoplayOnce]);

  const progress = useMemo(() => (i / (steps.length - 1)) * 100, [i, steps.length]);

  return (
    <section aria-label={label} className="w-full rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setI((s) => Math.max(0, s - 1))}
            className="px-2.5 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            aria-label="Previous step"
          >
            Prev
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-2.5 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            aria-label={playing ? "Pause animation" : "Play animation"}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setI((s) => Math.min(steps.length - 1, s + 1));
              setPlaying(false);
            }}
            className="px-2.5 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            aria-label="Next step"
          >
            Next
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mt-5">
        <div className="h-1 w-full rounded bg-gray-200" />
        <div
          className="h-1 rounded bg-gray-900 absolute top-0 left-0 motion-safe:transition-all motion-safe:duration-500 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
        <ol className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3 md:grid-cols-5">
          {steps.map((s, idx) => {
            const active = idx <= i;
            return (
              <li key={s.title} className="flex items-start gap-3">
                <div
                  className={[
                    "mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs",
                    active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300",
                  ].join(" ")}
                  aria-current={idx === i ? "step" : undefined}
                >
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.title}</div>
                  <div className="text-[13px] text-gray-600">{s.blurb}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {ctaHref && (
        <div className="mt-5">
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-md border border-gray-900 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            {ctaText ?? "See Live Demo"}
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="inline-block">
              <path d="M13 5l7 7-7 7M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      )}
    </section>
  );
}

export default function HowItWorksOptionB() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <Flow
        label="Setup (60 seconds)"
        steps={SETUP_STEPS}
        autoplayOnce
        intervalMs={900}
        ctaHref="/demo"
        ctaText="See Live Demo"
      />
      <Flow
        label="Every conversation"
        steps={CONVO_STEPS}
        autoplayOnce
        intervalMs={900}
        ctaHref="/demo"
        ctaText="Try it live"
      />
      <p className="text-xs text-gray-500 mt-2">
        Motion auto-plays once and respects your system’s reduced-motion setting.
      </p>
    </div>
  );
}
