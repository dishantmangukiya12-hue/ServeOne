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
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cloche dome */}
          <path d="M12 3C7 3 3 7.5 3 13h18c0-5.5-4-10-9-10z" />
          {/* Handle knob */}
          <circle cx="12" cy="3" r="1" fill="currentColor" />
          {/* Plate/base */}
          <path d="M2 13h20" />
          <path d="M4 13c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2" />
        </svg>
      </div>
      {!collapsed && (
        <div className="overflow-hidden">
          <span className="text-lg font-semibold text-foreground block truncate">
            ServeOne
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
