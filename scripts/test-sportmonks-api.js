#!/usr/bin/env node
/**
 * Standalone script to test the Sportmonks Cricket API.
 * Loads .env from project root. Run from cricket-app: node scripts/test-sportmonks-api.js
 *
 * Usage: node scripts/test-sportmonks-api.js
 *    or: npm run test:sportmonks
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const BASE = (process.env.SPORTMONKS_BASE_URL || 'https://cricket.sportmonks.com/api/v2.0').replace(/\/$/, '');
const TOKEN = process.env.SPORTMONKS_API_TOKEN;

function buildUrl(pathname, params = {}) {
  const url = new URL(pathname.startsWith('http') ? pathname : `${BASE}/${pathname.replace(/^\//, '')}`);
  url.searchParams.set('api_token', TOKEN);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text || '{}');
}

async function main() {
  console.log('Sportmonks Cricket API test\n');
  console.log('Base URL:', BASE);
  if (!TOKEN) {
    console.error('ERROR: SPORTMONKS_API_TOKEN is not set in .env');
    process.exit(1);
  }
  console.log('Token: set (' + TOKEN.slice(0, 4) + '...)\n');

  try {
    // 1. Leagues
    console.log('1. GET /leagues');
    const leaguesRes = await fetchJson(buildUrl('/leagues'));
    const leagues = Array.isArray(leaguesRes.data) ? leaguesRes.data : [leaguesRes.data].filter(Boolean);
    console.log('   Leagues found:', leagues.length);
    if (leagues.length === 0) {
      console.log('   No leagues returned. Check your plan at my.sportmonks.com (Cricket API access).');
      process.exit(1);
    }
    leagues.slice(0, 3).forEach((l, i) => console.log('   -', l.name || l.id, '(id:', l.id + ')'));

    const firstLeague = leagues[0];
    const leagueId = firstLeague.id;

    // 2. Seasons: try GET /seasons (all) then filter by league; Cricket API may not have /leagues/:id/seasons
    let seasons = [];
    console.log('\n2. GET /seasons (all seasons for your plan)');
    try {
      const seasonsRes = await fetchJson(buildUrl('/seasons'));
      seasons = Array.isArray(seasonsRes.data) ? seasonsRes.data : [seasonsRes.data].filter(Boolean);
      console.log('   Total seasons:', seasons.length);
    } catch (e) {
      console.log('   Failed:', e.message);
      console.log('   Trying GET /leagues/' + leagueId + '/seasons ...');
      const seasonsRes = await fetchJson(buildUrl('/leagues/' + leagueId + '/seasons'));
      seasons = Array.isArray(seasonsRes.data) ? seasonsRes.data : [seasonsRes.data].filter(Boolean);
    }
    const seasonsForLeague = seasons.filter((s) => s.league_id === leagueId || s.leagueId === leagueId);
    if (seasonsForLeague.length > 0) {
      console.log('   Seasons for league', leagueId + ':', seasonsForLeague.length);
      seasonsForLeague.slice(0, 3).forEach((s) => console.log('   -', s.name || s.id, '(id:', s.id + ')'));
    } else if (seasons.length > 0) {
      console.log('   First 3 seasons (any league):');
      seasons.slice(0, 3).forEach((s) => console.log('   -', s.name || s.id, '(id:', s.id + ', league_id:', (s.league_id ?? s.leagueId) + ')'));
    }
    const firstSeasonId = (seasonsForLeague.length ? seasonsForLeague[0] : seasons[0])?.id;

    // 3. Teams by season (Cricket allows filter[season_id] only)
    if (firstSeasonId) {
      console.log('\n3. GET /teams?filter[season_id]=' + firstSeasonId);
      try {
        const teamsRes = await fetchJson(buildUrl('/teams', { 'filter[season_id]': firstSeasonId }));
        const seasonTeams = Array.isArray(teamsRes.data) ? teamsRes.data : [teamsRes.data].filter(Boolean);
        console.log('   Teams for season:', seasonTeams.length);
        if (seasonTeams.length > 0) seasonTeams.slice(0, 5).forEach((t) => console.log('   -', t.name || t.id));
      } catch (e) {
        console.log('   Failed:', e.message);
      }
    }

    // 4. Fixtures for first season - sync uses GET /fixtures?filter[season_id]=X
    if (firstSeasonId) {
      console.log('\n4. GET /fixtures?filter[season_id]=' + firstSeasonId);
      try {
        const fixRes = await fetchJson(buildUrl('/fixtures', { 'filter[season_id]': firstSeasonId, per_page: 10 }));
        const fixtures = Array.isArray(fixRes.data) ? fixRes.data : [fixRes.data].filter(Boolean);
        console.log('   Fixtures found:', fixtures.length);
      } catch (e) {
        console.log('   Failed:', e.message);
      }
    }

    // 5. Teams with squad for first season (optional; some plans return 500)
    if (firstSeasonId) {
      console.log('\n5. GET /teams?include=squad&filter[season_id]=' + firstSeasonId);
      try {
        const teamsRes = await fetchJson(buildUrl('/teams', { include: 'squad', 'filter[season_id]': firstSeasonId }));
        const teams = Array.isArray(teamsRes.data) ? teamsRes.data : [teamsRes.data].filter(Boolean);
        console.log('   Teams found:', teams.length);
        let totalPlayers = 0;
        teams.forEach((t) => {
          const squad = t.squad || [];
          totalPlayers += Array.isArray(squad) ? squad.length : 0;
        });
        console.log('   Squad players (total):', totalPlayers);
      } catch (e) {
        console.log('   Warning:', e.message);
        console.log('   (Teams/squad may require a higher plan or different params.)');
      }
    } else {
      console.log('\n3. Skipped (no seasons to test teams/squad)');
    }

    console.log('\n--- API test passed (leagues + seasons OK) ---');
  } catch (err) {
    console.error('\nERROR:', err.message);
    if (err.message.includes('404')) {
      console.error('404 usually means: (1) your token does not include Cricket API, or (2) wrong base URL.');
      console.error('Check your plan at https://my.sportmonks.com/');
    }
    process.exit(1);
  }
}

main();
