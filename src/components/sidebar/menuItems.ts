export type MenuItem = {
  label: string;
  href: string;
  icon?: string;
  match?: (pathname: string) => boolean;
};

export const employeeSidebar: MenuItem[] = [
  { label: 'Dashboard', href: '/employee', icon: 'LayoutDashboard' },
  { label: 'Create Goals', href: '/employee/create-goals', icon: 'Target' },
  { label: 'My Goals', href: '/employee/goals', icon: 'ClipboardList' },
  { label: 'Quarterly Check-ins', href: '/employee/checkins', icon: 'CalendarCheck' },
  { label: 'Shared Goals', href: '/employee/shared-goals', icon: 'Users' },
  { label: 'Achievements', href: '/employee/achievements', icon: 'TrendingUp' },
  { label: 'Notifications', href: '/employee/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/employee/profile', icon: 'User' },
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
  { label: 'Dashboard', href: '/manager', icon: 'LayoutDashboard' },
  { label: 'Goal Approvals', href: '/manager/approvals', icon: 'BadgeCheck' },
  { label: 'Team Goals', href: '/manager/team-goals', icon: 'Users' },
  { label: 'Quarterly Reviews', href: '/manager/reviews', icon: 'CalendarCheck' },
  { label: 'Check-in Comments', href: '/manager/comments', icon: 'MessageSquare' },
  { label: 'Shared KPI', href: '/manager/shared-kpi', icon: 'Share2' },
  { label: 'Team Performance', href: '/manager/performance', icon: 'BarChart3' },
  { label: 'Notifications', href: '/manager/notifications', icon: 'Bell' },
  { label: 'Profile', href: '/manager/profile', icon: 'User' },
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
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'User Management', href: '/admin/users', icon: 'Users' },
  { label: 'Cycle Management', href: '/admin/cycles', icon: 'CalendarRange' },
  { label: 'Goal Monitoring', href: '/admin/goals', icon: 'Target' },
  { label: 'Shared Goals', href: '/admin/shared-goals', icon: 'Share2' },
  { label: 'Reports', href: '/admin/reports', icon: 'FileSpreadsheet' },
  { label: 'Completion Dashboard', href: '/admin/completion-dashboard', icon: 'PieChart' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: 'History' },
  { label: 'Escalations', href: '/admin/escalations', icon: 'AlertTriangle' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart4' },
  { label: 'Notifications', href: '/admin/notifications', icon: 'Bell' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
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
