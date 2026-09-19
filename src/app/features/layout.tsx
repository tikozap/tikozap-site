import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Customer Service Features | TikoZap",
  description:
    "Explore TikoZap features for online stores, including 24/7 customer support, voice, multilingual conversations, human takeover, and continuous learning.",
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
