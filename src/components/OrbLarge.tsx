// src/components/OrbLarge.tsx

"use client";

import { useEffect, useState } from "react";

type OrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "sad"
  | "happy";

type OrbSize = "homepage" | "chat";

type Props = {
  state?: OrbState;
  size?: OrbSize;
};

export function OrbLarge({
  state = "idle",
  size = "chat",
}: Props) {
  const [autoBlink, setAutoBlink] = useState(false);

  const [driftX, setDriftX] = useState(0);
  const [driftY, setDriftY] = useState(0);

  useEffect(() => {
    if (state === "sad") return;

    let timeoutId: number | null = null;
    let cancelled = false;

    function scheduleBlink() {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        setAutoBlink(true);

        window.setTimeout(() => {
          if (!cancelled) setAutoBlink(false);
          if (!cancelled) scheduleBlink();
        }, 140);
      }, 2400 + Math.random() * 3400);
    }

    scheduleBlink();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state]);

  useEffect(() => {
    if (state === "sad") return;

    let timeoutId: number | null = null;
    let cancelled = false;

    function scheduleDrift() {
      const nextX =
        state === "listening"
          ? 3 + Math.random() * 5
          : state === "thinking"
            ? -4 - Math.random() * 4
            : state === "speaking"
              ? -2 + Math.random() * 4
              : -3 + Math.random() * 6;

      const nextY =
        state === "thinking"
          ? -3 - Math.random() * 2
          : state === "listening"
            ? -1 + Math.random() * 2
            : state === "speaking"
              ? -1 + Math.random() * 2
              : -1 + Math.random() * 2;

      setDriftX(nextX);
      setDriftY(nextY);

      timeoutId = window.setTimeout(
        scheduleDrift,
        1800 + Math.random() * 2400
      );
    }

    scheduleDrift();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state]);

  const dimension =
    size === "homepage"
      ? 210
      : 150;

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        width: dimension,
        height: dimension,
      }}
    >
      <div
        className={`tz-orbLargeWrap tz-${state} ${
          autoBlink ? "tz-forceBlink" : ""
        }`}
        style={
          {
            width: dimension,
            height: dimension,
            "--tz-tilt-x": `${driftY}deg`,
            "--tz-tilt-y": `${driftX}deg`,
            "--tz-shift-x": `${driftX}px`,
            "--tz-shift-y": `${driftY}px`,
          } as React.CSSProperties
        }
      >
        <img
          src="/orb-final.png"
          alt="TikoZap orb"
          className="tz-orbLargeImg"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}