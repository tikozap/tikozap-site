import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";

// TODO: replace with your auth
async function requireOwnerId() {
  // e.g. from Clerk: auth().userId
  // For now, throw to force wiring later
  const ownerId = process.env.DEV_OWNER_ID;
  if (!ownerId) throw new Error("Set DEV_OWNER_ID for MVP testing or wire auth.");
  return ownerId;
}

const Upsert = z.object({
  title: z.string().min(1).max(80),
  tagline: z.string().max(140).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(60).optional(),
  address: z.string().max(120).optional(),
  greeting: z.string().max(200).optional(),
  buttons: z.array(z.object({ label: z.string().max(24), url: z.string().url() })).max(6).optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const ownerId = await requireOwnerId();

  // Find or create store
  const store =
    (await prisma.store.findFirst({ where: { ownerId } })) ??
    (await prisma.store.create({ data: { ownerId, plan: "STARTER" } }));

  // Find or create STARTER_LINK channel
  const channel =
    (await prisma.channel.findFirst({
      where: { storeId: store.id, type: "STARTER_LINK" },
    })) ??
    (await prisma.channel.create({
      data: {
        storeId: store.id,
        type: "STARTER_LINK",
        slug: `s-${nanoid(8)}`,
        title: store.name ?? "My Business",
        tagline: "Chat with us anytime.",
        greeting: "Hi! How can we help today?",
        buttons: [],
        hoursJson: null,
        published: false,
      },
    }));

  return NextResponse.json({ store, channel });
}

export async function POST(req: Request) {
  const ownerId = await requireOwnerId();
  const body = Upsert.parse(await req.json());

  const store =
    (await prisma.store.findFirst({ where: { ownerId } })) ??
    (await prisma.store.create({ data: { ownerId, plan: "STARTER" } }));

  const channel =
    (await prisma.channel.findFirst({
      where: { storeId: store.id, type: "STARTER_LINK" },
    })) ??
    (await prisma.channel.create({
      data: {
        storeId: store.id,
        type: "STARTER_LINK",
        slug: `s-${nanoid(8)}`,
      },
    }));

  const updated = await prisma.channel.update({
    where: { id: channel.id },
    data: {
      title: body.title,
      tagline: body.tagline ?? null,
      phone: body.phone ?? null,
      city: body.city ?? null,
      address: body.address ?? null,
      greeting: body.greeting ?? null,
      buttons: body.buttons ?? undefined,
      published: body.published ?? undefined,
    },
  });

  return NextResponse.json({ channel: updated });
}
