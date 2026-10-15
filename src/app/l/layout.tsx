// src/app/l/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "#fff" }}>{children}</div>;
}