# Zustand Stores Documentation

This directory contains Zustand stores for state management in the Fantasy Cricket Draft application.

## Stores

### 1. useDraftStore

Manages draft-related state including draft state, available players, and participant rosters.

**State:**
- `draftState`: Current draft state (rounds, picks, status)
- `availablePlayers`: List of players not yet drafted
- `currentParticipantRoster`: Current participant's drafted players
- `allParticipants`: All participants with their rosters
- `lastUpdate`: Timestamp of last state update

**Actions:**
- `setDraftState(state)`: Update draft state
- `setAvailablePlayers(players)`: Set available players
- `setCurrentParticipantRoster(roster)`: Set current participant's roster
- `setAllParticipants(participants)`: Set all participants
- `addPickToState(pick)`: Add a pick and advance draft state
- `removePlayerFromAvailable(playerId)`: Remove player from available list
- `addPlayerToRoster(participantId, player)`: Add player to participant's roster
- `updateLastUpdate()`: Update last update timestamp
- `reset()`: Reset store to initial state

**Computed Helpers:**
- `getCurrentParticipant()`: Get participant currently on the clock
- `isMyTurn(participantId)`: Check if it's a specific participant's turn
- `getTeamCount(participantId)`: Get team count for a participant
- `getRoleCount(participantId)`: Get role count for a participant

**Example Usage:**

```tsx
'use client';

import { useDraftStore } from '@/stores';

function DraftBoard() {
  const {
    draftState,
    availablePlayers,
    currentParticipantRoster,
    isMyTurn,
    addPickToState,
  } = useDraftStore();

  const myTurn = isMyTurn('participant-123');

  const handlePlayerClick = (playerId: string) => {
    if (!myTurn) return;
    
    // Make pick via API
    // Then update store
    addPickToState({
      participantId: 'participant-123',
      playerId,
      round: draftState.currentRound,
      pickNumber: draftState.picks.length + 1,
    });
  };

  return (
    <div>
      <h2>Round {draftState?.currentRound}</h2>
      <div>
        {availablePlayers.map(player => (
          <button
            key={player.id}
            onClick={() => handlePlayerClick(player.id)}
            disabled={!myTurn}
          >
            {player.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2. useUIStore

Manages UI-related state including loading states, errors, modals, and connection status.

**State:**
- `loading`: Object with loading states for different operations
- `error`: Global error message
- `errors`: Field-specific error messages
- `successMessage`: Success message to display
- `modals`: Object with modal open/close states
- `selectedPlayerId`: Currently selected player ID
- `selectedParticipantId`: Currently selected participant ID
- `connectionState`: Real-time connection state

**Actions:**
- `setLoading(key, value)`: Set loading state for a specific operation
- `setMultipleLoading(updates)`: Set multiple loading states at once
- `isAnyLoading()`: Check if any operation is loading
- `setError(error)`: Set global error message
- `setFieldError(field, error)`: Set field-specific error
- `clearFieldError(field)`: Clear field-specific error
- `clearAllErrors()`: Clear all errors
- `hasErrors()`: Check if there are any errors
- `setSuccessMessage(message)`: Set success message
- `clearSuccessMessage()`: Clear success message
- `openModal(modal)`: Open a specific modal
- `closeModal(modal)`: Close a specific modal
- `closeAllModals()`: Close all modals
- `isAnyModalOpen()`: Check if any modal is open
- `setSelectedPlayerId(id)`: Set selected player ID
- `setSelectedParticipantId(id)`: Set selected participant ID
- `setConnectionState(state)`: Set connection state
- `reset()`: Reset store to initial state

**Example Usage:**

```tsx
'use client';

import { useUIStore } from '@/stores';

function PlayerManagement() {
  const {
    loading,
    error,
    modals,
    selectedPlayerId,
    setLoading,
    setError,
    openModal,
    closeModal,
    setSelectedPlayerId,
  } = useUIStore();

  const handleAddPlayer = async () => {
    setLoading('players', true);
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        body: JSON.stringify(playerData),
      });
      
      if (!response.ok) throw new Error('Failed to add player');
      
      closeModal('addPlayer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('players', false);
    }
  };

  const handleEditClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    openModal('editPlayer');
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {loading.players && <div>Loading...</div>}
      
      <button onClick={() => openModal('addPlayer')}>
        Add Player
      </button>
      
      {modals.addPlayer && (
        <AddPlayerModal onClose={() => closeModal('addPlayer')} />
      )}
    </div>
  );
}
```

## Integration with Real-Time Updates

### useDraftWithStore Hook

This hook integrates real-time updates with the Zustand stores automatically.

**Example Usage:**

```tsx
'use client';

import { useEffect } from 'react';
import { useDraftWithStore } from '@/hooks/useDraftWithStore';
import { useDraftStore } from '@/stores';

function DraftPage({ participantId }: { participantId: string }) {
  const { draftState, availablePlayers } = useDraftStore();
  
  // Automatically syncs real-time updates with stores
  const { isSubscribed } = useDraftWithStore({
    participantId,
    participantName: 'John Doe',
    enabled: true,
    onPickMade: (pick) => {
      console.log('Pick made:', pick);
    },
    onRoundComplete: (round) => {
      console.log('Round complete:', round);
    },
    onDraftComplete: () => {
      console.log('Draft complete!');
    },
  });

  return (
    <div>
      <div>Connection: {isSubscribed ? 'Connected' : 'Disconnected'}</div>
      <div>Round: {draftState?.currentRound}</div>
      <div>Available Players: {availablePlayers.length}</div>
    </div>
  );
}
```

## Best Practices

1. **Use stores in client components only**: Zustand stores work only in client components. Add `'use client'` directive at the top of files using stores.

2. **Selective subscriptions**: Only subscribe to the state you need to avoid unnecessary re-renders:
   ```tsx
   const draftState = useDraftStore(state => state.draftState);
   const isMyTurn = useDraftStore(state => state.isMyTurn);
   ```

3. **Batch updates**: When updating multiple pieces of state, use a single action that updates everything at once.

4. **Reset on unmount**: Reset stores when appropriate (e.g., when leaving draft page):
   ```tsx
   useEffect(() => {
     return () => {
       useDraftStore.getState().reset();
       useUIStore.getState().reset();
     };
   }, []);
   ```

5. **Error handling**: Always clear errors after successful operations:
   ```tsx
   const { clearAllErrors } = useUIStore();
   
   const handleSuccess = () => {
     clearAllErrors();
     // ... rest of success logic
   };
   ```

6. **Loading states**: Set loading states before async operations and clear them in finally blocks:
   ```tsx
   const { setLoading } = useUIStore();
   
   const fetchData = async () => {
     setLoading('draft', true);
     try {
       // ... fetch logic
     } finally {
       setLoading('draft', false);
     }
   };
   ```

## Testing

When testing components that use these stores, you can access and manipulate store state directly:

```tsx
import { useDraftStore, useUIStore } from '@/stores';

// In your test
beforeEach(() => {
  useDraftStore.getState().reset();
  useUIStore.getState().reset();
});

test('should update draft state', () => {
  const { setDraftState } = useDraftStore.getState();
  
  setDraftState(mockDraftState);
  
  const { draftState } = useDraftStore.getState();
  expect(draftState).toEqual(mockDraftState);
});
```
