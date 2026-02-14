// src/app/dashboard/settings/phone-agent/page.tsx
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import Link from "next/link";

export const runtime = "nodejs";

export default async function PhoneAgentSettingsPage() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return (
      <div className="db-main">
        <div className="db-card p-6">
          <h1 className="text-lg font-semibold">Phone Agent</h1>
          <p className="mt-2 text-sm opacity-80">Please log in.</p>
          <div className="mt-4">
            <Link className="db-btn primary" href="/login">Go to login</Link>
          </div>
        </div>
      </div>
    );
  }

  const settings = await prisma.phoneAgentSettings.findUnique({
    where: { tenantId: auth.tenant.id },
  });

  return (
    <div className="db-main">
      <div className="db-card p-6">
        <h1 className="text-lg font-semibold">Phone Agent</h1>
        <p className="mt-2 text-sm opacity-80">
          Configure your phone receptionist and after-hours voicemail behavior.
        </p>

        <div className="mt-4 text-sm">
          <div><span className="opacity-70">Enabled:</span> {String(settings?.enabled ?? false)}</div>
          <div className="mt-1">
            <span className="opacity-70">Inbound number:</span>{" "}
            {settings?.inboundNumberE164 || "(not set)"}
          </div>
        </div>

        <p className="mt-6 text-xs opacity-60">
          Next step: we’ll add the edit form + “Save” + business hours JSON editor.
        </p>
      </div>
    </div>
  );
}
