'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padded = false, ...props }, ref) => {
    const baseClass = padded ? 'card-padded' : 'card';
    return <div ref={ref} className={cn(baseClass, className)} {...props} />;
  }
);

Card.displayName = 'Card';

