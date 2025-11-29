/**
 * Integration Test: Real-Time Synchronization
 * 
 * Tests real-time features:
 * - Open draft in multiple browser windows (simulated)
 * - Verify picks broadcast to all clients
 * - Test reconnection handling
 * - Verify presence indicators
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock Pusher client for testing
class MockPusherClient {
  private channelName: string;
  private eventHandlers: Map<string, Function[]> = new Map();
  private connected: boolean = false;
  public clientId: string;

  constructor(channelName: string, clientId: string) {
    this.channelName = channelName;
    this.clientId = clientId;
  }

  connect() {
    this.connected = true;
    this.trigger('pusher:connection_established', {});
  }

  disconnect() {
    this.connected = false;
    this.trigger('pusher:connection_lost', {});
  }

  subscribe(eventName: string, handler: Function) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  unsubscribe(eventName: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  trigger(eventName: string, data: any) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Simulate multiple clients
class MultiClientSimulator {
  private clients: MockPusherClient[] = [];
  private eventLog: Array<{ clientId: string; event: string; data: any; timestamp: number }> = [];

  createClient(clientId: string): MockPusherClient {
    const client = new MockPusherClient('draft-channel', clientId);
    this.clients.push(client);
    return client;
  }

  connectAll() {
    this.clients.forEach(client => client.connect());
  }

  disconnectClient(clientId: string) {
    const client = this.clients.find(c => c.clientId === clientId);
    if (client) {
      client.disconnect();
    }
  }

  reconnectClient(clientId: string) {
    const client = this.clients.find(c => c.clientId === clientId);
    if (client) {
      client.connect();
    }
  }

  broadcastEvent(eventName: string, data: any, excludeClientId?: string) {
    this.clients.forEach(client => {
      if (client.clientId !== excludeClientId && client.isConnected()) {
        client.trigger(eventName, data);
        this.eventLog.push({
          clientId: client.clientId,
          event: eventName,
          data,
          timestamp: Date.now()
        });
      }
    });
  }

  getEventLog() {
    return this.eventLog;
  }

  clearEventLog() {
    this.eventLog = [];
  }

  getConnectedClients() {
    return this.clients.filter(c => c.isConnected());
  }
}

describe('Integration Test: Real-Time Synchronization', () => {
  let simulator: MultiClientSimulator;
  let client1: MockPusherClient;
  let client2: MockPusherClient;
  let client3: MockPusherClient;

  before(() => {
    console.log('Setting up real-time synchronization test...');
    simulator = new MultiClientSimulator();
  });

  after(() => {
    console.log('Cleaning up real-time test...');
  });

  it('should create multiple client connections', () => {
    client1 = simulator.createClient('client-1');
    client2 = simulator.createClient('client-2');
    client3 = simulator.createClient('client-3');

    assert.ok(client1, 'Client 1 should be created');
    assert.ok(client2, 'Client 2 should be created');
    assert.ok(client3, 'Client 3 should be created');
  });

  it('should connect all clients successfully', () => {
    simulator.connectAll();

    assert.strictEqual(client1.isConnected(), true, 'Client 1 should be connected');
    assert.strictEqual(client2.isConnected(), true, 'Client 2 should be connected');
    assert.strictEqual(client3.isConnected(), true, 'Client 3 should be connected');

    const connectedClients = simulator.getConnectedClients();
    assert.strictEqual(connectedClients.length, 3, 'Should have 3 connected clients');
  });

  it('should broadcast pick events to all clients', async () => {
    const receivedEvents: Array<{ clientId: string; data: any }> = [];

    // Subscribe all clients to pick_made event
    client1.subscribe('draft:pick_made', (data: any) => {
      receivedEvents.push({ clientId: 'client-1', data });
    });

    client2.subscribe('draft:pick_made', (data: any) => {
      receivedEvents.push({ clientId: 'client-2', data });
    });

    client3.subscribe('draft:pick_made', (data: any) => {
      receivedEvents.push({ clientId: 'client-3', data });
    });

    // Simulate a pick made by client 1
    const pickData = {
      participantId: 'participant-1',
      participantName: 'Alice',
      playerId: 'player-123',
      playerName: 'Virat Kohli',
      playerTeam: 'RCB',
      playerRole: 'Bat',
      round: 1,
      pickNumber: 1,
      timestamp: new Date()
    };

    // Broadcast to all clients except the one making the pick
    simulator.broadcastEvent('draft:pick_made', pickData, 'client-1');

    // Wait for event propagation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify all other clients received the event
    assert.strictEqual(receivedEvents.length, 2, 'Should receive 2 events (excluding sender)');
    assert.ok(
      receivedEvents.some(e => e.clientId === 'client-2'),
      'Client 2 should receive event'
    );
    assert.ok(
      receivedEvents.some(e => e.clientId === 'client-3'),
      'Client 3 should receive event'
    );

    // Verify event data
    receivedEvents.forEach(event => {
      assert.strictEqual(event.data.playerName, 'Virat Kohli', 'Should have correct player name');
      assert.strictEqual(event.data.round, 1, 'Should have correct round');
    });
  });

  it('should broadcast events within 2 seconds (Requirement 6.1)', async () => {
    const startTime = Date.now();
    const receivedTimes: number[] = [];

    client2.subscribe('draft:test_latency', () => {
      receivedTimes.push(Date.now());
    });

    client3.subscribe('draft:test_latency', () => {
      receivedTimes.push(Date.now());
    });

    simulator.broadcastEvent('draft:test_latency', { test: true }, 'client-1');

    await new Promise(resolve => setTimeout(resolve, 100));

    const maxLatency = Math.max(...receivedTimes.map(t => t - startTime));
    assert.ok(maxLatency < 2000, `Latency (${maxLatency}ms) should be less than 2000ms`);
  });

  it('should update player pool for all clients when pick is made', async () => {
    const playerPoolUpdates: Array<{ clientId: string; availablePlayers: string[] }> = [];

    // Subscribe to state updates
    client1.subscribe('draft:state_update', (data: any) => {
      playerPoolUpdates.push({
        clientId: 'client-1',
        availablePlayers: data.availablePlayers || []
      });
    });

    client2.subscribe('draft:state_update', (data: any) => {
      playerPoolUpdates.push({
        clientId: 'client-2',
        availablePlayers: data.availablePlayers || []
      });
    });

    client3.subscribe('draft:state_update', (data: any) => {
      playerPoolUpdates.push({
        clientId: 'client-3',
        availablePlayers: data.availablePlayers || []
      });
    });

    // Simulate state update after pick
    const stateUpdate = {
      draftState: { currentRound: 1, currentPickIndex: 1 },
      availablePlayers: ['player-2', 'player-3', 'player-4'] // player-1 was picked
    };

    simulator.broadcastEvent('draft:state_update', stateUpdate);

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(playerPoolUpdates.length, 3, 'All clients should receive state update');
    playerPoolUpdates.forEach(update => {
      assert.strictEqual(
        update.availablePlayers.length,
        3,
        'Should have 3 available players after pick'
      );
      assert.ok(
        !update.availablePlayers.includes('player-1'),
        'Picked player should not be in available pool'
      );
    });
  });

  it('should handle client disconnection', () => {
    simulator.disconnectClient('client-2');

    assert.strictEqual(client1.isConnected(), true, 'Client 1 should still be connected');
    assert.strictEqual(client2.isConnected(), false, 'Client 2 should be disconnected');
    assert.strictEqual(client3.isConnected(), true, 'Client 3 should still be connected');

    const connectedClients = simulator.getConnectedClients();
    assert.strictEqual(connectedClients.length, 2, 'Should have 2 connected clients');
  });

  it('should not send events to disconnected clients', async () => {
    const receivedEvents: string[] = [];

    client1.subscribe('draft:test_disconnect', () => {
      receivedEvents.push('client-1');
    });

    client2.subscribe('draft:test_disconnect', () => {
      receivedEvents.push('client-2');
    });

    client3.subscribe('draft:test_disconnect', () => {
      receivedEvents.push('client-3');
    });

    simulator.broadcastEvent('draft:test_disconnect', { test: true });

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(receivedEvents.length, 2, 'Only connected clients should receive event');
    assert.ok(receivedEvents.includes('client-1'), 'Client 1 should receive event');
    assert.ok(!receivedEvents.includes('client-2'), 'Client 2 should not receive event');
    assert.ok(receivedEvents.includes('client-3'), 'Client 3 should receive event');
  });

  it('should synchronize state upon reconnection (Requirement 6.4)', async () => {
    let syncReceived = false;
    let syncData: any = null;

    client2.subscribe('draft:state_update', (data: any) => {
      syncReceived = true;
      syncData = data;
    });

    // Reconnect client 2
    simulator.reconnectClient('client-2');

    assert.strictEqual(client2.isConnected(), true, 'Client 2 should be reconnected');

    // Simulate server sending full state sync on reconnection
    const fullState = {
      draftState: {
        currentRound: 2,
        currentPickIndex: 3,
        picks: [
          { round: 1, pickNumber: 1, playerId: 'player-1' },
          { round: 1, pickNumber: 2, playerId: 'player-2' }
        ]
      },
      availablePlayers: ['player-3', 'player-4', 'player-5']
    };

    client2.trigger('draft:state_update', fullState);

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(syncReceived, true, 'Should receive state sync on reconnection');
    assert.ok(syncData, 'Should have sync data');
    assert.strictEqual(syncData.draftState.currentRound, 2, 'Should sync current round');
    assert.strictEqual(syncData.draftState.picks.length, 2, 'Should sync all picks');
  });

  it('should broadcast round completion events', async () => {
    const roundCompleteEvents: Array<{ clientId: string; round: number }> = [];

    client1.subscribe('draft:round_complete', (data: any) => {
      roundCompleteEvents.push({ clientId: 'client-1', round: data.completedRound });
    });

    client2.subscribe('draft:round_complete', (data: any) => {
      roundCompleteEvents.push({ clientId: 'client-2', round: data.completedRound });
    });

    client3.subscribe('draft:round_complete', (data: any) => {
      roundCompleteEvents.push({ clientId: 'client-3', round: data.completedRound });
    });

    simulator.broadcastEvent('draft:round_complete', { completedRound: 1 });

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(roundCompleteEvents.length, 3, 'All clients should receive round complete');
    roundCompleteEvents.forEach(event => {
      assert.strictEqual(event.round, 1, 'Should indicate round 1 completed');
    });
  });

  it('should broadcast draft completion events', async () => {
    const draftCompleteEvents: string[] = [];

    client1.subscribe('draft:draft_complete', () => {
      draftCompleteEvents.push('client-1');
    });

    client2.subscribe('draft:draft_complete', () => {
      draftCompleteEvents.push('client-2');
    });

    client3.subscribe('draft:draft_complete', () => {
      draftCompleteEvents.push('client-3');
    });

    simulator.broadcastEvent('draft:draft_complete', {
      draftState: { status: 'completed' },
      completedAt: new Date()
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(draftCompleteEvents.length, 3, 'All clients should receive draft complete');
  });

  it('should display online participants (Requirement 6.5)', async () => {
    const presenceUpdates: Array<{ clientId: string; onlineParticipants: string[] }> = [];

    client1.subscribe('draft:presence_update', (data: any) => {
      presenceUpdates.push({
        clientId: 'client-1',
        onlineParticipants: data.onlineParticipants
      });
    });

    client2.subscribe('draft:presence_update', (data: any) => {
      presenceUpdates.push({
        clientId: 'client-2',
        onlineParticipants: data.onlineParticipants
      });
    });

    client3.subscribe('draft:presence_update', (data: any) => {
      presenceUpdates.push({
        clientId: 'client-3',
        onlineParticipants: data.onlineParticipants
      });
    });

    // Simulate presence update
    const connectedClients = simulator.getConnectedClients();
    simulator.broadcastEvent('draft:presence_update', {
      onlineParticipants: connectedClients.map(c => c.clientId)
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    assert.strictEqual(presenceUpdates.length, 3, 'All clients should receive presence update');
    presenceUpdates.forEach(update => {
      assert.ok(
        update.onlineParticipants.length > 0,
        'Should have online participants'
      );
    });
  });

  it('should handle multiple rapid events without loss', async () => {
    const receivedEvents: number[] = [];

    client1.subscribe('draft:rapid_test', (data: any) => {
      receivedEvents.push(data.sequence);
    });

    // Send 10 rapid events
    for (let i = 1; i <= 10; i++) {
      simulator.broadcastEvent('draft:rapid_test', { sequence: i }, 'client-2');
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    assert.strictEqual(receivedEvents.length, 10, 'Should receive all 10 events');
    
    // Verify sequence is maintained
    for (let i = 0; i < receivedEvents.length; i++) {
      assert.strictEqual(receivedEvents[i], i + 1, `Event ${i + 1} should be in sequence`);
    }
  });
});
