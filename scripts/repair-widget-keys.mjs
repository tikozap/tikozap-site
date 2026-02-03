import { prisma } from "../src/lib/prisma.js";
import crypto from "crypto";

function newWidgetPublicKey() {
  return "tz_" + crypto.randomUUID().replace(/-/g, "");
}

function isTzWidgetKey(k) {
  return /^tz_[0-9a-f]{32}$/i.test(String(k || ""));
}

const isProd = process.env.NODE_ENV === "production";

async function main() {
  const widgets = await prisma.widget.findMany({
    select: { tenantId: true, publicKey: true, installedAt: true },
  });

  let changed = 0;

  for (const w of widgets) {
    const canRotate = !isProd || !w.installedAt;
    if (!isTzWidgetKey(w.publicKey) && canRotate) {
      await prisma.widget.update({
        where: { tenantId: w.tenantId },
        data: { publicKey: newWidgetPublicKey() },
      });
      changed++;
    }
  }

  console.log("Repaired widgets:", changed);
}

main().finally(() => prisma.$disconnect());
