import type { ReactNode } from 'react';
import Sidebar from '../../../components/sidebar/Sidebar';
import UserProfileHeader from '../../../components/sidebar/UserProfileHeader';

export default function ManagerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <Sidebar role="manager" />
      <main style={{ flex: 1, padding: '28px 28px 60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 50 }}>
          <UserProfileHeader />
        </div>
        {children}
      </main>
    </div>
  );
}
