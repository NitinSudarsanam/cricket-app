'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StatDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  variant?: 'default' | 'highlight';
  size?: 'md' | 'lg';
}

export const StatDisplay = React.forwardRef<HTMLDivElement, StatDisplayProps>(
  ({ label, value, variant = 'default', size = 'lg', className, ...props }, ref) => {
    const valueClass =
      variant === 'highlight'
        ? 'stat-value-highlight'
        : size === 'md'
        ? 'stat-value-md'
        : 'stat-value';

    return (
      <div ref={ref} className={cn('stat-group', className)} {...props}>
        <div className="stat-label">{label}</div>
        <div className={valueClass}>{value}</div>
      </div>
    );
  }
);

StatDisplay.displayName = 'StatDisplay';

