"use client";

export default function AchievementsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h2>My Achievements</h2>
      <p style={{ color: '#64748b' }}>Visualize your performance highlights and badges earned.</p>
      <div style={{ marginTop: 40, textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
        <h3>No achievements yet</h3>
        <p style={{ color: '#64748b' }}>Complete your goals and quarterly check-ins to earn recognition.</p>
      </div>
    </main>
  );
}
