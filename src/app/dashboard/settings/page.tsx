// src/app/dashboard/settings/page.tsx

import MobilePageHeader from '../_components/MobilePageHeader';

export default function SettingsPage() {
  return (
    <div className="db-container">
      <MobilePageHeader title="Settings" />

      <div className="db-pageStack">
        <h1 className="db-title">Settings</h1>
        <p className="db-sub">Store profile, team members, domains, notifications (later).</p>

        <div className="db-card">
          <div className="db-cardTitle">Coming next</div>
          <p className="db-cardText">
            We’ll add workspace settings and team management after conversations.
          </p>
        </div>
      </div>
    </div>
  );
}