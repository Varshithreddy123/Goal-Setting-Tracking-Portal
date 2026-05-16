import type { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard | GoalTrack Portal',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Choose a workspace for Employee, Manager, or Admin.</p>
      </header>
      <section>{children}</section>
    </div>
  );
}
