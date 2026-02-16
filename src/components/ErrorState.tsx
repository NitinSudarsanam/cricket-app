'use client';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

/**
 * Reusable error state with icon, message, and optional Retry button.
 * Use for data-load errors (e.g. failed fetch) to keep pattern consistent.
 */
export function ErrorState({
  message,
  onRetry,
  title = 'Something went wrong',
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-md p-6 text-center ${className}`}
      role="alert"
    >
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="font-medium text-red-900">{title}</p>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}
