'use client';

type Props = {
  tags: string[];
  tagDraft: string;
  onTagDraftChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
};

export default function TagEditor({ tags, tagDraft, onTagDraftChange, onAdd, onRemove }: Props) {
  return (
    <div className="cx-tagRow">
      {tags.map((t) => (
        <span className="cx-chip" key={t}>
          {t}
          <button onClick={() => onRemove(t)} aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}

      <input
        className="cx-tagInput"
        value={tagDraft}
        onChange={(e) => onTagDraftChange(e.target.value)}
        placeholder="Add tag…"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <button className="db-btn" onClick={onAdd}>
        Add
      </button>
    </div>
  );
}
