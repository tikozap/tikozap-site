import type { Metadata } from "next";
import "./guides.css";

export const metadata: Metadata = {
  title: "TikoZap Guides | AI Customer Service for Small Businesses",
  description:
    "Practical guides for small businesses exploring AI customer service, AI assistants, customer support, human takeover, and more.",
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
