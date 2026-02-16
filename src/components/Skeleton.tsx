'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const skeletonVariants = cva(
  "animate-pulse bg-slate-200",
  {
    variants: {
      variant: {
        text: "rounded h-4",
        rect: "rounded-lg",
        circle: "rounded-full"
      }
    },
    defaultVariants: {
      variant: "rect"
    }
  }
);

export interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
}

/**
 * Skeleton placeholder with shimmer animation.
 * Use for loading states to keep layout stable.
 */
export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      role="presentation"
      aria-hidden="true"
    />
  );
}

/** Skeleton for a table row (e.g. player list). */
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 lg:px-6 py-4">
          <Skeleton className="h-5 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a card block (e.g. dashboard or results). */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
