import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

// TODO: replace with your auth
async function requireOwnerId() {
  const ownerId = process.env.DEV_OWNER_ID;
  if (!ownerId) throw new Error("Set DEV_OWNER_ID or wire auth.");
  return ownerId;
}

export async function GET() {
  const ownerId = await requireOwnerId();
  const store = await prisma.store.findFirst({ where: { ownerId } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const channel = await prisma.channel.findFirst({
    where: { storeId: store.id, type: "STARTER_LINK" },
    select: { slug: true },
  });
  if (!channel?.slug) return NextResponse.json({ error: "No link" }, { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/l/${channel.slug}`;
  const png = await QRCode.toBuffer(url, { width: 600, margin: 1 });

  return new NextResponse(png, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="tikozap-qr.png"`,
      "Cache-Control": "no-store",
    },
  });
}
