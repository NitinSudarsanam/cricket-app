# Fantasy Cricket Draft System

A full-featured fantasy cricket draft application with real-time updates, customizable rules, and an intuitive admin interface.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npx prisma db push

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Visit **http://localhost:3000/admin** to get started!

## Features

- **Snake & Linear Draft Orders** - Flexible draft configurations
- **Real-time Turn Detection** - Know exactly whose turn it is
- **Automatic Validation** - Enforces team caps, role requirements, and early-round rules
- **Admin Dashboard** - Manage players, participants, and draft settings
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Color-coded Teams** - Easy visual identification of IPL teams

## Documentation

- **[Complete Guide](./README_DRAFT_SYSTEM.md)** - Full system documentation
- **[Database Setup](./SETUP_DATABASE.md)** - Database configuration guide

## Score tracking and rankings

The app can ingest match data from the Sportmonks Cricket API and maintain team/player leaderboards.

- Set **`SPORTMONKS_API_TOKEN`** in `.env`. Get a **Cricket API** token from [MySportmonks](https://my.sportmonks.com/); your plan must include the Cricket API. If you get **404**, the token may be for another product (e.g. Football only)—ensure Cricket is in your subscription.
- Run **`npm run db:seed`** to create default scoring rules (win=3, tie/no result=1, loss=0).
- **Sync**: `POST /api/sync/cricket-data` with header `Authorization: Bearer YOUR_CRON_SECRET` or `x-cron-secret: YOUR_CRON_SECRET` (use `CRON_SECRET` or `ADMIN_SECRET` from `.env`).
- **Scheduler**: A cron entry in `vercel.json` hits the sync route every 15 minutes. For Vercel Cron you must call the endpoint with the secret (e.g. use an external cron service that sends the header, or configure serverless to pass the secret).
- **Leaderboards**: `GET /api/leaderboard/teams?seasonId=...` and `GET /api/leaderboard/players?seasonId=...`.

### Load season from Sportmonks (draft players)

Players in the draft pool come from Sportmonks **squad** data (teams’ squads for a season). One “Load season” sync fills leagues, seasons, teams, **draft players**, and optionally fixtures.

**Steps:**

1. **Environment**  
   In `.env` set:
   - `SPORTMONKS_API_TOKEN` (required for sync).
   - Optional: `SPORTMONKS_DOMESTIC_COUNTRY_ID` (Sportmonks country id for “domestic”; others are treated as foreign).  
   - Optional: `REQUIRE_SYNC_BEFORE_DRAFT=true` to block starting a draft until sync has been run.

2. **Database**  
   Ensure the schema is applied (e.g. `npx prisma db push`) so the `Player.externalId` column exists.

3. **Admin → Sync**  
   - Open **Admin → Sync** (`/admin/sync`).
   - If leagues/seasons are empty, click **Run full sync (no filter)** once to pull leagues and seasons from Sportmonks.
   - Select **League** and **Season** in the dropdowns.
   - Click **Load season from Sportmonks**.  
   This syncs teams, **draft player pool (squads)**, and optionally fixtures for the selected season.

4. **Draft**  
   The draft pool is the set of players just synced. Start the draft from **Admin → Monitor Draft** as usual.

**APIs (for reference):**  
- Leagues: `GET /api/leagues`.  
- Seasons: `GET /api/seasons?leagueId=...`.  
- Sync (server-only): the Sync page uses a server action; for cron/scripts use `POST /api/sync/cricket-data` with `CRON_SECRET` or `ADMIN_SECRET`.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Real-time**: Pusher (optional)

## Project Structure

```
cricket/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Business logic and utilities
│   └── types/            # TypeScript type definitions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── public/               # Static assets
```

## Usage

### 1. Add Participants
Navigate to **Admin → Participants** and add at least 2 participants.

### 2. Configure Draft Rules
Go to **Admin → Configuration** to customize:
- Roster size
- Team caps
- Role requirements
- Early-round rules

### 3. Start Draft
Click **Monitor Draft → Start Draft**, select participants and draft order.

### 4. Make Picks
Use the participant switcher to test different users making picks.

## Configuration

Edit `.env` file:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Status**: Production Ready  
**Version**: 1.0.0
