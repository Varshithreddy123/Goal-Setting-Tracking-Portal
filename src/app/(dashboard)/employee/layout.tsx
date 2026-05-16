import type { ReactNode } from 'react';
import Sidebar from '../../../components/sidebar/Sidebar';

export default function EmployeeDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <Sidebar role="employee" />
      <main style={{ flex: 1, padding: '28px 28px 60px' }}>{children}</main>
    </div>
  );
}

