# Fantasy Cricket Draft

Full-stack fantasy cricket draft platform for IPL seasons. Runs snake or linear drafts with live turn detection, enforces roster rules (team caps, role minimums, early-round requirements), and tracks results against real match data from the Sportmonks Cricket API.

Built on Next.js 16 (App Router), TypeScript, Prisma, PostgreSQL, and Pusher.

---

## Table of contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Usage walkthrough](#usage-walkthrough)
- [Live score ingestion](#live-score-ingestion-sportmonks)
- [API reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [License](#license)

---

## What it does

- Configurable draft engine: snake or linear order, roster size, per-IPL-team caps, role minimums (Bat/Bowl/AR/WK), and early-round constraints. All validated server-side.
- Real-time presence and picks over Pusher. If you don't set Pusher keys, the UI polls instead.
- Admin dashboard at `/admin` for players, participants, draft config, sync jobs, and leaderboards.
- Sportmonks Cricket API integration: leagues, seasons, squads, fixtures, match results. Scoring rules feed team and player leaderboards.
- Two leaderboards: team standings (win/tie/no-result/loss points) and fantasy player rankings across each participant's drafted squad.
- Admin and participant sessions use HMAC-signed cookies. Sensitive routes are rate-limited. A security event logger records auth failures.
- Tests: Vitest for units and integration across the rule engine, state manager, and API routes. Playwright covers the draft flow end-to-end.
- Vercel-ready. Cron entry for periodic sync, serverless Prisma adapter, pre-deploy readiness script.

---

## Screenshots

> TODO: add admin dashboard, draft board, leaderboard screenshots.

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

**Main modules:**

- `src/lib/rule-engine.ts` — pure validator for draft picks and configs.
- `src/lib/draft-state-manager.ts` — turn resolution, snake ordering, completion detection.
- `src/services/ingestion/` — Sportmonks squad, fixture, and result ingestion.
- `src/services/scoring/` — scoring rule resolution.
- `src/services/leaderboard/` — team and player leaderboard aggregation.
- `src/services/ranking/` — fantasy player ranking by drafted roster.

---

## Tech stack

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

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local, Docker, or Supabase)
- A Sportmonks Cricket API token (only if you want live data)
- A Pusher Channels app (only if you want real-time UI)

### Install

```bash
git clone https://github.com/NitinSudarsanam/cricket-app.git
cd cricket-app
npm install
```

### Configure

```bash
cp .env.example .env
# edit .env — see Environment variables below
```

### Database

```bash
npx prisma db push   # apply schema
npx prisma db seed   # seed default scoring rules and sample data
```

Helper script for a local Postgres bootstrap: `./setup-db.ps1` (Windows) or `setup-db.bat`.

### Run

```bash
npm run dev
```

Open:

- http://localhost:3000 — landing page
- http://localhost:3000/admin — admin dashboard
- http://localhost:3000/draft — participant draft UI

---

## Environment variables

Full list in `.env.example`. What you actually need:

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

App runs without Pusher or Sportmonks. Real-time drops to polling, and live data falls back to whatever is already in the database.

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

## Usage walkthrough

1. **Add participants** at `Admin → Participants`. Minimum 2.
2. **Configure the draft** at `Admin → Configuration`. Set roster size, total rounds, per-team cap, mandatory roles, early-round rules. Config locks once a draft starts.
3. **Load players.** Either import manually (`Admin → Players`) or pull a season's squads from Sportmonks (`Admin → Sync`, then "Load season from Sportmonks"). Syncing populates leagues, seasons, teams, and the draft pool in one pass.
4. **Start the draft** at `Admin → Monitor Draft → Start Draft`. Pick participants and order type (snake or linear).
5. **Make picks.** Participants log in at `/draft/login` with their email. The rule engine validates every pick: team cap, role minimums, early-round mins, no duplicates.
6. **Track results.** Once fixtures are synced and played, team and fantasy-player leaderboards update from match results and scoring rules.

### Draft rules

- Snake order: direction reverses each round. Round 1 A→B→C, round 2 C→B→A, round 3 A→B→C.
- Linear order: same order every round.
- Team cap: max picks from a single IPL team.
- Role minimums: required count per role (Bat/Bowl/AR/WK) by the end of the draft.
- Early-round rules: in the first N rounds, require minimum counts of specified roles (e.g. ≥2 Bat and ≥2 Bowl in the first 4 rounds).

---

## Live score ingestion (Sportmonks)

Scoring data comes from the Sportmonks Cricket API. Your plan needs Cricket included. A 404 usually means the token is for a different product.

### Sync flow

1. Set `SPORTMONKS_API_TOKEN` in `.env`.
2. Open `Admin → Sync`.
3. If leagues/seasons are empty, hit **Run full sync (no filter)** once to pull them.
4. Pick a league and season, then **Load season from Sportmonks**. This upserts teams, squad players (the draft pool), and fixtures.
5. Default scoring rules: `win=3`, `tie=1`, `no-result=1`, `loss=0`. Editable via the `ScoringRule` table.

### Scheduled sync

`vercel.json` has a cron hitting `POST /api/sync/cricket-data` every 15 minutes. The route needs `Authorization: Bearer <CRON_SECRET>` (or the `x-cron-secret` header). Uses `CRON_SECRET`, falls back to `ADMIN_SECRET`.

---

## API reference

Main endpoints. Full list under `src/app/api/`.

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

### Sync & health

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

- Unit and integration tests live beside source under `__tests__/` directories.
- Mock helpers: `src/__tests__/helpers/` (Prisma, Pusher, Next request, factories).
- E2E specs: `e2e/`. Seeds a disposable dataset via `e2e/seed.ts` and runs admin and draft flows.
- CI: GitHub Actions workflows under `.github/workflows/` run the suite and upload coverage on push.

---

## Deployment

Targets Vercel.

1. Import the repo in Vercel.
2. Set env vars in project settings (see above).
3. Point `DATABASE_URL` at the pooled connection (Supabase port 6543) and `DIRECT_URL` at the direct one (5432) so migrations work.
4. Deploy. The `postinstall` hook runs `prisma generate`.
5. `vercel.json` wires up the `/api/sync/cricket-data` cron (every 15 minutes).
6. Run `npm run check:prod` locally before shipping to catch missing env vars, weak secrets, or dev defaults.

---

## Project structure

```
cricket-app/
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── admin/            # Admin dashboard (config, players, participants, sync, monitor, leaderboard)
│   │   ├── api/              # REST endpoints (draft, auth, leaderboard, sync, ...)
│   │   └── draft/            # Participant-facing draft UI
│   ├── components/           # UI + feature components (admin/, draft/, ui/)
│   ├── hooks/                # React hooks (draft realtime, toast)
│   ├── lib/                  # Core libs: rule engine, state manager, auth, rate limit, sportmonks client
│   ├── services/             # Domain services: ingestion, scoring, ranking, leaderboard
│   ├── stores/               # Zustand stores (toast)
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

Issues and PRs welcome. For bigger changes, open an issue first so we can talk through the approach.
