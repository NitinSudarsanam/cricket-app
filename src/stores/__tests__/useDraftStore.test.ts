/**
 * Unit Tests for useDraftStore Zustand Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDraftStore } from '@/stores/useDraftStore';
import { createDraftState, createPlayer, createPlayers } from '@/__tests__/helpers/mock-factories';

describe('useDraftStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDraftStore.getState().reset();
  });

  describe('setDraftState', () => {
    it('should update draft state', () => {
      const draftState = createDraftState();
      useDraftStore.getState().setDraftState(draftState);
      
      expect(useDraftStore.getState().draftState).toEqual(draftState);
    });
  });

  describe('setAvailablePlayers', () => {
    it('should update available players', () => {
      const players = createPlayers(5);
      useDraftStore.getState().setAvailablePlayers(players);
      
      expect(useDraftStore.getState().availablePlayers).toEqual(players);
    });
  });

  describe('getCurrentParticipant', () => {
    it('should return null when no draft state', () => {
      expect(useDraftStore.getState().getCurrentParticipant()).toBeNull();
    });

    it('should return current participant for snake draft odd round', () => {
      const draftState = createDraftState({
        currentRound: 1,
        currentPickIndex: 0,
        participantOrder: ['p1', 'p2'],
        draftOrderType: 'snake',
      });
      useDraftStore.getState().setDraftState(draftState);
      
      const participants = [
        { id: 'p1', name: 'P1', draftedPlayers: [], teamCount: {} as any, roleCount: {} as any },
        { id: 'p2', name: 'P2', draftedPlayers: [], teamCount: {} as any, roleCount: {} as any },
      ];
      useDraftStore.getState().setAllParticipants(participants as any);
      
      expect(useDraftStore.getState().getCurrentParticipant()?.id).toBe('p1');
    });

    it('should return correct participant for snake draft even round (reversed)', () => {
      const draftState = createDraftState({
        currentRound: 2,
        currentPickIndex: 0,
        participantOrder: ['p1', 'p2'],
        draftOrderType: 'snake',
      });
      useDraftStore.getState().setDraftState(draftState);
      
      const participants = [
        { id: 'p1', name: 'P1', draftedPlayers: [], teamCount: {} as any, roleCount: {} as any },
        { id: 'p2', name: 'P2', draftedPlayers: [], teamCount: {} as any, roleCount: {} as any },
      ];
      useDraftStore.getState().setAllParticipants(participants as any);
      
      expect(useDraftStore.getState().getCurrentParticipant()?.id).toBe('p2');
    });
  });

  describe('isMyTurn', () => {
    it('should return false when no draft state', () => {
      expect(useDraftStore.getState().isMyTurn('p1')).toBe(false);
    });

    it('should return true when it is participant turn', () => {
      const draftState = createDraftState({
        currentRound: 1,
        currentPickIndex: 0,
        participantOrder: ['p1', 'p2'],
        draftOrderType: 'snake',
      });
      useDraftStore.getState().setDraftState(draftState);
      
      expect(useDraftStore.getState().isMyTurn('p1')).toBe(true);
      expect(useDraftStore.getState().isMyTurn('p2')).toBe(false);
    });
  });

  describe('addPickToState', () => {
    it('should add pick to draft state', () => {
      const draftState = createDraftState({
        picks: [],
        participantOrder: ['p1'],
      });
      useDraftStore.getState().setDraftState(draftState);
      
      useDraftStore.getState().addPickToState({
        participantId: 'p1',
        playerId: 'player-1',
        round: 1,
        pickNumber: 1,
      });
      
      const updatedState = useDraftStore.getState().draftState;
      expect(updatedState?.picks.length).toBe(1);
      expect(updatedState?.picks[0].playerId).toBe('player-1');
    });
  });

  describe('removePlayerFromAvailable', () => {
    it('should remove player from available players', () => {
      const players = createPlayers(3);
      useDraftStore.getState().setAvailablePlayers(players);
      
      useDraftStore.getState().removePlayerFromAvailable(players[0].id);
      
      const available = useDraftStore.getState().availablePlayers;
      expect(available.length).toBe(2);
      expect(available.find(p => p.id === players[0].id)).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const draftState = createDraftState();
      const players = createPlayers(5);
      
      useDraftStore.getState().setDraftState(draftState);
      useDraftStore.getState().setAvailablePlayers(players);
      
      useDraftStore.getState().reset();
      
      expect(useDraftStore.getState().draftState).toBeNull();
      expect(useDraftStore.getState().availablePlayers).toEqual([]);
    });
  });
});
