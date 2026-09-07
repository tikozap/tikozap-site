// src/app/dashboard/knowledge/page.tsx

"use client";

import { useEffect, useState } from "react";
import MobilePageHeader from "../_components/MobilePageHeader";
import ProductKnowledgeCard from "./_components/ProductKnowledgeCard";

type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type ProductKnowledgeRow = {
  id: string;
  product: string;
  notes: string;
  image: string;
};

const PRODUCT_KNOWLEDGE_MARKER = "TIKOZAP_PRODUCT_KNOWLEDGE_V1";

function createProductKnowledgeRow(): ProductKnowledgeRow {
  return {
    id: `pk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
product: "",
notes: "",
image: "",
  };
}

function parseProductKnowledge(content: string): ProductKnowledgeRow[] {
  const trimmed = content.trim();

  if (!trimmed) {
    return [createProductKnowledgeRow()];
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (
      parsed?.type === PRODUCT_KNOWLEDGE_MARKER &&
      Array.isArray(parsed?.rows)
    ) {
      const rows: ProductKnowledgeRow[] = parsed.rows.map((row: any) => ({
        id:
          typeof row?.id === "string" && row.id
            ? row.id
            : createProductKnowledgeRow().id,
product: typeof row?.product === "string" ? row.product : "",
notes: typeof row?.notes === "string" ? row.notes : "",
image: typeof row?.image === "string" ? row.image : "",
      }));

      return rows.length > 0 ? rows : [createProductKnowledgeRow()];
    }
  } catch {
    // Keep older plain-text Product Knowledge usable.
  }

  return [
    {
      ...createProductKnowledgeRow(),
      notes: trimmed,
    },
  ];
}

function serializeProductKnowledge(
  rows: ProductKnowledgeRow[]
): string {
  return JSON.stringify(
    {
      type: PRODUCT_KNOWLEDGE_MARKER,
      rows: rows.map((row) => ({
        id: row.id,
product: row.product.trim(),
notes: row.notes.trim(),
image: row.image,
      })),
    },
    null,
    2
  );
}

function isSizingDoc(title: string) {
  const normalized = title.toLowerCase();

  return (
    normalized.includes("siz") ||
    normalized.includes("fit") ||
    normalized.includes("measurement")
  );
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);

  const [productRows, setProductRows] = useState<ProductKnowledgeRow[]>(
    () => [createProductKnowledgeRow()]
  );


  async function loadKnowledge() {
    try {
      setLoading(true);

      const res = await fetch("/api/knowledge", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to load knowledge.");
        return;
      }

      const nextDocs: KnowledgeDoc[] = Array.isArray(data.docs)
        ? data.docs
        : [];

      const productKnowledgeDoc = nextDocs.find(
        (doc) => doc.title === "Product Knowledge"
      );

      setProductRows(
        parseProductKnowledge(productKnowledgeDoc?.content || "")
      );

      setDocs(nextDocs);
    } catch (error) {
      console.error("[Knowledge] Failed to load knowledge", error);
      alert("Failed to load knowledge.");
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to save.");
        return;
      }

      setDocs((previousDocs) =>
        previousDocs.map((item) =>
          item.title === doc.title
            ? {
                ...item,
                ...data.doc,
              }
            : item
        )
      );
    } catch (error) {
      console.error("[Knowledge] Failed to save document", error);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProductKnowledge(doc: KnowledgeDoc) {
    try {
      setSaving(true);

      const content = serializeProductKnowledge(productRows);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...doc,
          content,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to save product knowledge.");
        return;
      }

      setDocs((previousDocs) =>
        previousDocs.map((item) =>
          item.title === "Product Knowledge"
            ? {
                ...item,
                ...data.doc,
              }
            : item
        )
      );

      alert("Product knowledge saved.");
    } catch (error) {
      console.error(
        "[Knowledge] Failed to save product knowledge",
        error
      );
      alert("Failed to save product knowledge.");
    } finally {
      setSaving(false);
    }
  }

  function addProductRow() {
    setProductRows((rows) => [
      ...rows,
      createProductKnowledgeRow(),
    ]);
  }

  function updateProductRow(
    id: string,
    field: "product" | "notes",
    value: string
  ) {
    setProductRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function removeProductRow(id: string) {
    setProductRows((rows) => {
      const nextRows = rows.filter((row) => row.id !== id);

      return nextRows.length > 0
        ? nextRows
        : [createProductKnowledgeRow()];
    });
  }

  async function extractKnowledgeFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/knowledge/extract", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok || !data?.text) {
    throw new Error(
      data?.error || "This file could not be processed."
    );
  }

  return String(data.text).trim();
}

async function uploadProductKnowledgeFile(file: File) {
  setExtractingFile(true);

  try {
    const isTextFile =
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.type === "text/markdown" ||
      /\.(txt|csv|md)$/i.test(file.name);

    let trimmed = "";
    let image = "";

const isImageFile =
  file.type === "image/jpeg" ||
  file.type === "image/png" ||
  file.type === "image/webp" ||
  /\.(jpe?g|png|webp)$/i.test(file.name);

if (isImageFile) {
  if (file.size > 2 * 1024 * 1024) {
    alert("Product images must be smaller than 2 MB.");
    return;
  }

  image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read product image."));

    reader.readAsDataURL(file);
  });
}

    if (isTextFile) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Text files must be smaller than 2 MB.");
        return;
      }

      trimmed = (await file.text()).trim();
    } else {
      trimmed = await extractKnowledgeFile(file);
    }

    if (!trimmed) {
      alert("This file does not contain readable product information.");
      return;
    }

    setProductRows((rows) => [
      ...rows,
{
  ...createProductKnowledgeRow(),
  product: file.name.replace(/\.[^.]+$/, ""),
  notes: trimmed,
  image,
},
    ]);
  } catch (error) {
    console.error(
      "[Knowledge] Failed to read product knowledge file",
      error instanceof Error ? error.message : "Unknown error"
    );

    alert(
      error instanceof Error
        ? error.message
        : "This file could not be read."
    );
  } finally {
    setExtractingFile(false);
  }
}

async function uploadKnowledgeFile(
  file: File,
  index: number
) {
  try {
    const isTextFile =
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.type === "text/markdown" ||
      /\.(txt|csv|md)$/i.test(file.name);

    let text = "";

    if (isTextFile) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Text files must be smaller than 2 MB.");
        return;
      }

      text = (await file.text()).trim();
    } else {
      text = await extractKnowledgeFile(file);
    }

    if (!text) {
      alert("This file does not contain readable information.");
      return;
    }

    setDocs((previousDocs) =>
      previousDocs.map((doc, docIndex) =>
        docIndex === index
          ? {
              ...doc,
              content: `${
                doc.content
                  ? `${doc.content}\n\n`
                  : ""
              }Uploaded file: ${file.name}\n\n${text}`,
            }
          : doc
      )
    );
  } catch (error) {
    console.error(
      "[Knowledge] Failed to read knowledge file",
      error instanceof Error ? error.message : "Unknown error"
    );

    alert(
      error instanceof Error
        ? error.message
        : "This file could not be read."
    );
  }
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
            Information your assistant needs to know about your business.
          </p>
        </div>

        <div className="db-knowledgeGrid">
          {docs.map((doc, index) => {
            if (doc.title === "Product Knowledge") {
              return (
<ProductKnowledgeCard
  key={`${doc.title}-${index}`}
  doc={doc}
  saving={saving}
  extractingFile={extractingFile}
  productRows={productRows}
  onAddRow={addProductRow}
  onUpdateRow={updateProductRow}
  onRemoveRow={removeProductRow}
  onUploadFile={uploadProductKnowledgeFile}
  onSave={saveProductKnowledge}
/>
              );
            }

            return (
              <section
                key={`${doc.title}-${index}`}
                className="db-card"
                style={{ padding: 0 }}
              >
                <div
                  className="knowledge-rowInner"
                  style={{
                    backgroundColor:
                      index % 2 === 1
                        ? "#eef2f7"
                        : "#ffffff",
                  }}
                >
                  <div className="db-cardHead">
                    <div>
                      <h3 className="db-cardTitle">
                        {doc.title}
                      </h3>

                      <p className="db-cardText">
                        {doc.title === "Special Instructions"
                          ? "Every business has its own way of serving customers. Tell your assistant yours."
                          : "Information your assistant can use in replies."}
                      </p>
                    </div>

                    <button
                      type="button"
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
                        <strong>
                          Upload size chart or measurement guide
                        </strong>

<p>
  Upload PDF, JPG, PNG, WebP, text, CSV, or Markdown,
  or paste your chart below.
</p>
                      </div>

                      <label
                        className="db-btn"
                        style={{ width: "fit-content" }}
                      >
                        Choose file

                        <input
                          type="file"
                          accept=".txt,.csv,.md,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/csv,text/markdown,application/pdf,image/jpeg,image/png,image/webp"
                          style={{ display: "none" }}
                          onChange={(event) => {
                            const file =
                              event.target.files?.[0];

                            if (!file) return;

                            uploadKnowledgeFile(
                              file,
                              index
                            );

                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  ) : null}

                  <textarea
                    className="db-knowledgeTextarea"
                    value={doc.content}
                    placeholder={
doc.title === "Special Instructions"
  ? `Examples:
We accept Apple Pay, PayPal, Visa, Mastercard, and Amex.
Never promise same-day shipping.
If you're unsure, ask for the customer's order number instead of guessing.
Keep answers concise and professional.
Recommend gift wrapping during holidays.`
                        : `Add ${doc.title.toLowerCase()} here...`
                    }
                    onChange={(event) => {
                      const value = event.target.value;

                      setDocs((previousDocs) =>
                        previousDocs.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  content: value,
                                }
                              : item
                        )
                      );
                    }}
                  />
                </div>
              </section>
            );
          })}
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
  box-sizing: border-box;
  resize: vertical;
  border: 1px solid #dbe3ea;
  border-radius: 14px;
  padding: 10px 14px 14px;
  background:
  repeating-linear-gradient(
    to bottom,
    #ffffff 0,
    #ffffff 21px,
    #f8fafc 21px,
    #f8fafc 42px
  );
  background-position-y: 10px;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
}

        .db-knowledgeTextarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .db-uploadBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
        }

        .db-uploadBox p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .knowledge-rowInner {
          border-radius: 16px;
          padding: 20px;
        }

@media (max-width: 760px) {
  .db-knowledgeGrid > .db-card {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
  }

  .knowledge-rowInner {
    padding: 16px;
    border-radius: 14px;
  }

  .db-uploadBox {
    align-items: stretch;
    flex-direction: column;
  }

  .db-uploadBox .db-btn {
    width: 100% !important;
    justify-content: center;
  }
}
      `}</style>
    </div>
  );
}