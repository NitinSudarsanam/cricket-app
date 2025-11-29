# Admin Dashboard Components

This directory contains all the admin dashboard components for the Fantasy Cricket Draft system.

## Components

### AdminLayout
The main layout wrapper for all admin pages. Provides:
- Responsive navigation sidebar
- Header with admin controls
- Mobile-friendly menu toggle
- Consistent page structure

### PlayerManagement
Complete CRUD interface for managing the player pool:
- Player list table with sorting and filtering
- Add/edit player forms with validation
- Delete confirmation dialogs
- Bulk import from CSV/JSON files
- Import results display with error handling

### DraftConfigEditor
Interactive editor for draft configuration:
- Roster size slider (1-20 players)
- Min/max players per team inputs
- Mandatory role requirements editor (Bat, Bowl, AR, WK)
- Early-round rules configuration
- Real-time validation feedback
- Auto-calculated free slots display
- Configuration locking during active drafts

### ConsistencyChecker
Validation dashboard for draft configuration:
- Real-time configuration validation
- Visual pass/fail indicators (green checkmark / red X)
- Detailed error messages
- Configuration summary display
- Individual validation check breakdown

### DraftMonitor
Live monitoring interface for active drafts:
- Real-time draft status display
- Participant roster views (expandable)
- Current pick indicator
- Pause/reset draft controls (admin only)
- Recent picks history
- Auto-refresh every 5 seconds

## Admin Pages

The admin dashboard is accessible at `/admin` and includes:

- `/admin` - Dashboard home with quick action cards
- `/admin/players` - Player management interface
- `/admin/config` - Draft configuration and consistency checker
- `/admin/participants` - Participant management
- `/admin/monitor` - Live draft monitoring

## Usage

```tsx
import { AdminLayout, PlayerManagement } from '@/components/admin';

export default function PlayersPage() {
  return (
    <AdminLayout>
      <PlayerManagement />
    </AdminLayout>
  );
}
```

## Features

- Fully responsive design (mobile, tablet, desktop)
- Real-time validation and feedback
- Consistent error handling
- Loading states for all async operations
- Modal dialogs for forms and confirmations
- Color-coded status indicators
- Auto-refresh for live data

## Requirements Satisfied

This implementation satisfies requirements:
- 1.1-1.5: Player management
- 2.1-2.6: Draft configuration
- 3.1-3.6: Configuration validation
- 10.1-10.5: Admin dashboard functionality
