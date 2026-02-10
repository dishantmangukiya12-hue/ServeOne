"use client";

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  restaurantName?: string;
}

const sizes = {
  sm: { wrapper: 'p-1.5', icon: 'h-4 w-4' },
  md: { wrapper: 'p-2', icon: 'h-5 w-5' },
  lg: { wrapper: 'p-2.5', icon: 'h-6 w-6' },
};

export function Logo({ size = 'md', collapsed = false, restaurantName }: LogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div className={cn('bg-primary rounded-lg flex-shrink-0', s.wrapper)}>
        <svg
          className={cn('text-primary-foreground', s.icon)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      </div>
      {!collapsed && (
        <div className="overflow-hidden">
          <span className="text-lg font-semibold text-foreground block truncate">
            DineFlow
          </span>
          {restaurantName && (
            <span className="text-xs text-muted-foreground truncate block">
              {restaurantName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
