import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const channel = await prisma.channel.findFirst({
    where: { slug: params.slug, type: "STARTER_LINK", published: true },
    select: {
      slug: true,
      title: true,
      tagline: true,
      logoUrl: true,
      phone: true,
      address: true,
      city: true,
      hoursJson: true,
      buttons: true,
      greeting: true,
    },
  });

  if (!channel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ channel });
}
