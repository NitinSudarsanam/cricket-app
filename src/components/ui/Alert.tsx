'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('alert', {
  variants: {
    variant: {
      success: 'alert-success alert-text alert-text-success',
      warning: 'alert-warning alert-text alert-text-warning',
      danger: 'alert-danger alert-text alert-text-danger',
      info: 'alert-info alert-text alert-text-info',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(alertVariants({ variant }), className)} {...props} />
  )
);

Alert.displayName = 'Alert';

