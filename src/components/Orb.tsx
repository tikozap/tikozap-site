// src/components/Orb.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type OrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "sad"
  | "happy";

type OrbProps = {
  state: OrbState;
  tiltX?: number;
  tiltY?: number;
  blink?: boolean;
  expression?: "neutral" | "thinking" | "smile" | "concern";
};

export function Orb({
  state,
  tiltX = 0,
  tiltY = 0,
  blink = false,
  expression = "neutral",
}: OrbProps) {
  const [autoBlink, setAutoBlink] = useState(false);
  const [driftX, setDriftX] = useState(0);
  const [driftY, setDriftY] = useState(0);

  const shouldAnimate = state !== "sad";

  useEffect(() => {
    if (!shouldAnimate) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    function scheduleBlink() {
      const delay = 2200 + Math.random() * 3200;

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setAutoBlink(true);

        window.setTimeout(() => {
          if (!cancelled) setAutoBlink(false);
          if (!cancelled) scheduleBlink();
        }, 120);
      }, delay);
    }

    scheduleBlink();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    function scheduleDrift() {
      const nextX =
        state === "listening"
          ? 2 + Math.random() * 4
          : state === "thinking"
          ? -3 - Math.random() * 3
          : state === "speaking"
          ? -1 + Math.random() * 2
          : -2 + Math.random() * 4;

      const nextY =
        state === "thinking"
          ? -2 - Math.random() * 2
          : state === "listening"
          ? -1 + Math.random() * 2
          : state === "speaking"
          ? -1 + Math.random() * 2
          : -1 + Math.random() * 2;

      setDriftX(nextX);
      setDriftY(nextY);

      timeoutId = window.setTimeout(scheduleDrift, 1600 + Math.random() * 2200);
    }

    scheduleDrift();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [state, shouldAnimate]);

  const resolvedExpression = useMemo(() => {
    if (state === "sad") return "concern";
    if (state === "speaking") return "smile";
    if (state === "thinking") return "thinking";
    return expression;
  }, [state, expression]);

  return (
    <div
      className={`tz-orbSvgWrap tz-${state} tz-exp-${resolvedExpression} ${
        blink || autoBlink ? "tz-forceBlink" : ""
      }`}
      aria-label="tikozap orb"
      style={
        {
          "--tz-tilt-x": `${tiltX + driftY}deg`,
          "--tz-tilt-y": `${tiltY + driftX}deg`,
        } as React.CSSProperties
      }
    >
      <img src="/orb-final.png" alt="Tikozap orb" className="tz-orbSvg" />
    </div>
  );
}
