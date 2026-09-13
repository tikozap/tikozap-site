// src/app/s/[slug]/layout.tsx
export const runtime = "nodejs";

export default function StarterLinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {children}
    </div>
  );
}