export default function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <p style={{ margin: 0, color: '#0f4c81', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {subtitle}
      </p>
      <h1 style={{ margin: '10px 0 0', fontSize: '2.5rem', color: '#102a43' }}>{title}</h1>
    </header>
  );
}
