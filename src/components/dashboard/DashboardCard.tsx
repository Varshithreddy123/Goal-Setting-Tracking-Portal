export default function DashboardCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div style={{ padding: 24, borderRadius: 24, background: '#fff', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }}>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{title}</p>
      <h3 style={{ margin: '10px 0 8px', fontSize: '2rem' }}>{value}</h3>
      <p style={{ margin: 0, color: '#475569' }}>{description}</p>
    </div>
  );
}
