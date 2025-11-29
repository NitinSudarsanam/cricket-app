/**
 * Zustand store for draft state management
 * Stores current draft state, available players, and current participant's roster
 * 
 * Requirements: 5.6, 5.7, 6.2, 6.3
 */

import { create } from 'zustand';
import { DraftState, Player, FantasyTeam, IPLTeam, PlayerRole } from '@/types';

interface DraftStore {
  // State
  draftState: DraftState | null;
  availablePlayers: Player[];
  currentParticipantRoster: Player[];
  allParticipants: FantasyTeam[];
  lastUpdate: Date | null;

  // Computed state helpers
  getCurrentParticipant: () => FantasyTeam | null;
  isMyTurn: (participantId: string) => boolean;
  getTeamCount: (participantId: string) => Record<IPLTeam, number>;
  getRoleCount: (participantId: string) => Record<PlayerRole, number>;
  
  // Actions
  setDraftState: (state: DraftState) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setCurrentParticipantRoster: (roster: Player[]) => void;
  setAllParticipants: (participants: FantasyTeam[]) => void;
  addPickToState: (pick: {
    participantId: string;
    playerId: string;
    round: number;
    pickNumber: number;
  }) => void;
  removePlayerFromAvailable: (playerId: string) => void;
  addPlayerToRoster: (participantId: string, player: Player) => void;
  updateLastUpdate: () => void;
  reset: () => void;
}

const initialState = {
  draftState: null,
  availablePlayers: [],
  currentParticipantRoster: [],
  allParticipants: [],
  lastUpdate: null,
};

export const useDraftStore = create<DraftStore>((set, get) => ({
  ...initialState,

  // Computed state helpers
  getCurrentParticipant: () => {
    const { draftState, allParticipants } = get();
    if (!draftState || draftState.participantOrder.length === 0) return null;
    
    const currentParticipantId = draftState.participantOrder[draftState.currentPickIndex];
    return allParticipants.find(p => p.id === currentParticipantId) || null;
  },

  isMyTurn: (participantId: string) => {
    const { draftState } = get();
    if (!draftState || draftState.participantOrder.length === 0) return false;
    
    const currentParticipantId = draftState.participantOrder[draftState.currentPickIndex];
    return currentParticipantId === participantId;
  },

  getTeamCount: (participantId: string) => {
    const { allParticipants } = get();
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
      return {
        CSK: 0, MI: 0, GT: 0, RR: 0, RCB: 0,
        KKR: 0, LSG: 0, SRH: 0, PBKS: 0, DC: 0
      };
    }
    
    return participant.teamCount;
  },

  getRoleCount: (participantId: string) => {
    const { allParticipants } = get();
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
      return { Bat: 0, Bowl: 0, AR: 0, WK: 0 };
    }
    
    return participant.roleCount;
  },

  // Actions
  setDraftState: (state: DraftState) => {
    set({ draftState: state, lastUpdate: new Date() });
  },

  setAvailablePlayers: (players: Player[]) => {
    set({ availablePlayers: players });
  },

  setCurrentParticipantRoster: (roster: Player[]) => {
    set({ currentParticipantRoster: roster });
  },

  setAllParticipants: (participants: FantasyTeam[]) => {
    set({ allParticipants: participants });
  },

  addPickToState: (pick) => {
    const { draftState } = get();
    if (!draftState) return;

    const updatedPicks = [
      ...draftState.picks,
      {
        ...pick,
        timestamp: new Date(),
      },
    ];

    // Calculate next pick index
    const totalParticipants = draftState.participantOrder.length;
    let nextPickIndex = draftState.currentPickIndex + 1;
    let nextRound = draftState.currentRound;

    // Check if we've completed a round
    if (nextPickIndex >= totalParticipants) {
      nextPickIndex = 0;
      nextRound += 1;
    }

    set({
      draftState: {
        ...draftState,
        picks: updatedPicks,
        currentPickIndex: nextPickIndex,
        currentRound: nextRound,
      },
      lastUpdate: new Date(),
    });
  },

  removePlayerFromAvailable: (playerId: string) => {
    const { availablePlayers } = get();
    set({
      availablePlayers: availablePlayers.filter(p => p.id !== playerId),
    });
  },

  addPlayerToRoster: (participantId: string, player: Player) => {
    const { allParticipants, currentParticipantRoster } = get();
    
    // Update all participants
    const updatedParticipants = allParticipants.map(p => {
      if (p.id !== participantId) return p;
      
      const updatedPlayers = [...p.draftedPlayers, player];
      
      // Update team count
      const teamCount = { ...p.teamCount };
      teamCount[player.team] = (teamCount[player.team] || 0) + 1;
      
      // Update role count
      const roleCount = { ...p.roleCount };
      roleCount[player.role] = (roleCount[player.role] || 0) + 1;
      
      return {
        ...p,
        draftedPlayers: updatedPlayers,
        teamCount,
        roleCount,
      };
    });
    
    set({ allParticipants: updatedParticipants });
    
    // Update current participant roster if it's their pick
    const currentParticipant = updatedParticipants.find(p => p.id === participantId);
    if (currentParticipant) {
      set({ currentParticipantRoster: currentParticipant.draftedPlayers });
    }
  },

  updateLastUpdate: () => {
    set({ lastUpdate: new Date() });
  },

  reset: () => {
    set(initialState);
  },
}));
