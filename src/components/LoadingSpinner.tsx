'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Define spinner variants using CVA and semantic classes
const spinnerVariants = cva(
  "spinner",
  {
    variants: {
      size: {
        sm: "spinner-sm",
        md: "spinner-md",
        lg: "spinner-lg"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export interface LoadingSpinnerProps {
  variant?: 'full-page' | 'inline' | 'button';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner with different variants and sizes.
 * Follows Single Responsibility Principle: Only handles loading UI.
 */
export function LoadingSpinner({
  variant = 'inline',
  size = 'md',
  message
}: LoadingSpinnerProps) {
  if (variant === 'full-page') {
    return <FullPageSpinner size={size} message={message} />;
  }

  if (variant === 'button') {
    return <ButtonSpinner size={size} />;
  }

  return <InlineSpinner size={size} message={message} />;
}

/**
 * Full-page loading spinner variant
 */
function FullPageSpinner({ size = 'lg', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  return (
    <div className="spinner-container-fullpage">
      <div
        className={cn(spinnerVariants({ size }))}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="spinner-message-fullpage">{message}</p>
      )}
    </div>
  );
}

/**
 * Button loading spinner variant
 */
function ButtonSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="spinner-container-button">
      <div
        className={cn(spinnerVariants({ size }))}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

/**
 * Inline loading spinner variant
 */
function InlineSpinner({
  size = 'md',
  message
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) {
  return (
    <div className="spinner-container-inline">
      <div
        className={cn(spinnerVariants({ size }))}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span className="spinner-message-inline">{message}</span>
      )}
    </div>
  );
}
