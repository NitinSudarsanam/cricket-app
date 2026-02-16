'use client';

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { cn } from '@/lib/utils';

export interface NavLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export function NavLink({ children, className, active, icon, ...props }: NavLinkProps) {
  return (
    <Link
      {...props}
      className={cn('nav-link', active && 'nav-link-active', className)}
    >
      {icon}
      <span className="truncate">{children}</span>
    </Link>
  );
}

