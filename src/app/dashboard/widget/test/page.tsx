// src/app/dashboard/widget/test/page.tsx

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { newWidgetPublicKey, isTzWidgetKey } from "@/lib/widgetKey";
import WidgetTestClient from "./widget-test-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WidgetTestPage() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: auth.tenant.id,
    },
    select: {
      id: true,
      storeName: true,
      slug: true,
      widget: {
        select: {
          publicKey: true,
          installedAt: true,
          allowedDomains: true,
        },
      },
    },
  });

  if (!tenant) {
    redirect("/dashboard");
  }

  const widgetRow = tenant.widget
    ? tenant.widget
    : await prisma.widget.create({
        data: {
          tenantId: tenant.id,
          publicKey: newWidgetPublicKey(),
          enabled: true,
        },
        select: {
          publicKey: true,
          installedAt: true,
          allowedDomains: true,
        },
      });

  let widgetPublicKey = widgetRow.publicKey;

  const canRotate =
    process.env.NODE_ENV !== "production" ||
    !widgetRow.installedAt;

  if (!isTzWidgetKey(widgetPublicKey) && canRotate) {
    const rotated = await prisma.widget.update({
      where: {
        tenantId: tenant.id,
      },
      data: {
        publicKey: newWidgetPublicKey(),
      },
      select: {
        publicKey: true,
      },
    });

    widgetPublicKey = rotated.publicKey;
  }

  return (
    <div className="db-container">
      <WidgetTestClient
        widgetPublicKey={widgetPublicKey}
        allowedDomains={widgetRow.allowedDomains || []}
      />
    </div>
  );
}