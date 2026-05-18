"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import styles from './sidebar.module.css';
import { adminSidebar, employeeSidebar, managerSidebar, MenuItem } from './menuItems';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  BarChart4,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Share2,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  BarChart4,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Share2,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
};

export type SidebarRole = 'employee' | 'manager' | 'admin';

function isActive(item: MenuItem, pathname: string) {
  if (item.match) return item.match(pathname);
  return pathname === item.href;
}

const navByRole: Record<SidebarRole, MenuItem[]> = {
  employee: employeeSidebar,
  manager: managerSidebar,
  admin: adminSidebar,
};

export default function Sidebar({ role }: { role: SidebarRole }) {
  const pathname = usePathname();
  const navItems = navByRole[role];

  return (
    <aside className={styles.sidebar} aria-label="Role navigation">
      <div className={styles.brandBlock}>
        <div className={styles.brand}>GoalTrack</div>
        <div className={styles.subtle}>Workspace: {role}</div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon ? iconMap[item.icon] : null;
          const href = item.href.startsWith('/dashboard/') ? item.href : item.href.startsWith('/') ? `/dashboard/${role}${item.href}` : `/dashboard/${role}/${item.href}`;

          return (
            <Link
              key={item.href}
              href={href}
              className={active ? styles.navItemActive : styles.navItem}
            >
              {Icon ? <Icon className={styles.iconLabel} size={16} /> : <span className={styles.iconLabel}>•</span>}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerHint}>Demo UI</div>
      </div>
    </aside>
  );
}

