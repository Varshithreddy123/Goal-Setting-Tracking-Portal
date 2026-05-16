import type { ReactNode } from 'react';

// Delegates to the existing role-group implementation
import ManagerRoleLayout from '../../(dashboard)/manager/layout';

export default function ManagerDashboardLayout({ children }: { children: ReactNode }) {
  return <ManagerRoleLayout>{children}</ManagerRoleLayout>;
}

