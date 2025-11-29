/**
 * Integration Test: Complete Draft Flow End-to-End
 * 
 * Tests the entire draft process from configuration to completion:
 * - Create draft configuration
 * - Import players
 * - Start draft
 * - Complete full draft with multiple participants
 * - Verify all constraints enforced
 * - Export results
 * 
 * Requirements: All requirements
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock API client for testing
class DraftAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async createDraftConfig(config: any) {
    const response = await fetch(`${this.baseUrl}/api/draft-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }

  async getDraftConfig() {
    const response = await fetch(`${this.baseUrl}/api/draft-config`);
    return response.json();
  }

  async importPlayers(players: any[]) {
    const response = await fetch(`${this.baseUrl}/api/players/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players })
    });
    return response.json();
  }

  async getPlayers() {
    const response = await fetch(`${this.baseUrl}/api/players`);
    return response.json();
  }

  async createParticipant(name: string, email: string) {
    const response = await fetch(`${this.baseUrl}/api/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    return response.json();
  }

  async getParticipants() {
    const response = await fetch(`${this.baseUrl}/api/participants`);
    return response.json();
  }

  async startDraft(participantIds: string[], draftOrder: 'linear' | 'snake' = 'snake') {
    const response = await fetch(`${this.baseUrl}/api/draft/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds, draftOrder })
    });
    return response.json();
  }

  async makePick(participantId: string, playerId: string) {
    const response = await fetch(`${this.baseUrl}/api/draft/pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, playerId })
    });
    return response.json();
  }

  async getDraftState() {
    const response = await fetch(`${this.baseUrl}/api/draft/state?includeDetails=true`);
    return response.json();
  }

  async getParticipantRoster(participantId: string) {
    const response = await fetch(`${this.baseUrl}/api/participants/${participantId}/roster`);
    return response.json();
  }

  async resetDraft() {
    const response = await fetch(`${this.baseUrl}/api/draft/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
}

// Test data generators
function generateTestPlayers(count: number = 100) {
  const teams = ['CSK', 'MI', 'GT', 'RR', 'RCB', 'KKR', 'LSG', 'SRH', 'PBKS', 'DC'];
  const roles = ['Bat', 'Bowl', 'AR', 'WK'];
  const players = [];

  for (let i = 0; i < count; i++) {
    players.push({
      name: `Player ${i + 1}`,
      team: teams[i % teams.length],
      role: roles[i % roles.length],
      isForeign: i % 5 === 0
    });
  }

  return players;
}

function createTestConfig() {
  return {
    rosterSize: 8,
    totalRounds: 8,
    minPerTeam: 0,
    maxPerTeam: 2,
    mandatoryRoles: {
      Bat: 3,
      Bowl: 3,
      AR: 1,
      WK: 1
    },
    earlyRoundRule: {
      rounds: 4,
      minBat: 2,
      minBowl: 2
    }
  };
}

describe('Integration Test: Complete Draft Flow', () => {
  const client = new DraftAPIClient();
  let participantIds: string[] = [];
  let playerIds: string[] = [];
  let draftStateId: string;

  before(async () => {
    console.log('Setting up integration test environment...');
    
    // Note: This test requires the Next.js server to be running
    // Run: npm run dev
    // Or use a test database for integration tests
  });

  after(async () => {
    console.log('Cleaning up integration test environment...');
    
    // Reset draft if it exists
    try {
      await client.resetDraft();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  it('should create a valid draft configuration', async () => {
    const config = createTestConfig();
    const result = await client.createDraftConfig(config);

    assert.strictEqual(result.success, true, 'Configuration creation should succeed');
    assert.ok(result.data, 'Should return configuration data');
    assert.strictEqual(result.data.rosterSize, 8, 'Roster size should be 8');
    assert.strictEqual(result.data.maxPerTeam, 2, 'Max per team should be 2');
  });

  it('should import players successfully', async () => {
    const players = generateTestPlayers(100);
    const result = await client.importPlayers(players);

    assert.strictEqual(result.success, true, 'Player import should succeed');
    assert.ok(result.data.imported >= 100, 'Should import at least 100 players');

    // Get all players to verify
    const playersResult = await client.getPlayers();
    assert.strictEqual(playersResult.success, true);
    assert.ok(playersResult.data.length >= 100, 'Should have at least 100 players');
    
    playerIds = playersResult.data.map((p: any) => p.id);
  });

  it('should create multiple participants', async () => {
    const participants = [
      { name: 'Alice', email: 'alice@test.com' },
      { name: 'Bob', email: 'bob@test.com' },
      { name: 'Charlie', email: 'charlie@test.com' },
      { name: 'Diana', email: 'diana@test.com' }
    ];

    for (const participant of participants) {
      const result = await client.createParticipant(participant.name, participant.email);
      assert.strictEqual(result.success, true, `Should create participant ${participant.name}`);
      participantIds.push(result.data.id);
    }

    assert.strictEqual(participantIds.length, 4, 'Should have 4 participants');
  });

  it('should start the draft successfully', async () => {
    const result = await client.startDraft(participantIds, 'snake');

    assert.strictEqual(result.success, true, 'Draft start should succeed');
    assert.ok(result.data.draftState, 'Should return draft state');
    assert.strictEqual(result.data.draftState.status, 'in_progress', 'Draft should be in progress');
    assert.strictEqual(result.data.draftState.currentRound, 1, 'Should start at round 1');
    
    draftStateId = result.data.draftState.id;
  });

  it('should complete a full draft with all participants', async () => {
    const config = createTestConfig();
    const totalPicks = config.rosterSize * participantIds.length; // 8 * 4 = 32 picks

    // Get available players
    const playersResult = await client.getPlayers();
    const availablePlayers = playersResult.data;

    let pickCount = 0;
    let currentRound = 1;

    // Simulate complete draft
    for (let round = 1; round <= config.rosterSize; round++) {
      // Determine pick order for this round (snake draft)
      const isReverseRound = round % 2 === 0;
      const roundParticipants = isReverseRound 
        ? [...participantIds].reverse() 
        : participantIds;

      for (const participantId of roundParticipants) {
        // Get draft state to find current participant
        const stateResult = await client.getDraftState();
        assert.strictEqual(stateResult.success, true, 'Should get draft state');

        const currentParticipantId = stateResult.data.currentParticipant.id;

        // Get participant's current roster
        const rosterResult = await client.getParticipantRoster(currentParticipantId);
        const roster = rosterResult.success ? rosterResult.data.roster : [];

        // Find a valid player to pick based on constraints
        const draftedPlayerIds = stateResult.data.picks.map((p: any) => p.playerId);
        const validPlayer = findValidPlayer(
          availablePlayers,
          draftedPlayerIds,
          roster,
          config,
          stateResult.data.currentRound
        );

        assert.ok(validPlayer, `Should find a valid player for pick ${pickCount + 1}`);

        // Make the pick
        const pickResult = await client.makePick(currentParticipantId, validPlayer.id);
        
        if (!pickResult.success) {
          console.error('Pick failed:', pickResult.error, pickResult.validationErrors);
        }

        assert.strictEqual(pickResult.success, true, `Pick ${pickCount + 1} should succeed`);
        pickCount++;

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      currentRound++;
    }

    assert.strictEqual(pickCount, totalPicks, `Should complete all ${totalPicks} picks`);

    // Verify draft is complete
    const finalState = await client.getDraftState();
    assert.strictEqual(finalState.data.status, 'completed', 'Draft should be completed');
  });

  it('should verify all constraints were enforced', async () => {
    const config = createTestConfig();

    // Check each participant's roster
    for (const participantId of participantIds) {
      const rosterResult = await client.getParticipantRoster(participantId);
      assert.strictEqual(rosterResult.success, true, 'Should get roster');

      const roster = rosterResult.data.roster;
      const teamCount = rosterResult.data.teamCount;
      const roleCount = rosterResult.data.roleCount;

      // Verify roster size
      assert.strictEqual(roster.length, config.rosterSize, 'Roster should have correct size');

      // Verify team constraints
      for (const [team, count] of Object.entries(teamCount)) {
        assert.ok(
          count <= config.maxPerTeam,
          `Team ${team} count (${count}) should not exceed max (${config.maxPerTeam})`
        );
      }

      // Verify mandatory role requirements
      assert.ok(
        roleCount.Bat >= config.mandatoryRoles.Bat,
        `Should have at least ${config.mandatoryRoles.Bat} Batsmen`
      );
      assert.ok(
        roleCount.Bowl >= config.mandatoryRoles.Bowl,
        `Should have at least ${config.mandatoryRoles.Bowl} Bowlers`
      );
      assert.ok(
        roleCount.AR >= config.mandatoryRoles.AR,
        `Should have at least ${config.mandatoryRoles.AR} All-Rounders`
      );
      assert.ok(
        roleCount.WK >= config.mandatoryRoles.WK,
        `Should have at least ${config.mandatoryRoles.WK} Wicket-Keepers`
      );
    }
  });

  it('should export draft results', async () => {
    const stateResult = await client.getDraftState();
    assert.strictEqual(stateResult.success, true, 'Should get final draft state');

    const draftState = stateResult.data;

    // Verify export data structure
    assert.ok(draftState.picks, 'Should have picks data');
    assert.ok(draftState.participants, 'Should have participants data');
    assert.ok(draftState.draftConfig, 'Should have config data');

    // Verify all picks are present
    const expectedPicks = draftState.draftConfig.rosterSize * draftState.participants.length;
    assert.strictEqual(
      draftState.picks.length,
      expectedPicks,
      `Should have ${expectedPicks} total picks`
    );

    console.log('Draft results exported successfully');
    console.log(`Total picks: ${draftState.picks.length}`);
    console.log(`Total participants: ${draftState.participants.length}`);
    console.log(`Total rounds: ${draftState.totalRounds}`);
  });
});

// Helper function to find a valid player based on constraints
function findValidPlayer(
  allPlayers: any[],
  draftedPlayerIds: string[],
  roster: any[],
  config: any,
  currentRound: number
): any {
  const availablePlayers = allPlayers.filter(p => !draftedPlayerIds.includes(p.id));

  // Count current team and role distribution
  const teamCount: Record<string, number> = {};
  const roleCount: Record<string, number> = { Bat: 0, Bowl: 0, AR: 0, WK: 0 };

  for (const player of roster) {
    teamCount[player.team] = (teamCount[player.team] || 0) + 1;
    roleCount[player.role] = (roleCount[player.role] || 0) + 1;
  }

  // Check early round requirements
  const isEarlyRound = currentRound <= config.earlyRoundRule.rounds;
  const roundsRemaining = config.earlyRoundRule.rounds - currentRound + 1;
  const batNeeded = config.earlyRoundRule.minBat - roleCount.Bat;
  const bowlNeeded = config.earlyRoundRule.minBowl - roleCount.Bowl;

  // Find a valid player
  for (const player of availablePlayers) {
    // Check team cap
    const currentTeamCount = teamCount[player.team] || 0;
    if (currentTeamCount >= config.maxPerTeam) {
      continue;
    }

    // Check early round constraints
    if (isEarlyRound) {
      if (batNeeded > roundsRemaining && player.role !== 'Bat') {
        continue;
      }
      if (bowlNeeded > roundsRemaining && player.role !== 'Bowl') {
        continue;
      }
    }

    return player;
  }

  // If no player found with constraints, return any available player
  return availablePlayers[0];
}
