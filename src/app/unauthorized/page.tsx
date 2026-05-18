export default function UnauthorizedPage() {
  return (
    <main style={{ padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Unauthorized</h1>
      <p>You don’t have permission to view this page.</p>
      <a className="button" href="/">
        Go to home
      </a>
    </main>
  );
}

