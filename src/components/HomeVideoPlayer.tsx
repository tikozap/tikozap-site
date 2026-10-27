// src/components/HomeVideoPlayer.tsx

"use client";

import { useEffect, useState } from "react";

export default function HomeVideoPlayer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="hero-video-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">▶</span>
        <span>Video - TikoZap in Action</span>
        <span className="hero-video-duration">1:34</span>
      </button>

      {open && (
        <div
          className="tz-video-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="tz-video-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Watch TikoZap in Action"
          >
            <button
              type="button"
              className="tz-video-close"
              onClick={() => setOpen(false)}
              aria-label="Close video"
            >
              ×
            </button>

            <video
              controls
              playsInline
              autoPlay
              preload="metadata"
              poster="/videos/TikoZap_Video_Thumbnail.png"
            >
              <source
                src="/videos/TikoZap_Final.mp4"
                type="video/mp4"
              />
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      <style jsx>{`
        .hero-video-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          align-self: center;
          margin-top: 24px;
          padding: 8px 4px;
          border: 0;
          background: transparent;
          color: #2563eb;
          font: inherit;
          font-size: 17px;
          font-weight: 650;
          cursor: pointer;
        }

        .hero-video-trigger:hover {
          color: #1d4ed8;
        }

        .hero-video-trigger:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 4px;
          border-radius: 6px;
        }

        .hero-video-trigger > span:first-child {
  font-size: 20px;
  line-height: 1;
}

        .hero-video-duration {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }

        .tz-video-backdrop {
          position: fixed;
          inset: 0;
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.82);
        }

        .tz-video-dialog {
          position: relative;
          width: min(100%, 1100px);
          background: #000;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        }

        video {
          display: block;
          width: 100%;
          height: auto;
          max-height: 85dvh;
          aspect-ratio: 16 / 9;
          object-fit: contain;
        }

.tz-video-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;
  flex: 0 0 30px;
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  height: 30px;
  min-height: 30px;
  max-height: 30px;

  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;

  background: rgba(0, 0, 0, 0.65);
  color: #fff;

  font-family: Arial, sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 1;

  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

        @media (max-width: 520px) {
          .tz-video-backdrop {
            padding: 12px;
          }

          .tz-video-dialog {
            border-radius: 10px;
          }

          .tz-video-close {
  top: 5px;
  right: 6px;
  width: 24px;
  min-width: 24px;
  max-width: 24px;
  height: 24px;
  min-height: 24px;
  max-height: 24px;
  flex-basis: 24px;
  font-size: 19px;
}
        }
      `}</style>
    </>
  );
}