export default function SettingsPage() {
  return (
    <div>
      <h1 className="db-title">Settings</h1>
      <p className="db-sub">Store profile, team members, domains, notifications (later).</p>

      <div style={{ marginTop: 14, border: '1px solid #e5e7eb', borderRadius: 16, padding: 14, background: '#fff' }}>
        <div style={{ fontWeight: 800 }}>Coming next</div>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          We’ll add workspace settings and team management after conversations.
        </p>
      </div>
    </div>
  );
}
