"use client";

import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { NavItem } from '@/components/NavItem';
import { mainNavItems, secondaryNavItems } from '@/lib/navigation';

interface MobileSidebarProps {
  onClose: () => void;
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const { logout, restaurant } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="h-full bg-card flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <NavLink to="/home" onClick={onClose} className="flex items-center">
          <Logo restaurantName={restaurant?.name} />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Main
        </div>
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={onClose} />
          ))}
        </div>

        <div className="my-4 border-t border-border" />

        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          More
        </div>
        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={onClose} />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
