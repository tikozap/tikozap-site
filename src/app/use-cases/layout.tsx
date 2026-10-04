import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Customer Service Use Cases | TikoZap",
  description:
    "See how online stores use TikoZap as an AI employee for product questions, shipping, returns, customer support, Shopify storefronts, and more.",
};

export default function UseCasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
