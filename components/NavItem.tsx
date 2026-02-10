"use client";

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NavItemData } from '@/lib/navigation';

interface NavItemProps {
  item: NavItemData;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({ item, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          isActive
            ? 'bg-accent text-primary font-medium'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}
