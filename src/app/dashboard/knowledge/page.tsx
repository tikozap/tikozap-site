// src/app/dashboard/knowledge/page.tsx

"use client";

import { useEffect, useState } from "react";
import MobilePageHeader from "../_components/MobilePageHeader";

type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadKnowledge() {
    try {
      setLoading(true);

      const res = await fetch("/api/knowledge", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data?.ok) return;

      if (Array.isArray(data.docs) && data.docs.length > 0) {
        setDocs(data.docs);
        return;
      }

      const starterDocs = (data.defaults || []).map((title: string) => ({
        id: "",
        title,
        content: "",
        updatedAt: "",
      }));

      setDocs(starterDocs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function saveDoc(doc: KnowledgeDoc) {
    try {
      setSaving(true);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doc),
      });

      const data = await res.json();

      if (!data?.ok) {
        alert(data?.error || "Failed to save");
        return;
      }

      setDocs((prev) =>
        prev.map((d) =>
          d.title === doc.title
            ? {
                ...d,
                ...data.doc,
              }
            : d
        )
      );
    } finally {
      setSaving(false);
    }
  }

function isSizingDoc(title: string) {
  const s = title.toLowerCase();
  return s.includes("siz") || s.includes("fit") || s.includes("measurement");
}

async function uploadKnowledgeFile(file: File, idx: number) {
  const text = await file.text();

  setDocs((prev) =>
    prev.map((d, i) =>
      i === idx
        ? {
            ...d,
            content: `${d.content ? d.content + "\n\n" : ""}Uploaded file: ${file.name}\n\n${text}`,
          }
        : d
    )
  );
}

  if (loading) {
    return (
      <div className="db-container">
        <div className="db-pageStack">
          <h1 className="db-title">Knowledge</h1>
          <p className="db-sub">Loading knowledge…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-container">
      <div className="db-pageStack">
        <MobilePageHeader title="Knowledge" />

        <div>
          <h1 className="db-title">Knowledge</h1>
          <p className="db-sub">
            Teach your assistant how your store works.
          </p>
        </div>

        <div className="db-knowledgeGrid">
          {docs.map((doc, idx) => (
            <section key={`${doc.title}-${idx}`} className="db-card">
              <div className="db-cardHead">
                <div>
                  <h3 className="db-cardTitle">{doc.title}</h3>

                  <p className="db-cardText">
                    Information your assistant can use in replies.
                  </p>
                </div>

                <button
                  className="db-btn primary"
                  disabled={saving}
                  onClick={() => saveDoc(doc)}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

{isSizingDoc(doc.title) ? (
  <div className="db-uploadBox">
    <div>
      <strong>Upload size chart or measurement guide</strong>
      <p>
        Upload a text, CSV, or markdown file, or paste your chart below.
      </p>
    </div>

    <label className="db-btn" style={{ width: "fit-content" }}>
      Choose file
      <input
        type="file"
        accept=".txt,.csv,.md,text/plain,text/csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          uploadKnowledgeFile(file, idx);
          e.currentTarget.value = "";
        }}
      />
    </label>
  </div>
) : null}

              <textarea
                className="db-knowledgeTextarea"
                value={doc.content}
                placeholder={`Add ${doc.title.toLowerCase()} here...`}
                onChange={(e) => {
                  const value = e.target.value;

                  setDocs((prev) =>
                    prev.map((d, i) =>
                      i === idx
                        ? {
                            ...d,
                            content: value,
                          }
                        : d
                    )
                  );
                }}
              />
            </section>
          ))}
        </div>
      </div>

      <style jsx>{`
        .db-knowledgeGrid {
          display: grid;
          gap: 16px;
        }

        .db-cardHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .db-knowledgeTextarea {
          width: 100%;
          min-height: 180px;
          resize: vertical;
          border-radius: 14px;
          border: 1px solid #dbe3ea;
          padding: 14px;
          font-size: 14px;
          line-height: 1.5;
          background: white;
          color: #111827;
        }

        .db-knowledgeTextarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12);
        }

        .db-uploadBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 12px;
}

.db-uploadBox p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}
      `}</style>
    </div>
  );
}