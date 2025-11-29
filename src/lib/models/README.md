# Data Models and TypeScript Interfaces

This directory contains all data models, type definitions, type guards, validation utilities, and model mappers for the Fantasy Cricket Draft System.

## Overview

The models module provides:
- **TypeScript Interfaces**: Strongly-typed data structures
- **Type Guards**: Runtime type checking functions
- **Validation Utilities**: Business rule validation
- **Model Mappers**: Conversion between Prisma models and TypeScript interfaces

## Core Data Models

### Player

Represents a cricket player in the draft system.

```typescript
interface Player {
  id: string;
  name: string;
  team: IPLTeam; // CSK, MI, GT, RR, RCB, KKR, LSG, SRH, PBKS, DC
  role: PlayerRole; // Bat, Bowl, AR, WK
  isForeign: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### DraftConfig

Defines the rules and constraints for a draft.

```typescript
interface DraftConfig {
  id: string;
  rosterSize: number; // 1-20
  totalRounds: number; // Equals rosterSize
  minPerTeam: number; // Minimum players per IPL team
  maxPerTeam: number; // Maximum players per IPL team
  mandatoryRoles: MandatoryRoles; // Required role counts
  freeSlots: number; // Calculated: rosterSize - sum(mandatoryRoles)
  earlyRoundRule: EarlyRoundRule; // Early round constraints
  isLocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MandatoryRoles {
  Bat: number;
  Bowl: number;
  AR: number;
  WK: number;
}

interface EarlyRoundRule {
  rounds: number; // Number of early rounds
  minBat: number; // Minimum batsmen in early rounds
  minBowl: number; // Minimum bowlers in early rounds
}
```

### FantasyTeam

Represents a participant's team with their drafted players.

```typescript
interface FantasyTeam {
  id: string;
  name: string;
  email?: string;
  draftedPlayers: Player[];
  teamCount: Record<IPLTeam, number>; // Count per IPL team
  roleCount: Record<PlayerRole, number>; // Count per role
  createdAt?: Date;
  updatedAt?: Date;
}
```

### DraftState

Tracks the current state of an active draft.

```typescript
interface DraftState {
  id: string;
  currentRound: number;
  currentPickIndex: number;
  picks: PickRecord[];
  participantOrder: string[]; // Array of participant IDs
  status: DraftStatus; // not_started, in_progress, paused, completed
  startedAt?: Date;
  completedAt?: Date;
  draftConfigId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PickRecord {
  round: number;
  pickNumber: number;
  participantId: string;
  playerId: string;
  timestamp: Date;
}
```

## Type Guards

Type guards provide runtime type checking. Import from `@/lib/models`:

```typescript
import { isPlayer, isDraftConfig, isFantasyTeam, isDraftState } from '@/lib/models';

// Check if value is a valid Player
if (isPlayer(data)) {
  // TypeScript knows data is Player
  console.log(data.name);
}

// Check primitive types
if (isIPLTeam(value)) {
  // value is IPLTeam
}

if (isPlayerRole(value)) {
  // value is PlayerRole
}
```

Available type guards:
- `isIPLTeam(value)` - Check if value is valid IPL team
- `isPlayerRole(value)` - Check if value is valid player role
- `isDraftStatus(value)` - Check if value is valid draft status
- `isPlayer(value)` - Check if value is valid Player
- `isDraftConfig(value)` - Check if value is valid DraftConfig
- `isDraftState(value)` - Check if value is valid DraftState
- `isFantasyTeam(value)` - Check if value is valid FantasyTeam
- `isMandatoryRoles(value)` - Check if value is valid MandatoryRoles
- `isEarlyRoundRule(value)` - Check if value is valid EarlyRoundRule

## Validation Utilities

Validation functions ensure data integrity and business rules. Import from `@/lib/models`:

```typescript
import { validatePlayer, validateDraftConfig, validateConfigConsistency } from '@/lib/models';

// Validate a player
const result = validatePlayer(playerData);
if (!result.valid) {
  console.error(result.errors);
}

// Validate draft configuration
const configResult = validateDraftConfig(config);
if (!configResult.valid) {
  console.error(configResult.errors);
}

// Check configuration consistency
const consistencyResult = validateConfigConsistency(config);
if (!consistencyResult.valid) {
  console.error(consistencyResult.errors);
}
```

Available validation functions:
- `validatePlayer(player)` - Validate player data
- `validateCreatePlayerRequest(request)` - Validate player creation request
- `validateUpdatePlayerRequest(request)` - Validate player update request
- `validateDraftConfig(config)` - Validate draft configuration
- `validateUpdateDraftConfigRequest(request)` - Validate config update request
- `validateDraftState(state)` - Validate draft state
- `validateFantasyTeam(team)` - Validate fantasy team
- `validateConfigConsistency(config)` - Check configuration consistency
- `calculateFreeSlots(config)` - Calculate free roster slots

## Model Mappers

Mappers convert between Prisma models and TypeScript interfaces. Import from `@/lib/models`:

```typescript
import { 
  prismaPlayerToPlayer, 
  prismaDraftConfigToDraftConfig,
  participantToFantasyTeam 
} from '@/lib/models';

// Convert Prisma Player to Player interface
const player = prismaPlayerToPlayer(prismaPlayer);

// Convert Prisma DraftConfig to DraftConfig interface
const config = prismaDraftConfigToDraftConfig(prismaConfig);

// Convert Participant to FantasyTeam
const team = participantToFantasyTeam(participant, draftedPlayers);
```

Available mappers:
- `prismaPlayerToPlayer(prismaPlayer)` - Convert Prisma Player to Player
- `playerToPrismaPlayer(player)` - Convert Player to Prisma Player
- `prismaDraftConfigToDraftConfig(prismaConfig)` - Convert Prisma DraftConfig to DraftConfig
- `draftConfigToPrismaDraftConfig(config)` - Convert DraftConfig to Prisma DraftConfig
- `prismaPickToPickRecord(prismaPick)` - Convert Prisma Pick to PickRecord
- `prismaDraftStateToDraftState(prismaState, picks, draftOrders)` - Convert Prisma DraftState to DraftState
- `participantToFantasyTeam(participant, draftedPlayers)` - Convert Participant to FantasyTeam

## Utility Functions

Helper functions for common operations:

```typescript
import { 
  initializeTeamCount, 
  initializeRoleCount,
  calculateTeamCounts,
  calculateRoleCounts 
} from '@/lib/models';

// Initialize empty counts
const teamCount = initializeTeamCount(); // { CSK: 0, MI: 0, ... }
const roleCount = initializeRoleCount(); // { Bat: 0, Bowl: 0, AR: 0, WK: 0 }

// Calculate counts from players
const teams = calculateTeamCounts(players);
const roles = calculateRoleCounts(players);
```

## Usage Examples

### Creating a Player

```typescript
import { validateCreatePlayerRequest, isPlayer } from '@/lib/models';

const playerRequest = {
  name: 'MS Dhoni',
  team: 'CSK',
  role: 'WK',
  isForeign: false,
};

// Validate request
const validation = validateCreatePlayerRequest(playerRequest);
if (!validation.valid) {
  throw new Error(validation.errors?.join(', '));
}

// Create player in database
const player = await prisma.player.create({ data: playerRequest });

// Verify type
if (isPlayer(player)) {
  console.log(`Created player: ${player.name}`);
}
```

### Validating Draft Configuration

```typescript
import { validateDraftConfig, validateConfigConsistency, calculateFreeSlots } from '@/lib/models';

const config: DraftConfig = {
  id: '1',
  rosterSize: 8,
  totalRounds: 8,
  minPerTeam: 0,
  maxPerTeam: 1,
  mandatoryRoles: { Bat: 3, Bowl: 3, AR: 0, WK: 0 },
  freeSlots: 2,
  earlyRoundRule: { rounds: 4, minBat: 2, minBowl: 2 },
};

// Validate structure
const structureValidation = validateDraftConfig(config);
if (!structureValidation.valid) {
  console.error('Invalid structure:', structureValidation.errors);
}

// Validate consistency
const consistencyValidation = validateConfigConsistency(config);
if (!consistencyValidation.valid) {
  console.error('Inconsistent config:', consistencyValidation.errors);
}

// Calculate free slots
const freeSlots = calculateFreeSlots(config);
console.log(`Free slots: ${freeSlots}`);
```

### Building a Fantasy Team

```typescript
import { participantToFantasyTeam, calculateTeamCounts, calculateRoleCounts } from '@/lib/models';

// Get participant and their picks
const participant = await prisma.participant.findUnique({
  where: { id: participantId },
  include: { picks: { include: { player: true } } },
});

// Extract drafted players
const draftedPlayers = participant.picks.map(pick => 
  prismaPlayerToPlayer(pick.player)
);

// Create fantasy team
const fantasyTeam = participantToFantasyTeam(participant, draftedPlayers);

console.log(`Team: ${fantasyTeam.name}`);
console.log(`Players: ${fantasyTeam.draftedPlayers.length}`);
console.log(`Team counts:`, fantasyTeam.teamCount);
console.log(`Role counts:`, fantasyTeam.roleCount);
```

## Constants

Useful constants are exported from `@/types`:

```typescript
import { IPL_TEAMS, PLAYER_ROLES, DRAFT_STATUSES } from '@/types';

// All IPL teams
IPL_TEAMS; // ['CSK', 'MI', 'GT', 'RR', 'RCB', 'KKR', 'LSG', 'SRH', 'PBKS', 'DC']

// All player roles
PLAYER_ROLES; // ['Bat', 'Bowl', 'AR', 'WK']

// All draft statuses
DRAFT_STATUSES; // ['not_started', 'in_progress', 'paused', 'completed']
```

## Testing

Run the test suite to verify all models work correctly:

```bash
npx tsx src/lib/models/__tests__/models.test.ts
```

## Requirements Coverage

This implementation satisfies the following requirements:
- **1.1**: Player data model with name, team, role, and foreign status
- **2.1-2.6**: DraftConfig with roster size, team constraints, mandatory roles, and early-round rules
- All models include proper TypeScript interfaces
- Type guards provide runtime type safety
- Validation utilities enforce business rules
- Model mappers handle Prisma conversion
