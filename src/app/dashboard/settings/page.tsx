// src/app/dashboard/settings/page.tsx

import MobilePageHeader from "../_components/MobilePageHeader";
import SettingsClient from "./SettingsClient";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    redirect("/login");
  }

  return (
    <div className="db-container">
      <MobilePageHeader title="Settings" />
      <SettingsClient role={auth.tenant.role} />
    </div>
  );
}