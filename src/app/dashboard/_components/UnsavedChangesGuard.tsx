// src/app/dashboard/_components/UnsavedChangesGuard.tsx

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  hasUnsavedChanges: boolean;
  onSave: () => Promise<boolean>;
};

export default function UnsavedChangesGuard({
  hasUnsavedChanges,
  onSave,
}: Props) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const allowNavigationRef = useRef(false);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleClick = (event: MouseEvent) => {
      if (allowNavigationRef.current) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      if (!href || !href.startsWith("/dashboard")) return;

      if (
        anchor.getAttribute("target") === "_blank" ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setPendingHref(href);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [hasUnsavedChanges]);

  if (!pendingHref) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(15, 23, 42, 0.42)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        style={{
          width: "min(440px, 100%)",
          background: "#ffffff",
          borderRadius: 18,
          padding: 22,
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
        }}
      >
        <h2
          id="unsaved-changes-title"
          style={{
            margin: 0,
            color: "#111827",
            fontSize: 18,
          }}
        >
          You have unsaved changes.
        </h2>

        <p
          style={{
            margin: "8px 0 20px",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Save your changes before leaving?
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setPendingHref(null)}
            disabled={saving}
            style={secondaryButtonStyle}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              const href = pendingHref;
              allowNavigationRef.current = true;
              window.location.href = href;
            }}
            disabled={saving}
            style={secondaryButtonStyle}
          >
            Leave without saving
          </button>

          <button
            type="button"
            onClick={async () => {
              const href = pendingHref;

              setSaving(true);

              try {
                const saved = await onSave();

                if (!saved) return;

                allowNavigationRef.current = true;
                window.location.href = href;
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            style={primaryButtonStyle}
          >
            {saving ? "Saving..." : "Save & leave"}
          </button>
        </div>
      </div>
    </div>
  );
}

const secondaryButtonStyle = {
  minHeight: 40,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#ffffff",
  color: "#374151",
  padding: "0 13px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  ...secondaryButtonStyle,
  border: "1px solid #111827",
  background: "#111827",
  color: "#ffffff",
} as const;