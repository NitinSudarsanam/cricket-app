/**
 * Custom hook for toast notifications with retry logic
 * Provides convenient methods for showing success, error, warning, and info toasts
 * Includes automatic retry functionality for network errors
 * 
 * Requirements: General error handling
 */

import { useCallback } from 'react';
import { useToastStore } from '@/stores/useToastStore';

export interface UseToastOptions {
  duration?: number;
  onRetry?: () => void | Promise<void>;
}

export function useToast() {
  const { success, error, warning, info, removeToast } = useToastStore();

  const showSuccess = useCallback(
    (message: string, options?: UseToastOptions) => {
      return success(message, options?.duration);
    },
    [success]
  );

  const showError = useCallback(
    (message: string, options?: UseToastOptions) => {
      const action = options?.onRetry
        ? {
            label: 'Retry',
            onClick: async () => {
              try {
                await options.onRetry?.();
              } catch (err) {
                console.error('Retry failed:', err);
              }
            },
          }
        : undefined;

      return error(message, options?.duration, action);
    },
    [error]
  );

  const showWarning = useCallback(
    (message: string, options?: UseToastOptions) => {
      return warning(message, options?.duration);
    },
    [warning]
  );

  const showInfo = useCallback(
    (message: string, options?: UseToastOptions) => {
      return info(message, options?.duration);
    },
    [info]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    dismiss,
  };
}
