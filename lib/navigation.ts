import {
  Home,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Receipt,
  QrCode,
  ChefHat,
  Users,
  UtensilsCrossed,
  Settings,
  Package,
  CalendarDays,
  UserCog,
  Heart,
  Clock,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemData {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItemData[] = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ClipboardList },
  { path: '/pending-payments', label: 'Pending Payments', icon: Clock },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/qr', label: 'QR Ordering', icon: QrCode },
];

export const secondaryNavItems: NavItemData[] = [
  { path: '/kds', label: 'Kitchen Display', icon: ChefHat },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/reservations', label: 'Reservations', icon: CalendarDays },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/users', label: 'Staff', icon: UserCog },
  { path: '/loyalty', label: 'Loyalty', icon: Heart },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
];
