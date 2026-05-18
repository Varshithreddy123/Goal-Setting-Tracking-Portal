export type MenuItem = {
  label: string;
  href: string;
  icon?: string;
  match?: (pathname: string) => boolean;
};

export const employeeSidebar: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard/employee', icon: 'LayoutDashboard' },
  { label: 'Create Goals', href: '/dashboard/employee/create-goals', icon: 'Target' },
  { label: 'My Goals', href: '/dashboard/employee/goals', icon: 'ClipboardList' },
  { label: 'Quarterly Check-ins', href: '/dashboard/employee/checkins', icon: 'CalendarCheck' },
  { label: 'Shared Goals', href: '/dashboard/employee/shared-goals', icon: 'Users' },
  { label: 'Achievements', href: '/dashboard/employee/achievements', icon: 'TrendingUp' },
  { label: 'Notifications', href: '/dashboard/employee/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/dashboard/employee/profile', icon: 'User' },
];

export const employeeDashboardCards = [
  {
    title: 'Total Goals',
    value: '08',
    description: 'Goals assigned this cycle',
  },
  {
    title: 'Completed Goals',
    value: '05',
    description: 'Successfully completed goals',
  },
  {
    title: 'Pending Goals',
    value: '03',
    description: 'Goals still in progress',
  },
  {
    title: 'Current Quarter',
    value: 'Q2',
    description: 'Active review cycle',
  },
  {
    title: 'Goal Weightage',
    value: '100%',
    description: 'Total assigned weightage',
  },
  {
    title: 'Check-in Status',
    value: 'Submitted',
    description: 'Quarterly check-in progress',
  },
];

export const managerSidebar: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard/manager', icon: 'LayoutDashboard' },
  { label: 'Team Management', href: '/dashboard/manager/team-management', icon: 'Users' },
  { label: 'Goal Approvals', href: '/dashboard/manager/approvals', icon: 'BadgeCheck' },
  { label: 'Team Performance', href: '/dashboard/manager/team-performance', icon: 'BarChart3' },
  { label: 'Team Goals', href: '/dashboard/manager/team-goals', icon: 'Users' },
  { label: 'Quarterly Reviews', href: '/dashboard/manager/reviews', icon: 'CalendarCheck' },
  { label: 'Check-in Comments', href: '/dashboard/manager/comments', icon: 'MessageSquare' },
  { label: 'Shared KPI', href: '/dashboard/manager/shared-kpi', icon: 'Share2' },
  { label: 'Notifications', href: '/dashboard/manager/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/dashboard/manager/profile', icon: 'User' },
];

export const managerDashboardCards = [
  {
    title: 'Team Members',
    value: '24',
    description: 'Employees under reporting',
  },
  {
    title: 'Pending Approvals',
    value: '06',
    description: 'Goals awaiting approval',
  },
  {
    title: 'Completed Reviews',
    value: '18',
    description: 'Quarterly reviews completed',
  },
  {
    title: 'Team Progress',
    value: '78%',
    description: 'Average goal completion',
  },
  {
    title: 'Shared Goals',
    value: '04',
    description: 'Department KPIs assigned',
  },
  {
    title: 'Pending Check-ins',
    value: '05',
    description: 'Employees yet to update',
  },
];

export const adminSidebar: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: 'LayoutDashboard' },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: 'BarChart4' },
  { label: 'Audit Trail', href: '/dashboard/admin/audit', icon: 'History' },
  { label: 'Shared Goals', href: '/dashboard/admin/shared-goals', icon: 'Share2' },
  { label: 'Create User', href: '/dashboard/admin/users/create', icon: 'Users' },
  { label: 'Manage Users', href: '/dashboard/admin/users/manage', icon: 'Users' },
  { label: 'Cycle Management', href: '/dashboard/admin/cycles', icon: 'RotateCw' },
];


export const adminDashboardCards = [
  {
    title: 'Total Employees',
    value: '152',
    description: 'Registered employees',
  },
  {
    title: 'Managers',
    value: '18',
    description: 'Active reporting managers',
  },
  {
    title: 'Goal Completion',
    value: '82%',
    description: 'Organization-wide completion',
  },
  {
    title: 'Pending Check-ins',
    value: '21',
    description: 'Employees pending quarterly update',
  },
  {
    title: 'Approval Rate',
    value: '91%',
    description: 'Goals approved this cycle',
  },
  {
    title: 'Audit Events',
    value: '143',
    description: 'Tracked system modifications',
  },
];
