"use client";

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { NavItem } from '@/components/NavItem';
import { mainNavItems, secondaryNavItems } from '@/lib/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface MobileSidebarProps {
  onClose: () => void;
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout, restaurant } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
