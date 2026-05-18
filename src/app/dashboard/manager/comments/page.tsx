"use client";

export default function CheckinCommentsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Check-in Comments</h2>
      <p style={{ color: '#64748b' }}>Centralized log of all feedback and discussion points from team check-ins.</p>
      <div style={{ marginTop: 40, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
        <h3>No recent comments</h3>
        <p style={{ color: '#64748b' }}>Provide feedback during quarterly check-ins to see them listed here.</p>
      </div>
    </main>
  );
}
