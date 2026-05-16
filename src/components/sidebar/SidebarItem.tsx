import type { MenuItem } from './menuItems';
import styles from './SidebarItem.module.css';

export default function SidebarItem({ item }: { item: MenuItem }) {
  return (
    <a href={item.href} className={styles.item}>
      {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
      {item.label}
    </a>
  );
}
