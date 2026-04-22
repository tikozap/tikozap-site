// src/app/s/[slug]/page.tsx
import { redirect } from "next/navigation";

export default function Page({ params }: { params: { slug: string } }) {
  redirect(`/l/${params.slug}`);
}