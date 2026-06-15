// src/app/dashboard/settings/page.tsx

import MobilePageHeader from "../_components/MobilePageHeader";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="Settings" />
      <SettingsClient />
    </div>
  );
}