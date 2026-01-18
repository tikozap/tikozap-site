// src/app/dashboard/knowledge/page.tsx
import KnowledgeEditor from '@/app/_components/KnowledgeEditor';

export default function KnowledgePage() {
  return (
    <div>
      <h1 className="db-title">Knowledge</h1>
      <p className="db-sub">Edit your store policies and FAQs (used by the assistant).</p>

      <KnowledgeEditor />
    </div>
  );
}
