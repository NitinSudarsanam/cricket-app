/**
 * Zustand store for toast notifications
 * Manages toast messages for success, error, warning, and info notifications
 * 
 * Requirements: General error handling
 */

import { create } from 'zustand';
import { ToastType } from '@/components/Toast';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  
  // Add toast
  addToast: (toast: Omit<Toast, 'id'>) => string;
  
  // Convenience methods
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number, action?: Toast['action']) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  
  // Remove toast
  removeToast: (id: string) => void;
  
  // Clear all toasts
  clearAll: () => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    return id;
  },

  success: (message, duration) => {
    return get().addToast({ type: 'success', message, duration });
  },

  error: (message, duration, action) => {
    return get().addToast({ type: 'error', message, duration, action });
  },

  warning: (message, duration) => {
    return get().addToast({ type: 'warning', message, duration });
  },

  info: (message, duration) => {
    return get().addToast({ type: 'info', message, duration });
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));
