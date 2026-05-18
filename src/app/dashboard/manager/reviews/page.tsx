"use client";

export default function QuarterlyReviewsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Quarterly Performance Reviews</h2>
      <p style={{ color: '#64748b' }}>Formal review documentation and feedback logs for each quarter.</p>
      <div style={{ marginTop: 40, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗓️</div>
        <h3>No active reviews</h3>
        <p style={{ color: '#64748b' }}>Quarterly review cycles will appear here when the window opens.</p>
      </div>
    </main>
  );
}
