import type { ReactNode } from 'react';

// Delegates to the existing role-group implementation
import AdminRoleLayout from '../../(dashboard)/admin/layout';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminRoleLayout>{children}</AdminRoleLayout>;
}

