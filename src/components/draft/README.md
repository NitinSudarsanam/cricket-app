# Draft Interface Components

This directory contains all the UI components for the fantasy cricket draft interface.

## Components

### DraftInterface
The main container component that orchestrates the entire draft experience. It handles:
- Real-time synchronization with the server
- Player selection logic
- Error handling and notifications
- Connection state management

**Props:**
- `initialDraftState`: Initial draft state from server
- `initialPlayers`: All available players
- `draftConfig`: Draft configuration rules
- `participants`: List of all participants
- `currentParticipantId`: ID of the current user
- `currentParticipantName`: Name of the current user
- `showTimer`: Whether to show countdown timer (optional)
- `timerSeconds`: Timer duration in seconds (optional)

### DraftBoard
Displays all available players organized by IPL team in a color-coded grid layout.

**Features:**
- 10-column grid on desktop (one per IPL team)
- 2-column grid on tablet
- Vertical collapsible columns on mobile
- Team color coding with soft pastels
- Filters out drafted players automatically

**Props:**
- `availablePlayers`: List of players that haven't been drafted
- `onPlayerSelect`: Callback when a player is clicked
- `disabled`: Whether player selection is disabled
- `eligiblePlayerIds`: Optional set of player IDs allowed for the current pick
- `allowDrag`: Whether chips can be dragged onto the roster

### DraftTopBar
Shows the current draft status and progress at the top of the screen.

**Features:**
- Current round number
- Participant on the clock (highlighted)
- Optional countdown timer
- Draft progress bar
- Status indicators (paused, completed)

**Props:**
- `draftState`: Current draft state
- `participants`: List of all participants
- `showTimer`: Whether to show countdown timer (optional)
- `timerSeconds`: Timer duration in seconds (optional)
- `onTimerExpire`: Callback when timer expires (optional)

### RosterSidebar
Displays the current participant's roster and constraint tracking.

**Features:**
- List of drafted players
- Team count summary with progress bars
- Role count summary with progress bars
- Constraints tracker
- Warning indicators when approaching limits
- Sticky positioning and scrollable content

**Props:**
- `roster`: Current participant's drafted players
- `draftConfig`: Draft configuration rules
- `participantName`: Name of the participant

### PickHistory
Shows a chronological log of all picks made during the draft.

**Features:**
- Chronological list of picks
- Round, participant, and player information
- Auto-scroll to latest pick
- Filter by participant
- Timestamps for each pick

**Props:**
- `picks`: Array of all picks made
- `participants`: List of all participants
- `players`: All players (for lookup)
- `autoScroll`: Whether to auto-scroll to latest (optional)

## Usage Example

```tsx
import { DraftInterface } from '@/components/draft';

export default function DraftPage() {
  return (
    <DraftInterface
      initialDraftState={draftState}
      initialPlayers={players}
      draftConfig={config}
      participants={participants}
      currentParticipantId="participant-1"
      currentParticipantName="John Doe"
      showTimer={true}
      timerSeconds={60}
    />
  );
}
```

## Responsive Design

All components are fully responsive:

- **Desktop (>1024px)**: Full 10-column grid layout with sidebar
- **Tablet (768-1024px)**: 2-column grid layout
- **Mobile (<768px)**: Vertical collapsible columns

## Real-Time Updates

The `DraftInterface` component uses the `useDraftSync` hook to:
- Subscribe to real-time draft events via WebSocket
- Update UI when picks are made by any participant
- Handle reconnection and state synchronization
- Display connection status

## Requirements Satisfied

- **8.1**: Team color coding with soft pastels
- **8.2**: Player chips with team, role, and foreign status
- **8.3**: Hover glow effects
- **8.4**: Top bar with round, participant, and timer
- **8.6**: Pick history log
- **8.7**: Responsive layout (desktop, tablet, mobile)
- **7.1-7.6**: Roster tracking with constraints
- **5.1-5.8**: Player selection and validation
- **6.1-6.5**: Real-time synchronization

## Notes

- All components are client-side components (marked with 'use client')
- Error handling is built into the DraftInterface component
- The interface automatically disables player selection when it's not the participant's turn
- Validation errors from the server are displayed inline
