'use client';

import { useState, useEffect } from 'react';
import { runSyncFromSportmonks, checkSportmonksApi, type SportmonksCheckResult } from '@/app/admin/(dashboard)/sync/actions';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui';

interface LeagueItem {
  id: string;
  name: string;
  slug: string | null;
}

interface SeasonItem {
  id: string;
  name: string;
  startDate: string | null;
  leagueId: string;
  league?: { id: string; name: string; slug: string | null } | null;
}

export function SyncView() {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [leagueId, setLeagueId] = useState<string>('');
  const [seasonId, setSeasonId] = useState<string>('');
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    leaguesUpserted: number;
    seasonsUpserted: number;
    teamsUpserted: number;
    playersUpserted: number;
    matchesUpserted: number;
    matchResultsProcessed: number;
    playerStatsUpserted?: number;
    errors: string[];
  } | null>(null);
  const [apiCheck, setApiCheck] = useState<SportmonksCheckResult | null>(null);
  const [checkingApi, setCheckingApi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeagues();
  }, []);

  useEffect(() => {
    if (leagueId) {
      loadSeasons();
    } else {
      setSeasons([]);
      setSeasonId('');
    }
  }, [leagueId]);

  const loadLeagues = async () => {
    setLoadingLeagues(true);
    setError(null);
    try {
      const res = await fetch('/api/leagues?limit=50');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leagues');
      if (data.success && data.data?.items) {
        setLeagues(data.data.items);
        if (data.data.items.length > 0 && !leagueId) setLeagueId(data.data.items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLoadingLeagues(false);
    }
  };

  const loadSeasons = async () => {
    setLoadingSeasons(true);
    setError(null);
    try {
      const url = leagueId
        ? `/api/seasons?leagueId=${encodeURIComponent(leagueId)}&limit=50`
        : '/api/seasons?limit=50';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch seasons');
      const items = data.success && Array.isArray(data.data?.items) ? data.data.items : [];
      setSeasons(items);
      if (items.length > 0) {
        setSeasonId((current) => (items.some((s: SeasonItem) => s.id === current) ? current : items[0].id));
      } else {
        setSeasonId('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleLoadLeagues = () => {
    loadLeagues();
  };

  const handleLeagueChange = (id: string) => {
    setLeagueId(id);
    setSeasonId('');
  };

  const handleLoadSeasons = () => {
    loadSeasons();
  };

  const handleCheckApi = async () => {
    setCheckingApi(true);
    setError(null);
    try {
      const check = await checkSportmonksApi();
      setApiCheck(check);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setCheckingApi(false);
    }
  };

  const handleSync = async (options?: { leagueId?: string; seasonId?: string }) => {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const syncResult = await runSyncFromSportmonks({
        leagueId: options?.leagueId || (leagueId || undefined),
        seasonId: options?.seasonId || (seasonId || undefined),
      });
      setResult(syncResult);
      await loadLeagues();
      if (leagueId) await loadSeasons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loadingLeagues && leagues.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-4" />
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  return (
    <div className="stack-xl">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Load from Sportmonks</h2>
        <p className="text-muted mt-1">
          Sync leagues, seasons, teams, and draft player pool. Select a season and run sync to populate data for draft and leaderboard.
        </p>
      </div>

      {error && (
        <ErrorState message={error} onRetry={() => setError(null)} title="Error" />
      )}

      <div className="card-padded stack-lg">
        <h3 className="section-title">0. Check Sportmonks API</h3>
        <p className="text-muted">
          Verify your API token and that Sportmonks returns leagues, seasons, and squad data.
        </p>
        <Button type="button" onClick={handleCheckApi} disabled={checkingApi} variant="secondary">
          {checkingApi ? 'Checking…' : 'Check Sportmonks API'}
        </Button>
        {apiCheck && (
          <div className="mt-3 p-3 bg-surface rounded border border-slate-200 text-sm">
            {apiCheck.success ? (
              <ul className="space-y-1 text-slate-700">
                <li>Token: set</li>
                <li>Leagues: {apiCheck.leaguesCount ?? 0}</li>
                {apiCheck.sampleLeague && (
                  <li>Sample league: {apiCheck.sampleLeague.name} (id: {apiCheck.sampleLeague.id})</li>
                )}
                <li>Seasons (first league): {apiCheck.seasonsCount ?? 0}</li>
                {apiCheck.sampleSeason && (
                  <li>Sample season: {apiCheck.sampleSeason.name} (id: {apiCheck.sampleSeason.id})</li>
                )}
                <li>Teams with squad: {apiCheck.teamsWithSquadCount ?? 0}</li>
                <li>Squad players: {apiCheck.squadPlayersCount ?? 0}</li>
              </ul>
            ) : (
              <p className="text-amber-800">
                {apiCheck.error ?? 'Check failed'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card-padded stack-lg">
        <h3 className="section-title">1. Fetch leagues and seasons</h3>
        <p className="text-muted">
          If the lists below are empty, run a full sync first to pull leagues and seasons from Sportmonks.
        </p>
        <Button
          type="button"
          onClick={() => handleSync({})}
          disabled={syncing}
          variant="secondary"
        >
          {syncing ? 'Syncing…' : 'Run full sync (no filter)'}
        </Button>
      </div>

      <div className="card-padded stack-lg">
        <h3 className="section-title">2. Select league and season</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleLoadLeagues}
            disabled={loadingLeagues}
            variant="secondary"
            size="sm"
          >
            Refresh leagues
          </Button>
          <select
            value={leagueId}
            onChange={(e) => handleLeagueChange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white min-w-[200px]"
          >
            <option value="">— Select league —</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <Button
            type="button"
            onClick={handleLoadSeasons}
            disabled={loadingSeasons || !leagueId}
            variant="secondary"
            size="sm"
          >
            Load seasons
          </Button>
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            disabled={!leagueId || loadingSeasons}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white min-w-[200px] disabled:opacity-60"
          >
            <option value="">— Select season —</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.league?.name ? `(${s.league.name})` : ''}
              </option>
            ))}
          </select>
        </div>
        {!leagueId && (
          <p className="text-sm text-slate-500 mt-1">Select a league first. If the league list is empty, run &quot;Run full sync (no filter)&quot; above.</p>
        )}
        {leagueId && !loadingSeasons && seasons.length === 0 && (
          <p className="text-sm text-amber-700 mt-1">No seasons for this league. Run &quot;Run full sync (no filter)&quot; to pull leagues and seasons from Sportmonks, then refresh leagues and try again.</p>
        )}
      </div>

      <div className="card-padded stack-lg">
        <h3 className="section-title">3. Load season from Sportmonks</h3>
        <p className="text-muted">
          This syncs teams, draft players (squads), and optionally fixtures for the selected season.
        </p>
        <Button
          type="button"
          onClick={() =>
            handleSync({ seasonId: seasonId || undefined, leagueId: leagueId || undefined })
          }
          disabled={syncing || !seasonId}
          variant="primary"
        >
          {syncing ? 'Syncing…' : 'Load season from Sportmonks'}
        </Button>
      </div>

      {result && (
        <div className="card-padded stack-md">
          <h3 className="section-title">Last sync result</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>Leagues: {result.leaguesUpserted}</li>
            <li>Seasons: {result.seasonsUpserted}</li>
            <li>Teams: {result.teamsUpserted}</li>
            <li>Players (draft pool): {result.playersUpserted}</li>
            <li>Matches: {result.matchesUpserted}</li>
            <li>Match results processed: {result.matchResultsProcessed}</li>
            <li>Player match stats: {result.playerStatsUpserted ?? 0}</li>
          </ul>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-amber-800">Errors ({result.errors.length})</p>
              <ul className="text-xs text-slate-600 mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                {result.errors.slice(0, 15).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 15 && (
                  <li>… and {result.errors.length - 15} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
