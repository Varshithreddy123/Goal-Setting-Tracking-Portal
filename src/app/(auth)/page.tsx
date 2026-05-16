import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | GoalTrack Portal',
};

export default function AuthLandingPage() {
  return (
    <main style={{ padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Login</h1>
      <p>Select a role to continue (demo).</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
        <a className="button primary" href="/dashboard/employee">
          Employee Login
        </a>
        <a className="button primary" href="/dashboard/manager">
          Manager Login
        </a>
        <a className="button primary" href="/dashboard/admin">
          Admin Login
        </a>
      </div>
    </main>
  );
}

