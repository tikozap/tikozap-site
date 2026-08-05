// src/app/admin/tenants/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

import "./admin-tenants.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    showArchived?: string;
  }>;
};

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
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/dashboard");
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

          <h1>Admin Console</h1>

          <p className="adminSub">
            Manage merchant accounts, builders,
            channels, Voice, Phone Agent, plans, and
            account status.
          </p>
        </div>
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
                <th>Account</th>
                <th>Owner</th>
                <th>Builder</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Channels</th>
                <th>Voice</th>
                <th>Phone Agent</th>
                <th>Status</th>
                <th>Created</th>
                <th className="right">
                  Action
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
                    ? "Widget / Link"
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
                    ? "Setup"
                    : "Off";

                return (
                  <tr key={tenant.id}>
                    {/* Account */}
                    <td>
                      <strong>
                        {tenant.storeName ||
                          "Unnamed Store"}
                      </strong>

                      <div className="muted">
                        {tenant.id}
                      </div>
                    </td>

                    {/* Owner */}
                    <td>
                      {tenant.owner?.email ||
                        "—"}
                    </td>

                    {/* Builder */}
                    <td>
                      <span
                        className={`builder builder-${builder
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {builder}
                      </span>

                      {shopifyConnected ? (
                        <div className="muted">
                          {
                            tenant
                              .shopifyConnection
                              ?.shopDomain
                          }
                        </div>
                      ) : tenant.websiteUrl ? (
                        <div className="muted adminUrl">
                          {tenant.websiteUrl}
                        </div>
                      ) : null}
                    </td>

                    {/* Slug */}
                    <td>
                      <div>
                        {tenant.slug || "—"}
                      </div>

                      {hasStarterLink &&
                      tenant.starterLinkSlug ? (
                        <div className="muted">
                          /l/
                          {
                            tenant.starterLinkSlug
                          }
                        </div>
                      ) : null}
                    </td>

                    {/* Plan */}
                    <td>
                      <span className="pill">
                        {tenant.billingPlan ||
                          "No plan"}
                      </span>

                      {tenant.billingStatus ? (
                        <div className="muted">
                          {
                            tenant.billingStatus
                          }
                        </div>
                      ) : null}
                    </td>

                    {/* Channels */}
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
                          phoneAgent === "Setup"
                            ? "featureBadge phone"
                            : "featureBadge off"
                        }
                      >
                        {phoneAgent}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {tenant.isDeleted ? (
                        <span className="status archived">
                          Archived
                        </span>
                      ) : (
                        <span className="status active">
                          Active
                        </span>
                      )}
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
                    colSpan={11}
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