// src/app/api/apple/notifications/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  NotificationTypeV2,
  Status,
  Subtype,
} from "@apple/app-store-server-library";

import {
  verifyAppleNotificationRenewalInfo,
  verifyAppleNotificationTransaction,
  verifyAppleServerNotification,
} from "@/lib/apple/verifyTransaction";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const signedPayload =
      typeof body?.signedPayload === "string" ? body.signedPayload : null;

    if (!signedPayload) {
      return NextResponse.json(
        { ok: false, error: "Missing signedPayload." },
        { status: 400 },
      );
    }

    const notification = await verifyAppleServerNotification(signedPayload);

    const data = notification.data;

    if (!data) {
      return NextResponse.json({ ok: true });
    }

    const signedTransactionInfo = data.signedTransactionInfo;

    if (!signedTransactionInfo) {
      return NextResponse.json({ ok: true });
    }

    if (!data.environment) {
      throw new Error("Apple notification is missing its environment.");
    }

    const notificationType = notification.notificationType;
    const subtype = notification.subtype;

    const status = data.status;

    const validStatuses = new Set<number>([
      Status.ACTIVE,
      Status.EXPIRED,
      Status.BILLING_RETRY,
      Status.BILLING_GRACE_PERIOD,
      Status.REVOKED,
    ]);

    if (typeof status !== "number" || !validStatuses.has(status)) {
      throw new Error(
        "Apple notification contains an unsupported subscription status.",
      );
    }

    const changesCurrentEntitlement =
      notificationType === NotificationTypeV2.SUBSCRIBED ||
      notificationType === NotificationTypeV2.DID_RENEW ||
      notificationType === NotificationTypeV2.EXPIRED ||
      notificationType === NotificationTypeV2.DID_FAIL_TO_RENEW ||
      notificationType === NotificationTypeV2.GRACE_PERIOD_EXPIRED ||
      notificationType === NotificationTypeV2.REFUND ||
      notificationType === NotificationTypeV2.REVOKE ||
      notificationType === NotificationTypeV2.REFUND_REVERSED ||
      notificationType === NotificationTypeV2.RENEWAL_EXTENDED ||
      (notificationType === NotificationTypeV2.DID_CHANGE_RENEWAL_PREF &&
        subtype === Subtype.UPGRADE) ||
      (notificationType === NotificationTypeV2.OFFER_REDEEMED &&
        subtype === Subtype.UPGRADE);

    if (!changesCurrentEntitlement) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const transaction = await verifyAppleNotificationTransaction(
      signedTransactionInfo,
      data.environment,
    );

    if (transaction.isUpgraded) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: "superseded_by_upgrade",
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        appleOriginalTransactionId: transaction.originalTransactionId,
      },
      select: {
        id: true,
        appleLastNotificationAt: true,
      },
    });

    if (!tenant) {
      console.warn(
        "Apple notification has no linked tenant:",
        transaction.originalTransactionId,
      );

      return NextResponse.json({
        ok: true,
        linked: false,
      });
    }

    const signedDate = notification.signedDate;

    if (typeof signedDate !== "number") {
      throw new Error("Apple notification is missing its signed date.");
    }

    const notificationSignedAt = new Date(signedDate);

    if (Number.isNaN(notificationSignedAt.getTime())) {
      throw new Error("Apple notification has an invalid signed date.");
    }

    if (
      tenant.appleLastNotificationAt &&
      notificationSignedAt <= tenant.appleLastNotificationAt
    ) {
      return NextResponse.json({
        ok: true,
        linked: true,
        stale: true,
      });
    }

    let appleCurrentPeriodEnd =
      notificationType === NotificationTypeV2.REFUND_REVERSED
        ? transaction.expiresAt
        : (transaction.revokedAt ?? transaction.expiresAt);

    if (status === Status.BILLING_GRACE_PERIOD) {
      const signedRenewalInfo = data.signedRenewalInfo;

      if (!signedRenewalInfo) {
        throw new Error(
          "Apple grace-period notification is missing renewal information.",
        );
      }

      const renewalInfo = await verifyAppleNotificationRenewalInfo(
        signedRenewalInfo,
        data.environment,
      );

      const gracePeriodExpiresDate = renewalInfo.gracePeriodExpiresDate;

      if (typeof gracePeriodExpiresDate !== "number") {
        throw new Error(
          "Apple grace-period notification is missing its expiration date.",
        );
      }

      const gracePeriodExpiresAt = new Date(gracePeriodExpiresDate);

      if (Number.isNaN(gracePeriodExpiresAt.getTime())) {
        throw new Error(
          "Apple grace-period notification has an invalid expiration date.",
        );
      }

      appleCurrentPeriodEnd = gracePeriodExpiresAt;
    }

    const updateResult = await prisma.tenant.updateMany({
      where: {
        id: tenant.id,
        OR: [
          {
            appleLastNotificationAt: null,
          },
          {
            appleLastNotificationAt: {
              lt: notificationSignedAt,
            },
          },
        ],
      },
      data: {
        billingPlan: transaction.plan,
        billingInterval: "monthly",
        appleProductId: transaction.productId,
        appleCurrentPeriodEnd,
        appleLastNotificationAt: notificationSignedAt,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({
        ok: true,
        linked: true,
        stale: true,
      });
    }

    return NextResponse.json({
      ok: true,
      linked: true,
      stale: false,
    });
  } catch (error) {
    console.error("Apple server notification verification failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Apple notification verification failed.",
      },
      { status: 400 },
    );
  }
}
