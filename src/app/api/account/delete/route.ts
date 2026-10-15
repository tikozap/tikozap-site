// src/app/api/account/delete/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/security/requireSameOrigin";

export const runtime = "nodejs";

function isStripeResourceMissing(error: any) {
  return error?.code === "resource_missing";
}

async function cancelStripeSubscription(
  subscriptionId: string | null | undefined
) {
  const id = String(subscriptionId || "").trim();

  if (!id) return;

  const stripe = getStripe();

  try {
    const subscription = await stripe.subscriptions.retrieve(id);

    if (subscription.status !== "canceled") {
      await stripe.subscriptions.cancel(id);
    }
  } catch (error: any) {
    // If Stripe says the subscription no longer exists,
    // there is nothing left to cancel.
    if (isStripeResourceMissing(error)) {
      return;
    }

    throw error;
  }
}

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request origin.",
      },
      {
        status: 403,
      }
    );
  }

  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id || !auth?.user?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  if (auth.tenant.role !== "owner") {
    return NextResponse.json(
      {
        ok: false,
        error: "Owner access required.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await req.json().catch(() => ({}));

  if (String(body?.confirmation || "").trim() !== "DELETE") {
    return NextResponse.json(
      {
        ok: false,
        error: 'Type "DELETE" to confirm account deletion.',
      },
      {
        status: 400,
      }
    );
  }

  const tenantId = auth.tenant.id;
  const userId = auth.user.id;

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
      ownerId: true,
      stripeSubscriptionId: true,
      stripeVoiceSubscriptionId: true,
    },
  });

  if (!tenant) {
    return NextResponse.json(
      {
        ok: false,
        error: "Store not found.",
      },
      {
        status: 404,
      }
    );
  }

  // Do not rely only on the resolved membership role.
  // The destructive action must come from the actual Tenant owner.
  if (tenant.ownerId !== userId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Only the store owner can delete this account.",
      },
      {
        status: 403,
      }
    );
  }

  try {
    /*
     * Stripe is intentionally handled BEFORE database deletion.
     *
     * If Stripe cancellation succeeds but database deletion later fails,
     * the merchant still has an account and is no longer being charged.
     *
     * We never want the reverse:
     * deleted account + active Stripe subscription.
     */
    const subscriptionIds = Array.from(
      new Set(
        [
          tenant.stripeSubscriptionId,
          tenant.stripeVoiceSubscriptionId,
        ].filter((value): value is string => Boolean(value))
      )
    );

    for (const subscriptionId of subscriptionIds) {
      await cancelStripeSubscription(subscriptionId);
    }

    const cookieStore = await cookies();
    const currentSessionToken =
      cookieStore.get("tz_session")?.value || "";

    const result = await prisma.$transaction(async (tx) => {
      /*
       * These models currently store tenantId as a plain String rather
       * than a Prisma Tenant relation, so Tenant deletion will NOT
       * cascade into them automatically.
       */
      const mentoringThreads =
        await tx.mentoringThread.findMany({
          where: {
            tenantId,
          },
          select: {
            id: true,
          },
        });

      const mentoringThreadIds =
        mentoringThreads.map((thread) => thread.id);

      if (mentoringThreadIds.length > 0) {
        await tx.mentoringMessage.deleteMany({
          where: {
            threadId: {
              in: mentoringThreadIds,
            },
          },
        });
      }

      await tx.mentoringThread.deleteMany({
        where: {
          tenantId,
        },
      });

      await tx.emmaObservation.deleteMany({
        where: {
          tenantId,
        },
      });

      /*
       * Most merchant-owned records cascade from Tenant:
       * conversations/messages, knowledge, assistant learning,
       * widget, Starter Link, memberships, calls, etc.
       *
       * MetricEvent and TwilioVoiceEvent intentionally use SetNull
       * and therefore may remain as operational records without the
       * deleted tenant identifier.
       */
      await tx.tenant.delete({
        where: {
          id: tenantId,
        },
      });

      /*
       * The schema allows a User to participate in more than one
       * tenant even though normal signup currently creates one store.
       *
       * Preserve the User if another tenant relationship remains.
       */
      const otherOwnedTenant =
        await tx.tenant.findFirst({
          where: {
            ownerId: userId,
          },
          select: {
            id: true,
          },
        });

      const otherMembership =
        await tx.membership.findFirst({
          where: {
            userId,
          },
          select: {
            id: true,
          },
        });

      const shouldDeleteUser =
        !otherOwnedTenant && !otherMembership;

      if (shouldDeleteUser) {
        /*
         * User deletion also cascades Sessions,
         * password-reset tokens, and verification tokens.
         */
        await tx.user.delete({
          where: {
            id: userId,
          },
        });
      } else if (currentSessionToken) {
        /*
         * The User still participates in another tenant.
         * End only this current browser session.
         */
        await tx.session.deleteMany({
          where: {
            token: currentSessionToken,
            userId,
          },
        });
      }

      return {
        userDeleted: shouldDeleteUser,
      };
    });

    const response = NextResponse.json({
      ok: true,
      accountDeleted: result.userDeleted,
    });

    response.cookies.set("tz_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    response.cookies.set("tz_tenant", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error(
      "[account-delete] Failed:",
      error?.message || error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not delete your account. Your store data has not been intentionally removed. Please try again or contact support.",
      },
      {
        status: 500,
      }
    );
  }
}
