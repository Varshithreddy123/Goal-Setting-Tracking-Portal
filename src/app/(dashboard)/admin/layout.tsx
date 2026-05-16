import type { ReactNode } from 'react';
import Sidebar from '../../../components/sidebar/Sidebar';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <Sidebar role="admin" />
      <main style={{ flex: 1, padding: '28px 28px 60px' }}>{children}</main>
    </div>
  );
}

