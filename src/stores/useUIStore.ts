/**
 * Zustand store for UI state management
 * Stores loading states, error messages, and modal open/close states
 * 
 * Requirements: General UX
 */

import { create } from 'zustand';

interface LoadingStates {
  draft: boolean;
  players: boolean;
  config: boolean;
  participants: boolean;
  makingPick: boolean;
  startingDraft: boolean;
  importing: boolean;
}

interface ModalStates {
  addPlayer: boolean;
  editPlayer: boolean;
  deletePlayer: boolean;
  importPlayers: boolean;
  addParticipant: boolean;
  draftComplete: boolean;
  confirmReset: boolean;
  confirmPause: boolean;
}

interface UIStore {
  // Loading states
  loading: LoadingStates;
  setLoading: (key: keyof LoadingStates, value: boolean) => void;
  setMultipleLoading: (updates: Partial<LoadingStates>) => void;
  isAnyLoading: () => boolean;

  // Error states
  error: string | null;
  errors: Record<string, string>;
  setError: (error: string | null) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  hasErrors: () => boolean;

  // Success messages
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;
  clearSuccessMessage: () => void;

  // Modal states
  modals: ModalStates;
  openModal: (modal: keyof ModalStates) => void;
  closeModal: (modal: keyof ModalStates) => void;
  closeAllModals: () => void;
  isAnyModalOpen: () => boolean;

  // Selected items (for edit/delete operations)
  selectedPlayerId: string | null;
  selectedParticipantId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  setSelectedParticipantId: (id: string | null) => void;

  // Connection state
  connectionState: 'connected' | 'disconnected' | 'connecting';
  setConnectionState: (state: 'connected' | 'disconnected' | 'connecting') => void;

  // Reset
  reset: () => void;
}

const initialLoadingStates: LoadingStates = {
  draft: false,
  players: false,
  config: false,
  participants: false,
  makingPick: false,
  startingDraft: false,
  importing: false,
};

const initialModalStates: ModalStates = {
  addPlayer: false,
  editPlayer: false,
  deletePlayer: false,
  importPlayers: false,
  addParticipant: false,
  draftComplete: false,
  confirmReset: false,
  confirmPause: false,
};

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  loading: initialLoadingStates,
  error: null,
  errors: {},
  successMessage: null,
  modals: initialModalStates,
  selectedPlayerId: null,
  selectedParticipantId: null,
  connectionState: 'disconnected',

  // Loading actions
  setLoading: (key, value) => {
    set(state => ({
      loading: { ...state.loading, [key]: value },
    }));
  },

  setMultipleLoading: (updates) => {
    set(state => ({
      loading: { ...state.loading, ...updates },
    }));
  },

  isAnyLoading: () => {
    const { loading } = get();
    return Object.values(loading).some(value => value === true);
  },

  // Error actions
  setError: (error) => {
    set({ error });
  },

  setFieldError: (field, error) => {
    set(state => ({
      errors: { ...state.errors, [field]: error },
    }));
  },

  clearFieldError: (field) => {
    set(state => {
      const { [field]: _, ...rest } = state.errors;
      return { errors: rest };
    });
  },

  clearAllErrors: () => {
    set({ error: null, errors: {} });
  },

  hasErrors: () => {
    const { error, errors } = get();
    return error !== null || Object.keys(errors).length > 0;
  },

  // Success message actions
  setSuccessMessage: (message) => {
    set({ successMessage: message });
  },

  clearSuccessMessage: () => {
    set({ successMessage: null });
  },

  // Modal actions
  openModal: (modal) => {
    set(state => ({
      modals: { ...state.modals, [modal]: true },
    }));
  },

  closeModal: (modal) => {
    set(state => ({
      modals: { ...state.modals, [modal]: false },
    }));
  },

  closeAllModals: () => {
    set({ modals: initialModalStates });
  },

  isAnyModalOpen: () => {
    const { modals } = get();
    return Object.values(modals).some(value => value === true);
  },

  // Selected items actions
  setSelectedPlayerId: (id) => {
    set({ selectedPlayerId: id });
  },

  setSelectedParticipantId: (id) => {
    set({ selectedParticipantId: id });
  },

  // Connection state actions
  setConnectionState: (state) => {
    set({ connectionState: state });
  },

  // Reset
  reset: () => {
    set({
      loading: initialLoadingStates,
      error: null,
      errors: {},
      successMessage: null,
      modals: initialModalStates,
      selectedPlayerId: null,
      selectedParticipantId: null,
      connectionState: 'disconnected',
    });
  },
}));
