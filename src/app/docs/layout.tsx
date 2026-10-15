import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TikoZap Help Center & Documentation",
  description:
    "Learn how to set up, use, coach, and manage your TikoZap AI employee with guides and product documentation.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
