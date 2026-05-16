import type { ReactNode } from 'react';

// Delegates to the existing role-group implementation
import EmployeeRoleLayout from '../../(dashboard)/employee/layout';

export default function EmployeeDashboardLayout({ children }: { children: ReactNode }) {
  return <EmployeeRoleLayout>{children}</EmployeeRoleLayout>;
}

