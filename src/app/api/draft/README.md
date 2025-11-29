# Draft API Endpoints

This directory contains all API endpoints for managing the fantasy cricket draft process.

## Endpoints

### POST /api/draft/start
Initialize and start a new draft.

**Request Body:**
```json
{
  "participantIds": ["participant-id-1", "participant-id-2", ...],
  "draftOrder": "snake" | "linear" (optional, defaults to "snake")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draftState": { ... },
    "draftConfig": { ... },
    "message": "Draft started successfully"
  }
}
```

**Features:**
- Validates draft configuration before starting
- Checks for existing active drafts
- Verifies all participants exist
- Validates player pool sufficiency
- Locks configuration once draft starts
- Supports both linear and snake draft orders

---

### POST /api/draft/pick
Make a player selection during the draft.

**Request Body:**
```json
{
  "participantId": "participant-id",
  "playerId": "player-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draftState": { ... },
    "pick": {
      "participantId": "...",
      "participantName": "...",
      "playerId": "...",
      "playerName": "...",
      "playerTeam": "CSK",
      "playerRole": "Bat",
      "round": 1,
      "pickNumber": 1,
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "message": "Participant selected Player (CSK - Bat)"
  }
}
```

**Validations:**
- Verifies it's the correct participant's turn
- Checks if player is available (not already drafted)
- Validates team cap constraints
- Validates early-round rule requirements
- Prevents picks when draft is paused

---

### GET /api/draft/state
Fetch the current draft state.

**Query Parameters:**
- `draftStateId` (optional): Specific draft state ID to fetch
- `includeDetails` (optional): Include participant and config details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "draft-state-id",
    "currentRound": 1,
    "currentPickIndex": 0,
    "status": "in_progress",
    "participantOrder": ["id1", "id2", ...],
    "picks": [
      {
        "round": 1,
        "pickNumber": 1,
        "participantId": "...",
        "participantName": "...",
        "playerId": "...",
        "playerName": "...",
        "playerTeam": "CSK",
        "playerRole": "Bat",
        "timestamp": "..."
      }
    ],
    "currentParticipant": {
      "id": "...",
      "name": "..."
    },
    "startedAt": "...",
    "completedAt": null,
    "totalRounds": 8,
    "totalParticipants": 4
  }
}
```

---

### POST /api/draft/reset
Reset the draft state (admin only).

**Request Body:**
```json
{
  "draftStateId": "draft-state-id" (optional),
  "adminSecret": "secret" (optional, can also use x-admin-secret header)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draftState": { ... },
    "message": "Draft reset successfully. Configuration unlocked."
  }
}
```

**Features:**
- Clears all picks
- Resets draft state to initial
- Unlocks configuration
- Requires admin authentication

---

### POST /api/draft/pause
Pause or resume the draft (admin only).

**Request Body:**
```json
{
  "action": "pause" | "resume",
  "draftStateId": "draft-state-id" (optional),
  "adminSecret": "secret" (optional, can also use x-admin-secret header)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "draftState": { ... },
    "message": "Draft paused successfully" | "Draft resumed successfully"
  }
}
```

**Features:**
- Pause draft to prevent picks
- Resume paused draft
- Validates state transitions
- Requires admin authentication

---

## Draft State Manager Service

The `draft-state-manager.ts` service provides core functionality for managing draft state:

### Key Functions

- `initializeDraftState()` - Create new draft with participant order
- `getDraftState()` - Fetch current draft state
- `getActiveDraftState()` - Get the active draft
- `addPick()` - Add a pick to the draft
- `advanceToNextPick()` - Move to next pick (handles snake/linear)
- `getCurrentParticipantId()` - Get participant for current pick
- `calculatePickNumber()` - Calculate overall pick number
- `resetDraftState()` - Reset draft to initial state
- `pauseDraftState()` - Pause the draft
- `resumeDraftState()` - Resume the draft

### Draft Order Types

- **Linear**: Same order every round (1, 2, 3, 4 → 1, 2, 3, 4)
- **Snake**: Reverses every other round (1, 2, 3, 4 → 4, 3, 2, 1)

---

## Environment Variables

```env
ADMIN_SECRET=your-secret-key  # Required for admin endpoints
DATABASE_URL=postgresql://...  # Database connection
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "validationErrors": ["error1", "error2"] (optional)
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (admin endpoints)
- `403` - Forbidden (not participant's turn)
- `404` - Not Found
- `409` - Conflict (draft already active)
- `500` - Internal Server Error

---

## Requirements Satisfied

- **4.1**: Generate participant order when starting draft
- **4.2**: Initialize draft state with participant order
- **4.3**: Lock configuration when draft starts
- **4.5**: Track current round and pick index
- **5.1**: Enable player selection only for current participant
- **5.2**: Validate player availability
- **5.3**: Validate team cap constraints
- **5.4**: Validate early-round rules
- **5.5**: Display validation errors
- **5.6**: Add player to roster on valid pick
- **5.7**: Remove player from available pool
- **5.8**: Advance to next pick
- **6.3**: Include all picks and current position in state
- **10.5**: Admin controls for pause/reset

---

## Usage Example

```typescript
// Start a draft
const startResponse = await fetch('/api/draft/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantIds: ['p1', 'p2', 'p3', 'p4'],
    draftOrder: 'snake'
  })
});

// Make a pick
const pickResponse = await fetch('/api/draft/pick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: 'p1',
    playerId: 'player-123'
  })
});

// Get current state
const stateResponse = await fetch('/api/draft/state?includeDetails=true');

// Pause draft (admin)
const pauseResponse = await fetch('/api/draft/pause', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': 'your-secret'
  },
  body: JSON.stringify({ action: 'pause' })
});

// Reset draft (admin)
const resetResponse = await fetch('/api/draft/reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': 'your-secret'
  },
  body: JSON.stringify({})
});
```
