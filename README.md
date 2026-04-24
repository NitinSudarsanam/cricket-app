# Fantasy Cricket Draft

A full-stack fantasy cricket draft platform for IPL seasons. Run a snake or linear draft with live turn detection, enforce roster rules (team caps, role minimums, early-round requirements), and track results against real match data synced from the Sportmonks Cricket API.

Built with Next.js 16 (App Router), TypeScript, Prisma, PostgreSQL, and Pusher.

---

## Table of Contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Usage Walkthrough](#usage-walkthrough)
- [Live Score Ingestion](#live-score-ingestion-sportmonks)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [License](#license)

---

## Highlights

- **Configurable draft engine** — snake or linear order, roster size, per-IPL-team caps, role minimums (Bat / Bowl / AR / WK), and early-round constraints, all validated server-side.
- **Real-time updates** — Pusher-backed presence and pick broadcasts keep every participant in sync without manual refreshes. Gracefully falls back to polling when Pusher keys are absent.
- **Admin dashboard** — manage players, participants, draft configuration, sync jobs, and leaderboards from `/admin`.
- **Live score ingestion** — Sportmonks Cricket API integration pulls leagues, seasons, squads, fixtures, and match results; configurable scoring rules feed team and player leaderboards.
- **Two leaderboards** — team standings (win / tie / no-result / loss points) and fantasy player rankings aggregated across each participant's drafted squad.
- **Session-aware auth** — separate admin and participant sessions with HMAC-signed cookies, rate limiting on sensitive routes, and a security event logger.
- **Deeply tested** — Vitest unit + integration tests across the rule engine, state manager, API routes, and stores, plus Playwright end-to-end coverage of the full draft flow.
- **Production-ready deploys** — Vercel configuration, cron entry for periodic sync, serverless-friendly Prisma adapter, pre-deploy readiness script.

---

## Screenshots

> Add screenshots of the admin dashboard, draft board, and leaderboard here.

---

## Architecture

```
┌────────────────────┐     HTTPS     ┌──────────────────────────────┐
│  Browser (React)   │ ─────────────▶│  Next.js App Router (Vercel) │
│  Draft UI / Admin  │◀───Pusher─────│  API routes, server actions  │
└────────────────────┘               │                              │
                                     │  ├─ Auth (HMAC cookies)      │
                                     │  ├─ Rule engine              │
                                     │  ├─ Draft state manager      │
                                     │  ├─ Ingestion services       │
                                     │  └─ Leaderboard services     │
                                     └──────────┬───────────────────┘
                                                │ Prisma
                                                ▼
                                     ┌──────────────────────────────┐
                                     │  PostgreSQL (Supabase)       │
                                     └──────────────────────────────┘
                                                ▲
                                                │ scheduled sync
                                     ┌──────────┴───────────────────┐
                                     │  Sportmonks Cricket API      │
                                     └──────────────────────────────┘
```

**Data model (Prisma):** `Player`, `Participant`, `DraftConfig`, `DraftState`, `DraftOrder`, `Pick`, `League`, `Season`, `Team`, `Match`, `MatchResult`, `ScoringRule`, `TeamScore`, `PlayerScore`, `LeaderboardSnapshot`.

**Key modules:**

- `src/lib/rule-engine.ts` — pure validator for draft picks and configs.
- `src/lib/draft-state-manager.ts` — turn resolution, snake ordering, completion detection.
- `src/services/ingestion/` — Sportmonks squad / fixture / result ingestion.
- `src/services/scoring/` — scoring rule resolution.
- `src/services/leaderboard/` — team and player leaderboard aggregation.
- `src/services/ranking/` — fantasy player ranking by drafted roster.

---

## Tech Stack

| Layer          | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, React Compiler)   |
| Language       | TypeScript 5                                        |
| Database       | PostgreSQL (Supabase in production)                 |
| ORM            | Prisma 7 with `@prisma/adapter-pg`                  |
| Styling        | Tailwind CSS 4                                      |
| State          | Zustand                                             |
| Real-time      | Pusher Channels (optional)                          |
| External API   | Sportmonks Cricket API v2.0                         |
| Unit tests     | Vitest + Testing Library + jsdom                    |
| E2E tests      | Playwright                                          |
| Deploy target  | Vercel (serverless functions + cron)                |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local, Docker, or Supabase)
- A Sportmonks Cricket API token (optional, only needed for live data)
- A Pusher Channels app (optional, only needed for real-time UI)

### Install

```bash
git clone https://github.com/NitinSudarsanam/cricket-app.git
cd cricket-app
npm install
```

### Configure

```bash
cp .env.example .env
# edit .env — see the Environment Variables section below
```

### Database

```bash
npx prisma db push   # apply schema
npx prisma db seed   # seed default scoring rules and sample data
```

A helper script is included for a local Postgres bootstrap: `./setup-db.ps1` (Windows) or `setup-db.bat`.

### Run

```bash
npm run dev
```

Open:

- **http://localhost:3000** — landing page
- **http://localhost:3000/admin** — admin dashboard
- **http://localhost:3000/draft** — participant draft UI

---

## Environment Variables

See `.env.example` for the full list. Essentials:

| Variable                        | Purpose                                                                   | Required                    |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| `DATABASE_URL`                  | Postgres pooled connection (port 6543 on Supabase)                        | yes                         |
| `DIRECT_URL`                    | Postgres direct connection (port 5432) for migrations / seeding           | yes                         |
| `ADMIN_SECRET`                  | Signs admin sessions; min 32 chars in production                          | yes                         |
| `SESSION_SECRET`                | Signs participant sessions; min 32 chars in production                    | prod only                   |
| `NEXT_PUBLIC_APP_URL`           | Base URL for server-side redirects                                        | yes                         |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` | Server-side Pusher credentials                     | optional (real-time)        |
| `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | Client-side Pusher credentials                          | optional (real-time)        |
| `SPORTMONKS_API_TOKEN`          | Sportmonks Cricket API token                                              | optional (live data)        |
| `SPORTMONKS_DOMESTIC_COUNTRY_ID`| Country id treated as domestic; everything else is foreign                | optional                    |
| `CRON_SECRET`                   | Bearer secret required by `/api/sync/cricket-data` when set               | optional (scheduled sync)   |
| `REQUIRE_SYNC_BEFORE_DRAFT`     | If `true`, block draft start until leagues/seasons exist                  | optional                    |

The app runs without Pusher or Sportmonks — real-time and live data degrade gracefully.

---

## Scripts

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `npm run dev`              | Start dev server                                           |
| `npm run build`            | Production build                                           |
| `npm run start`            | Start production server                                    |
| `npm run lint`             | ESLint (Next.js config)                                    |
| `npm run format`           | Prettier write                                             |
| `npm run format:check`     | Prettier check                                             |
| `npm test`                 | Vitest unit + integration tests                            |
| `npm run test:watch`       | Vitest watch mode                                          |
| `npm run test:coverage`    | Vitest with V8 coverage                                    |
| `npm run test:e2e`         | Playwright end-to-end tests                                |
| `npm run test:all`         | Unit + e2e                                                 |
| `npm run db:generate`      | Prisma client generate                                     |
| `npm run db:push`          | Apply schema without migration                             |
| `npm run db:migrate`       | Create and apply a migration                               |
| `npm run db:seed`          | Seed database                                              |
| `npm run db:studio`        | Open Prisma Studio                                         |
| `npm run sync`             | Trigger a Sportmonks sync via the scripted runner          |
| `npm run test:sportmonks`  | Smoke-test the Sportmonks API token                        |
| `npm run analyze`          | Bundle size analyzer                                       |
| `npm run check:prod`       | Production-readiness checklist                             |

---

## Usage Walkthrough

1. **Add participants** — `Admin → Participants`. Minimum 2.
2. **Configure the draft** — `Admin → Configuration`. Set roster size, total rounds, per-team cap, mandatory roles, early-round rules. Config can be locked once a draft starts.
3. **Load players** — either import manually (`Admin → Players`) or pull a season's squads from Sportmonks (`Admin → Sync`, then "Load season from Sportmonks"). Syncing populates leagues, seasons, teams, and the draft pool in one go.
4. **Start the draft** — `Admin → Monitor Draft → Start Draft`. Choose participants and order type (snake or linear).
5. **Make picks** — each participant logs in at `/draft/login` with their email. The rule engine validates every pick: team cap, role minimums, early-round mins, duplicate prevention.
6. **Track results** — once fixtures are synced and completed, team and fantasy-player leaderboards update automatically from match results and scoring rules.

### Draft Rules

- **Snake order:** direction reverses each round — round 1 A→B→C, round 2 C→B→A, round 3 A→B→C, etc.
- **Linear order:** same order every round.
- **Team cap:** maximum picks allowed from a single IPL team.
- **Role minimums:** mandatory count per role (Bat / Bowl / AR / WK) enforced by the end of the draft.
- **Early-round rules:** in the first N rounds, require minimum counts of specified roles (e.g., ≥2 Bat and ≥2 Bowl in the first 4 rounds).

---

## Live Score Ingestion (Sportmonks)

Scoring data comes from the Sportmonks Cricket API. Your Sportmonks plan must include Cricket — if you see a 404, your token is likely for another product.

### Sync flow

1. Set `SPORTMONKS_API_TOKEN` in `.env`.
2. Open `Admin → Sync`.
3. If leagues/seasons are empty, run **Run full sync (no filter)** once to pull them.
4. Select a league and season, then **Load season from Sportmonks**. This upserts teams, squad players (the draft pool), and fixtures.
5. Scoring rules default to `win=3`, `tie=1`, `no-result=1`, `loss=0` (configurable via the `ScoringRule` table).

### Scheduled sync

`vercel.json` includes a cron entry hitting `POST /api/sync/cricket-data` every 15 minutes. The route requires `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret` header). Use `CRON_SECRET` or fall back to `ADMIN_SECRET`.

---

## API Reference

Selected endpoints — see `src/app/api/` for full list.

### Draft

- `GET /api/draft/state` — current draft state, current turn, picks
- `POST /api/draft/start` — start a new draft
- `POST /api/draft/pick` — submit a pick (authenticated participant)
- `POST /api/draft/pause` — pause / resume (admin)
- `POST /api/draft/reset` — reset draft (admin)
- `GET /api/draft/results` — completed draft rosters

### Config

- `GET /api/draft-config` — fetch active config
- `POST /api/draft-config` — update config (admin, unlocked only)
- `POST /api/draft-config/validate` — dry-run validation

### Entities

- `GET|POST /api/players`, `GET|PATCH|DELETE /api/players/[id]`, `POST /api/players/import`
- `GET|POST /api/participants`, `GET /api/participants/[id]/roster`
- `GET /api/teams`, `GET /api/teams/[id]`
- `GET /api/leagues`, `GET /api/seasons?leagueId=...`, `GET /api/matches`

### Leaderboards

- `GET /api/leaderboard/teams?seasonId=...`
- `GET /api/leaderboard/players?seasonId=...`
- `GET /api/leaderboard/fantasy?seasonId=...`

### Sync & Health

- `POST /api/sync/cricket-data` — trigger ingestion (requires `CRON_SECRET` or `ADMIN_SECRET`)
- `GET /api/sportmonks/check` — token / plan check
- `GET /api/health` — liveness probe

### Auth

- `POST /api/auth/admin` — admin login
- `POST /api/auth/participant` — participant login
- `GET /api/auth/session` — current session
- `POST /api/auth/logout`

---

## Testing

```bash
npm test                 # Vitest unit + integration
npm run test:coverage    # with V8 coverage report
npm run test:e2e         # Playwright (auto-starts dev server)
npm run test:all         # both
```

- Unit/integration tests live next to source under `__tests__/` directories.
- Mock helpers: `src/__tests__/helpers/` (Prisma, Pusher, Next request, factories).
- E2E specs: `e2e/` — seeds a disposable dataset via `e2e/seed.ts` and exercises admin and draft flows.
- CI: GitHub Actions in `.github/workflows/` runs the test suite and uploads coverage on each push.

---

## Deployment

Designed for Vercel:

1. Import the repository in Vercel.
2. Set environment variables in the project settings (see above).
3. Point `DATABASE_URL` at a pooled connection (Supabase port 6543) and `DIRECT_URL` at the direct connection (5432) so migrations work.
4. Deploy. The `postinstall` hook runs `prisma generate` automatically.
5. `vercel.json` wires up the `/api/sync/cricket-data` cron (every 15 minutes).
6. Run `npm run check:prod` locally before release to catch missing env vars, weak secrets, or dev-only defaults.

---

## Project Structure

```
cricket-app/
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── admin/            # Admin dashboard (config, players, participants, sync, monitor, leaderboard)
│   │   ├── api/              # REST endpoints (draft, auth, leaderboard, sync, ...)
│   │   └── draft/            # Participant-facing draft UI
│   ├── components/           # UI + feature components (admin/, draft/, ui/)
│   ├── hooks/                # React hooks (draft realtime, toast, store sync)
│   ├── lib/                  # Core libs: rule engine, state manager, auth, rate limit, sportmonks client
│   ├── services/             # Domain services: ingestion, scoring, ranking, leaderboard
│   ├── stores/               # Zustand stores (draft, toast, UI)
│   ├── styles/               # Tailwind entry + component CSS
│   └── middleware.ts         # Route protection
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seeding script
├── e2e/                      # Playwright specs + seed + helpers
├── scripts/                  # Deploy, bundle analyzer, production-ready check, sync runner
├── docs/                     # Extended documentation
└── .github/workflows/        # CI (tests + deploy)
```

---

## License

MIT

## Contributing

Issues and pull requests welcome. For substantial changes, please open an issue first to discuss the approach.
