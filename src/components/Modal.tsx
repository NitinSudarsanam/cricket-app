'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const modalPanelVariants = cva(
  "bg-white rounded-t-2xl md:rounded-md border border-slate-200 shadow-sm w-full max-h-[90vh] overflow-y-auto animate-slide-up focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

export interface ModalProps extends VariantProps<typeof modalPanelVariants> {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Close when clicking the backdrop (default: true) */
  closeOnBackdropClick?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
  size = 'md',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    },
    [open, onClose]
  );

  // Focus trap: keep Tab/Shift+Tab inside modal
  const handleKeyDownPanel = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = getFocusables(panelRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;

    const firstFocusable = panelRef.current
      ? getFocusables(panelRef.current)[0]
      : null;
    if (firstFocusable) {
      firstFocusable.focus();
    } else if (panelRef.current) {
      panelRef.current.focus();
    }

    return () => {
      if (previousActiveRef.current?.focus) {
        previousActiveRef.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDownPanel}
        className={cn(modalPanelVariants({ size }))}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 id={titleId} className="text-base md:text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 touch-manipulation rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
