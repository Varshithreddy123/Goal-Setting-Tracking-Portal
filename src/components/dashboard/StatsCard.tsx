export default function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 20, background: '#eef4ff', color: '#0f4c81' }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
    </div>
  );
}
