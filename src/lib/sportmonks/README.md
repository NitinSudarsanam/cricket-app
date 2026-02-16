# Sportmonks Cricket API integration

This folder contains the client, DTOs, and mappers for the Sportmonks Cricket API 2.0.

## Response shape

- The API returns a standard envelope: `{ data: T, meta?: { pagination?: { current_page, per_page, total } } }`.
- Some endpoints return an array in `data`; others return a single object. The client normalizes so callers always receive arrays where applicable (e.g. `getLeagues()`, `getTeams()`).
- All external IDs from the API are numeric; we store them as strings in the DB (`externalId`). Mappers use `String(api.id)`.

## Usage

- **Read path:** The app never calls Sportmonks at read time. Draft, leaderboard, and matches read from the database. Data enters only via the sync pipeline (client → mappers → sync service → DB).
- **Write path:** Sync is triggered by `POST /api/sync/cricket-data` (admin or cron). The sync service uses the client and mappers to fetch and upsert leagues, seasons, teams, squad players, and fixtures.

## Troubleshooting

- **404:** Usually means the API token does not include Cricket API access. In [MySportmonks](https://my.sportmonks.com/) ensure your subscription includes Cricket (not only Football/other). If Sportmonks provided a different base URL, set `SPORTMONKS_BASE_URL` in `.env`.

## Docs

- [Sportmonks Cricket API 2.0](https://docs.sportmonks.com/v2/cricket-api/)
