"use client";

export default function TeamGoalsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>Team Goals Overview</h2>
      <p style={{ color: '#64748b' }}>Consolidated view of all active goals across your reporting team.</p>
      <div style={{ marginTop: 40, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
        <h3>Team Goal Tracking</h3>
        <p style={{ color: '#64748b' }}>This module will provide a heatmap of goal completion by thrust area.</p>
      </div>
    </main>
  );
}
