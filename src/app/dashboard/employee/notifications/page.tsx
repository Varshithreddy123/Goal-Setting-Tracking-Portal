"use client";

export default function NotificationsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Notifications</h2>
      <p style={{ color: '#64748b' }}>Stay updated on goal approvals, check-in reminders, and team updates.</p>
      <div style={{ marginTop: 40, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
        <h3>All caught up!</h3>
        <p style={{ color: '#64748b' }}>You have no new notifications at this time.</p>
      </div>
    </main>
  );
}
