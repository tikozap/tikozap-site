// src/app/admin/tenants/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import "./admin-tenants.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    showArchived?: string;
  }>;
};

export default async function AdminTenantsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const q = (params?.q || "").trim();
  const showArchived = params?.showArchived === "1";

  const tenants = await prisma.tenant.findMany({
  include: {
  owner: true,
  widget: true,
},
  where: {
      ...(showArchived ? {} : { isDeleted: false }),
      ...(q
        ? {
            OR: [
              { storeName: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { starterLinkSlug: { contains: q, mode: "insensitive" } },
              { billingPlan: { contains: q, mode: "insensitive" } },
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
          <p className="adminEyebrow">TikoZap Internal</p>
          <h1>Admin Console</h1>
          <p className="adminSub">
            Manage merchant accounts, test tenants, billing state, and Starter Links.
          </p>
        </div>

        <Link className="adminBack" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>

      <section className="adminCard">
        <div className="adminToolbar">
          <form className="adminSearch">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search store, slug, plan..."
            />

            {showArchived && <input type="hidden" name="showArchived" value="1" />}

            <button type="submit">Search</button>
          </form>

          <div className="adminFilters">
            <Link
              className={!showArchived ? "active" : ""}
              href="/admin/tenants"
            >
              Active
            </Link>
            <Link
              className={showArchived ? "active" : ""}
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
                <th>Store</th>
                <th>Owner</th>
                <th>Channel</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Starter Link</th>
                <th>Status</th>
                <th>Created</th>
                <th className="right">Action</th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
  <strong>{tenant.storeName || "Unnamed Store"}</strong>
  <div className="muted">{tenant.id}</div>
</td>

<td>
  {tenant.owner?.email || "—"}
</td>

<td>
  {tenant.websiteUrl ? (
    <span className="channel website">Website</span>
  ) : (
    <span className="channel starter">Starter Link</span>
  )}
</td>

<td>{tenant.slug || "—"}</td>

                  <td>
                    <span className="pill">
                      {tenant.billingPlan || "No plan"}
                    </span>
                  </td>

                  <td>
                    {tenant.starterLinkSlug ? (
                      <span>
                        /l/{tenant.starterLinkSlug}
                        {tenant.starterLinkEnabled ? (
                          <span className="tinyOk"> enabled</span>
                        ) : (
                          <span className="tinyMuted"> off</span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {tenant.isDeleted ? (
                      <span className="status archived">Archived</span>
                    ) : (
                      <span className="status active">Active</span>
                    )}
                  </td>

                  <td>
                    {new Date(tenant.createdAt).toLocaleDateString("en-US")}
                  </td>

                  <td className="right">
                    {tenant.isDeleted ? (
                      <form action={`/api/admin/tenants/${tenant.id}/restore`} method="post">
                        <button className="smallBtn" type="submit">
                          Restore
                        </button>
                      </form>
                    ) : (
                      <form action={`/api/admin/tenants/${tenant.id}/archive`} method="post">
                        <button className="dangerBtn" type="submit">
                          Archive
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}

              {tenants.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    No merchants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}