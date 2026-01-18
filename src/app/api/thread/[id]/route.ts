import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const thread = await prisma.thread.findFirst({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}
