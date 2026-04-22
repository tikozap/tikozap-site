// src/app/api/design-partner/rollout/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";

export const runtime = "nodejs";

type RolloutItem = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  done: boolean;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();

let items: RolloutItem[] = [
  {
    id: "rollout-1",
    key: "install-widget",
    title: "Install storefront widget",
    description: "Enable the chat widget on the storefront.",
    done: true,
    owner: "Kevin",
    notes: null,
    updatedAt: nowIso(),
  },
  {
    id: "rollout-2",
    key: "seed-knowledge",
    title: "Seed returns and shipping knowledge",
    description: "Add return, shipping, and sizing basics.",
    done: true,
    owner: "Kevin",
    notes: null,
    updatedAt: nowIso(),
  },
  {
    id: "rollout-3",
    key: "test-sales-flow",
    title: "Test product recommendation flow",
    description: "Verify Tiko can recommend products in demo mode.",
    done: false,
    owner: "",
    notes: null,
    updatedAt: nowIso(),
  },
  {
    id: "rollout-4",
    key: "review-inbox",
    title: "Review inbox handoff flow",
    description: "Confirm staff takeover and reply workflow.",
    done: false,
    owner: "",
    notes: null,
    updatedAt: nowIso(),
  },
];

function buildStatus() {
  const completedCount = items.filter((item) => item.done).length;
  const totalCount = items.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    items,
    completedCount,
    totalCount,
    completionPct,
  };
}

export async function GET() {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    status: buildStatus(),
  });
}

export async function POST(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const done = typeof body.done === "boolean" ? body.done : undefined;
  const owner = typeof body.owner === "string" ? body.owner : undefined;

  items = items.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      done: done ?? item.done,
      owner: owner !== undefined ? owner : item.owner,
      updatedAt: nowIso(),
    };
  });

  return NextResponse.json({
    ok: true,
    status: buildStatus(),
  });
}