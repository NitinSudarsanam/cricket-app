'use client';

import styles from '@/styles/components/LoadingSpinner.module.css';
import { classNames } from '@/utils/classNames';

export type LoadingSpinnerVariant = 'full-page' | 'inline' | 'button';
export type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  variant?: LoadingSpinnerVariant;
  size?: LoadingSpinnerSize;
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
  const spinnerClasses = getSpinnerClasses(size);
  
  if (variant === 'full-page') {
    return <FullPageSpinner message={message} />;
  }

  if (variant === 'button') {
    return <ButtonSpinner spinnerClasses={spinnerClasses} />;
  }

  return <InlineSpinner spinnerClasses={spinnerClasses} message={message} />;
}

/**
 * Get spinner size classes
 * Follows Open/Closed Principle: Easy to add new sizes without modifying existing code.
 */
function getSpinnerClasses(size: LoadingSpinnerSize): string {
  const sizeMap: Record<LoadingSpinnerSize, string> = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg,
  };
  
  return classNames(styles.spinner, sizeMap[size]);
}

/**
 * Full-page loading spinner variant
 */
function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className={styles.fullPageContainer}>
      <div 
        className={classNames(styles.spinner, styles.fullPageSpinner)}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className={styles.fullPageMessage}>{message}</p>
      )}
    </div>
  );
}

/**
 * Button loading spinner variant
 */
function ButtonSpinner({ spinnerClasses }: { spinnerClasses: string }) {
  return (
    <div className={styles.buttonContainer}>
      <div 
        className={spinnerClasses}
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
  spinnerClasses, 
  message 
}: { 
  spinnerClasses: string; 
  message?: string;
}) {
  return (
    <div className={styles.inlineContainer}>
      <div 
        className={spinnerClasses}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span className={styles.inlineMessage}>{message}</span>
      )}
    </div>
  );
}
