'use client';

import { useToastStore } from '@/stores/useToastStore';
import { ToastContainer } from './ToastContainer';

export interface ToastProviderProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({ position = 'top-right' }: ToastProviderProps) {
  const { toasts, removeToast } = useToastStore();

  return <ToastContainer toasts={toasts} onClose={removeToast} position={position} />;
}
