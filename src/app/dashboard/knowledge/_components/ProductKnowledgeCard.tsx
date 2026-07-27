// src/app/dashboard/knowledge/_components/ProductKnowledgeCard.tsx

"use client";

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
};

type Props = {
  doc: KnowledgeDoc;
  saving: boolean;
  productRows: ProductKnowledgeRow[];
  onAddRow: () => void;
  onUpdateRow: (
    id: string,
    field: "product" | "notes",
    value: string
  ) => void;
  onRemoveRow: (id: string) => void;
  onUploadFile: (file: File) => void;
  onSave: (doc: KnowledgeDoc) => void;
};

export default function ProductKnowledgeCard({
  doc,
  saving,
  productRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onUploadFile,
  onSave,
}: Props) {
  return (
    <section className="db-card" style={{ padding: 0 }}>
      <div className="pk-inner">
        <div className="pk-head">
          <div>
            <h3 className="db-cardTitle">Products</h3>
            <p className="db-cardText">
              Add practical product guidance your assistant can use when
              helping customers.
            </p>
          </div>

          <button
            type="button"
            className="db-btn primary"
            disabled={saving}
            onClick={() => onSave(doc)}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="pk-upload">
          <div>
            <strong>Upload product references</strong>
            <p>
              Add size charts, care instructions, materials, warranties, manuals, or other documents.
            </p>
          </div>

          <label className="db-btn pk-uploadButton">
            Choose file
            <input
              type="file"
              accept=".txt,.csv,.md,text/plain,text/csv,text/markdown"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                onUploadFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <div className="pk-intro">
          <div>
            <strong>Product details</strong>

          </div>

          <button type="button" className="db-btn" onClick={onAddRow}>
            + Add product
          </button>
        </div>

        <div className="pk-table">
          <div className="pk-tableHead">
            <span>Product</span>
            <span>Notes for AI</span>
            <span aria-hidden="true" />
          </div>

          {productRows.map((row) => (
            <div key={row.id} className="pk-row">
              <input
                value={row.product}
                placeholder="Summer Dress"
                onChange={(e) =>
                  onUpdateRow(row.id, "product", e.target.value)
                }
              />

              <textarea
                value={row.notes}
                placeholder="Runs slightly large. Recommend sizing down when the customer is between sizes."
                onChange={(e) =>
                  onUpdateRow(row.id, "notes", e.target.value)
                }
              />

              <button
                type="button"
                className="pk-remove"
                aria-label={`Remove ${row.product || "product"}`}
                onClick={() => onRemoveRow(row.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <p className="pk-hint">
          Useful notes include fit, common questions, ideal use, comparisons,
          limitations, and recommendation guidance.
        </p>
      </div>

      <style jsx>{`
        .pk-inner {
          border-radius: 16px;
          padding: 20px;
          background: #ffffff;
        }

        .pk-head,
        .pk-intro,
        .pk-upload {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .pk-head {
          margin-bottom: 14px;
        }

        .pk-upload {
          align-items: center;
          padding: 12px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
        }

        .pk-upload p,
        .pk-intro p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .pk-uploadButton {
          width: fit-content;
          flex: 0 0 auto;
        }

        .pk-intro {
          margin-bottom: 12px;
        }

        .pk-table {
          overflow: hidden;
          border: 1px solid #dbe3ea;
          border-radius: 14px;
          background: #ffffff;
        }

        .pk-tableHead,
        .pk-row {
          display: grid;
          grid-template-columns:
            minmax(150px, 0.7fr)
            minmax(260px, 1.5fr)
            38px;
          gap: 10px;
          align-items: start;
        }

        .pk-tableHead {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          font-weight: 800;
        }

        .pk-row {
          padding: 10px 12px;
          border-bottom: 1px solid #eef2f7;
        }

        .pk-row:last-child {
          border-bottom: none;
        }

        .pk-row input,
        .pk-row textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 11px;
          border: 1px solid #dbe3ea;
          border-radius: 10px;
          background: #ffffff;
          color: #111827;
          font: inherit;
          font-size: 13px;
          line-height: 1.45;
          outline: none;
        }

        .pk-row textarea {
          min-height: 76px;
          resize: vertical;
        }

        .pk-row input:focus,
        .pk-row textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .pk-remove {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: #94a3b8;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .pk-remove:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .pk-hint {
          margin: 10px 2px 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 760px) {
          .pk-head,
          .pk-intro,
          .pk-upload {
            align-items: stretch;
            flex-direction: column;
          }

          .pk-uploadButton,
          .pk-intro .db-btn {
            width: 100%;
            justify-content: center;
          }

          .pk-tableHead {
            display: none;
          }

          .pk-row {
            grid-template-columns: 1fr 34px;
          }

          .pk-row input,
          .pk-row textarea {
            grid-column: 1;
          }

          .pk-remove {
            grid-column: 2;
            grid-row: 1;
          }
        }
      `}</style>
    </section>
  );
}