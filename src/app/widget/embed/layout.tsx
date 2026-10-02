// src/app/widget/embed/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WidgetEmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}