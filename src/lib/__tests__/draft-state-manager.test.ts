/**
 * Unit Tests for Draft State Manager
 * 
 * Tests pure functions in draft-state-manager.ts (those that don't require Prisma).
 */

import { describe, it, expect } from 'vitest';
import {
  getCurrentParticipantId,
  calculatePickNumber,
} from '../draft-state-manager';
import type { DraftState } from '@/types';
import { createDraftState } from '@/__tests__/helpers/mock-factories';

describe('getCurrentParticipantId', () => {
  it('should return correct participant for linear order in odd round', () => {
    const draftState = createDraftState({
      currentRound: 1,
      currentPickIndex: 1,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'linear',
    });

    const result = getCurrentParticipantId(draftState, 'linear');
    expect(result).toBe('p2');
  });

  it('should return correct participant for snake order in odd round', () => {
    const draftState = createDraftState({
      currentRound: 1,
      currentPickIndex: 1,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'snake',
    });

    const result = getCurrentParticipantId(draftState, 'snake');
    expect(result).toBe('p2');
  });

  it('should return correct participant for snake order in even round (reversed)', () => {
    const draftState = createDraftState({
      currentRound: 2,
      currentPickIndex: 0,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'snake',
    });

    const result = getCurrentParticipantId(draftState, 'snake');
    expect(result).toBe('p3'); // Reversed: index 0 -> last participant
  });

  it('should return correct participant for snake order in even round at middle index', () => {
    const draftState = createDraftState({
      currentRound: 2,
      currentPickIndex: 1,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'snake',
    });

    const result = getCurrentParticipantId(draftState, 'snake');
    expect(result).toBe('p2'); // Reversed: index 1 -> middle participant
  });

  it('should return first participant when pickIndex is 0 in odd round', () => {
    const draftState = createDraftState({
      currentRound: 1,
      currentPickIndex: 0,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'snake',
    });

    const result = getCurrentParticipantId(draftState, 'snake');
    expect(result).toBe('p1');
  });

  it('should return last participant when pickIndex is 0 in even round (snake)', () => {
    const draftState = createDraftState({
      currentRound: 2,
      currentPickIndex: 0,
      participantOrder: ['p1', 'p2', 'p3'],
      draftOrderType: 'snake',
    });

    const result = getCurrentParticipantId(draftState, 'snake');
    expect(result).toBe('p3');
  });
});

describe('calculatePickNumber', () => {
  it('should calculate pick number for first round, first pick', () => {
    const result = calculatePickNumber(1, 0, 4);
    expect(result).toBe(1);
  });

  it('should calculate pick number for first round, last pick', () => {
    const result = calculatePickNumber(1, 3, 4);
    expect(result).toBe(4);
  });

  it('should calculate pick number for second round, first pick', () => {
    const result = calculatePickNumber(2, 0, 4);
    expect(result).toBe(5);
  });

  it('should calculate pick number for second round, last pick', () => {
    const result = calculatePickNumber(2, 3, 4);
    expect(result).toBe(8);
  });

  it('should calculate pick number for third round, middle pick', () => {
    const result = calculatePickNumber(3, 2, 4);
    expect(result).toBe(11); // (3-1)*4 + 2 + 1 = 8 + 2 + 1 = 11
  });

  it('should handle single participant correctly', () => {
    const result = calculatePickNumber(5, 0, 1);
    expect(result).toBe(5); // (5-1)*1 + 0 + 1 = 5
  });
});
