// src/app/admin/tenants/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

import "./admin-tenants.css";
import { getUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    showArchived?: string;
  }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US");
}

function getTenantLifecycle(tenant: {
  isDeleted: boolean;
  trialEndsAt: Date | null;
  stripeSubscriptionId: string | null;
  stripeCancelAtPeriodEnd: boolean;
  stripeCurrentPeriodEnd: Date | null;
  billingStatus: string | null;
  billingInterval: string;
}) {
  if (tenant.isDeleted) {
    return {
      planLabel: null,
      billing: "None",
      renews: tenant.stripeCurrentPeriodEnd,
      status: "Archived",
      statusClass: "archived",
    };
  }

  const now = new Date();

  const hasSubscription =
    Boolean(tenant.stripeSubscriptionId);

  const trialExpired =
    Boolean(tenant.trialEndsAt) &&
    tenant.trialEndsAt!.getTime() <= now.getTime();

  if (!hasSubscription && tenant.trialEndsAt) {
    return {
      planLabel: "14-day Trial",
      billing: "Trial",
      renews: tenant.trialEndsAt,
      status: trialExpired ? "Expired" : "Trialing",
      statusClass: trialExpired ? "expired" : "trialing",
    };
  }

  if (tenant.stripeCancelAtPeriodEnd) {
    return {
      planLabel: null,
      billing: tenant.billingInterval === "annual"
        ? "Annual"
        : "Monthly",
      renews: tenant.stripeCurrentPeriodEnd,
      status: "Cancelled",
      statusClass: "cancelled",
    };
  }

  if (
    tenant.billingStatus === "past_due" ||
    tenant.billingStatus === "unpaid"
  ) {
    return {
      planLabel: null,
      billing: tenant.billingInterval === "annual"
        ? "Annual"
        : "Monthly",
      renews: tenant.stripeCurrentPeriodEnd,
      status: "Past due",
      statusClass: "past-due",
    };
  }

  return {
    planLabel: null,
    billing: hasSubscription
      ? tenant.billingInterval === "annual"
        ? "Annual"
        : "Monthly"
      : "None",
    renews: tenant.stripeCurrentPeriodEnd,
    status:
      tenant.billingStatus === "active" ||
      tenant.billingStatus === "trialing"
        ? "Active"
        : "Paused",
    statusClass:
      tenant.billingStatus === "active" ||
      tenant.billingStatus === "trialing"
        ? "active"
        : "paused",
  };
}

function formatVoicePack(value: string | null) {
  if (!value) return null;

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default async function AdminTenantsPage({
  searchParams,
}: PageProps) {
const userId = await getUserId();

if (!userId) {
  redirect('/login');
}

const admin = await requireAdmin();

if (!admin) {
  redirect('/dashboard');
}

  const params = await searchParams;
  const q = (params?.q || "").trim();
  const showArchived =
    params?.showArchived === "1";

  const tenants = await prisma.tenant.findMany({
    include: {
      owner: true,

      widget: {
        select: {
          enabled: true,
        },
      },

      shopifyConnection: {
        select: {
          status: true,
          shopDomain: true,
        },
      },

      phoneAgentSettings: {
        select: {
          id: true,
        },
      },
    },

    where: {
      ...(showArchived
        ? {}
        : {
            isDeleted: false,
          }),

      ...(q
        ? {
            OR: [
              {
                storeName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                slug: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                starterLinkSlug: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                billingPlan: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 100,
  });

  return (
    <main className="adminPage">
<div className="adminHeader">
  <div>
    <p className="adminEyebrow">
      TikoZap Internal
    </p>

    <h1>Tenants</h1>

    <p className="adminSub">
      Manage merchant accounts, builders,
      channels, Voice, Phone Agent, plans, and
      account status.
    </p>
  </div>

  <Link
    href="/admin"
    className="adminBack"
  >
    ← Admin Console
  </Link>
</div>

      <section className="adminCard">
        <div className="adminToolbar">
          <form className="adminSearch">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search account, slug, plan..."
            />

            {showArchived ? (
              <input
                type="hidden"
                name="showArchived"
                value="1"
              />
            ) : null}

            <button type="submit">
              Search
            </button>
          </form>

          <div className="adminFilters">
            <Link
              className={
                !showArchived ? "active" : ""
              }
              href="/admin/tenants"
            >
              Active
            </Link>

            <Link
              className={
                showArchived ? "active" : ""
              }
              href="/admin/tenants?showArchived=1"
            >
              Archived
            </Link>
          </div>
        </div>

        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
<tr>
  <th>Business</th>
  <th>Email</th>
  <th>Owner</th>
  <th>Website</th>
  <th>Plan</th>
  <th>Billing</th>
  <th>Renews</th>
  <th>Status</th>
  <th>Widget</th>
  <th>Voice</th>
  <th>Phone</th>
  <th>Created</th>
  <th className="right">
    Archive
  </th>
</tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => {
                const hasWidget =
                  tenant.widget?.enabled === true;

                const hasStarterLink =
                  tenant.starterLinkEnabled ===
                    true &&
                  Boolean(
                    tenant.starterLinkSlug,
                  );

const channels =
  hasWidget && hasStarterLink
    ? "Widget + Link"
                    : hasWidget
                      ? "Widget"
                      : hasStarterLink
                        ? "Link"
                        : "—";

                const shopifyConnected =
                  tenant.shopifyConnection
                    ?.status === "connected";

                const builder =
                  shopifyConnected
                    ? "Shopify"
                    : tenant.websiteUrl
                      ? "Website"
                      : hasStarterLink
                        ? "Starter Link"
                        : "Not set";

                const voicePack =
                  formatVoicePack(
                    tenant.voicePack,
                  );

const voice =
  voicePack ||
  (tenant.voiceEnabled
    ? "Enabled"
    : "20/day");

const phoneAgent =
  tenant.phoneAgentSettings
    ? "On"
    : "Off";

const lifecycle = getTenantLifecycle(tenant);

                return (
                  <tr key={tenant.id}>
{/* Business */}
<td>
  <strong>
    {tenant.storeName || "Unnamed Store"}
  </strong>
</td>

{/* Email */}
<td>
  {tenant.owner?.email || "—"}
</td>

{/* Owner */}
<td>
  {tenant.owner?.name || "—"}
</td>

{/* Website */}
<td>
  {tenant.websiteUrl ? (
    <>
      <div className="adminUrl">
        {tenant.websiteUrl}
      </div>

      <div className="muted">
        {shopifyConnected
          ? "Shopify"
          : "Website"}
      </div>
    </>
  ) : (
    <span className="muted">—</span>
  )}
</td>

{/* Plan */}
<td>
  <span className="pill">
    {lifecycle.planLabel ||
      tenant.billingPlan ||
      "No plan"}
  </span>
</td>

{/* Billing */}
<td>
  {lifecycle.billing}
</td>

{/* Renews */}
<td>
  {formatDate(lifecycle.renews)}
</td>

{/* Status */}
<td>
  <span
    className={`status ${lifecycle.statusClass}`}
  >
    {lifecycle.status}
  </span>
</td>

{/* Widget */}
<td>
  <span
    className={
      channels === "—"
        ? "featureBadge off"
        : "featureBadge channelBadge"
    }
  >
    {channels}
  </span>

  {hasStarterLink &&
  tenant.starterLinkSlug ? (
    <div className="muted">
      /l/{tenant.starterLinkSlug}
    </div>
  ) : null}
</td>

                    {/* Voice */}
                    <td>
                      <span
className={
  voice === "20/day"
    ? "featureBadge free"
    : "featureBadge voice"
}
                      >
                        {voice}
                      </span>

                      {tenant.voiceMinutesLimit >
                      0 ? (
                        <div className="muted">
                          {
                            tenant.voiceMinutesUsed
                          }
                          /
                          {
                            tenant.voiceMinutesLimit
                          }{" "}
                          min
                        </div>
                      ) : null}
                    </td>

                    {/* Phone Agent */}
                    <td>
                      <span
                        className={
                          phoneAgent === "On"
                            ? "featureBadge phone"
                            : "featureBadge off"
                        }
                      >
                        {phoneAgent}
                      </span>
                    </td>

                    {/* Created */}
                    <td>
                      {new Date(
                        tenant.createdAt,
                      ).toLocaleDateString(
                        "en-US",
                      )}
                    </td>

                    {/* Action */}
                    <td className="right">
                      {tenant.isDeleted ? (
                        <form
                          action={`/api/admin/tenants/${tenant.id}/restore`}
                          method="post"
                        >
                          <button
                            className="smallBtn"
                            type="submit"
                          >
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form
                          action={`/api/admin/tenants/${tenant.id}/archive`}
                          method="post"
                        >
                          <button
                            className="dangerBtn"
                            type="submit"
                          >
                            Archive
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}

              {tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="empty"
                  >
                    No merchants found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}