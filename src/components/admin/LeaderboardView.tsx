'use client';

import React, { useState, useEffect } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { Button, Card } from '@/components/ui';

interface SeasonItem {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  league?: { id: string; name: string; slug: string | null } | null;
}

interface TeamLeaderboardItem {
  teamId: string;
  name: string;
  shortCode: string | null;
  imageUrl: string | null;
  points: number;
  matchesPlayed: number;
  wins: number;
  ties: number;
  noResults: number;
  losses: number;
  lastMatchAt: string | null;
}

interface PlayerLeaderboardItem {
  playerId: string;
  name: string;
  team: string;
  points: number;
  source: string;
}

interface FantasyLeaderboardItem {
  participantId: string;
  participantName: string;
  totalPoints: number;
  playerCount: number;
  players: Array<{
    playerId: string;
    playerName: string;
    team: string;
    points: number;
  }>;
}

interface DraftStateItem {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
}

type Tab = 'teams' | 'players' | 'fantasy';

export function LeaderboardView() {
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [seasonId, setSeasonId] = useState<string>('');
  const [tab, setTab] = useState<Tab>('teams');
  const [teams, setTeams] = useState<TeamLeaderboardItem[]>([]);
  const [players, setPlayers] = useState<PlayerLeaderboardItem[]>([]);
  const [fantasy, setFantasy] = useState<FantasyLeaderboardItem[]>([]);
  const [teamsTotal, setTeamsTotal] = useState(0);
  const [playersTotal, setPlayersTotal] = useState(0);
  const [fantasyTotal, setFantasyTotal] = useState(0);
  const [draftStates, setDraftStates] = useState<DraftStateItem[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasons();
    fetchDraftStates();
  }, []);

  useEffect(() => {
    if (seasonId) {
      fetchLeaderboard();
    } else {
      setTeams([]);
      setPlayers([]);
      setFantasy([]);
      setTeamsTotal(0);
      setPlayersTotal(0);
      setFantasyTotal(0);
    }
  }, [seasonId, selectedDraftId]);

  const fetchSeasons = async () => {
    try {
      setError(null);
      const res = await fetch('/api/seasons?limit=50');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch seasons');
      if (data.success && data.data?.items) {
        setSeasons(data.data.items);
        if (data.data.items.length > 0 && !seasonId) {
          setSeasonId(data.data.items[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setLoadingSeasons(false);
    }
  };

  const fetchDraftStates = async () => {
    try {
      const res = await fetch('/api/draft/state');
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        // We get the most recent draft, but we'll show it as the option
        setDraftStates([{
          id: data.data.id,
          status: data.data.status,
          startedAt: data.data.startedAt,
          completedAt: data.data.completedAt,
        }]);
        if (data.data.id && !selectedDraftId) {
          setSelectedDraftId(data.data.id);
        }
      }
    } catch (err) {
      console.error('Error fetching draft states:', err);
    }
  };

  const fetchLeaderboard = async () => {
    if (!seasonId) return;
    setLoadingLeaderboard(true);
    setError(null);
    try {
      const requests = [
        fetch(`/api/leaderboard/teams?seasonId=${encodeURIComponent(seasonId)}&limit=50`),
        fetch(`/api/leaderboard/players?seasonId=${encodeURIComponent(seasonId)}&limit=50`),
      ];

      // Add fantasy request if we have a draft selected
      if (selectedDraftId) {
        requests.push(
          fetch(`/api/leaderboard/fantasy?draftStateId=${encodeURIComponent(selectedDraftId)}&seasonId=${encodeURIComponent(seasonId)}&limit=50`)
        );
      }

      const responses = await Promise.all(requests);
      const [teamsRes, playersRes, fantasyRes] = responses;
      
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();
      
      if (!teamsRes.ok) throw new Error(teamsData.error || 'Failed to fetch team leaderboard');
      if (!playersRes.ok) throw new Error(playersData.error || 'Failed to fetch player leaderboard');
      
      if (teamsData.success && teamsData.data) {
        setTeams(teamsData.data.items ?? []);
        setTeamsTotal(teamsData.data.total ?? 0);
      }
      if (playersData.success && playersData.data) {
        setPlayers(playersData.data.items ?? []);
        setPlayersTotal(playersData.data.total ?? 0);
      }

      // Handle fantasy data if available
      if (fantasyRes) {
        const fantasyData = await fantasyRes.json();
        if (fantasyRes.ok && fantasyData.success && fantasyData.data) {
          setFantasy(fantasyData.data.items ?? []);
          setFantasyTotal(fantasyData.data.total ?? 0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  if (loadingSeasons) {
    return (
      <div className="stack-xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card padded>
          <Skeleton className="h-10 w-56 mb-4" />
          <div className="stack-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Leaderboard</h2>
          <p className="text-sm text-slate-600 mt-1">
            Team and player rankings by season (from sync data)
          </p>
        </div>
      </div>

      {seasons.length === 0 ? (
        <Card padded className="bg-slate-50 text-center">
          <div className="text-slate-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No seasons yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Run sync to pull leagues and seasons from Sportmonks. Then leaderboard data will appear here after matches are processed.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="leaderboard-season" className="text-sm font-medium text-slate-700">
              Season
            </label>
            <select
              id="leaderboard-season"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white min-w-[200px]"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.league?.name ? ` (${s.league.name})` : ''}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={fetchLeaderboard}
              disabled={loadingLeaderboard}
              variant="secondary"
              size="sm"
            >
              {loadingLeaderboard ? 'Loading…' : 'Refresh'}
            </Button>
          </div>

          {error && (
            <ErrorState message={error} onRetry={seasonId ? fetchLeaderboard : fetchSeasons} title="Failed to load leaderboard" />
          )}

          {!error && seasonId && (
            <>
              <div className="border-b border-slate-200">
                <nav className="flex gap-6" aria-label="Leaderboard tabs">
                  <button
                    type="button"
                    onClick={() => setTab('teams')}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      tab === 'teams'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Teams ({teamsTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('players')}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      tab === 'players'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Players ({playersTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('fantasy')}
                    className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      tab === 'fantasy'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Fantasy ({fantasyTotal})
                  </button>
                </nav>
              </div>

              {loadingLeaderboard ? (
                <Card padded>
                  <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                </Card>
              ) : tab === 'teams' ? (
                <Card padded className="p-0 overflow-hidden">
                  {teams.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 text-center">
                      No team standings for this season yet. Sync fixtures and process finished matches to see rankings.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              #
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Team
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Pts
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              P
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              W
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              L
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              T / NR
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {teams.map((row, idx) => (
                            <tr key={row.teamId} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">
                                {row.shortCode ? `${row.name} (${row.shortCode})` : row.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">{row.points}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.matchesPlayed}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.wins}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.losses}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.ties + row.noResults}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ) : tab === 'players' ? (
                <Card padded className="p-0 overflow-hidden">
                  {players.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 text-center">
                      No player rankings for this season yet. Player points are derived from team standings after sync.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              #
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Player
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Team
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {players.map((row, idx) => (
                            <tr key={row.playerId} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{idx + 1}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">{row.name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{row.team}</td>
                              <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              ) : (
                <Card padded className="p-0 overflow-hidden">
                  {!selectedDraftId ? (
                    <p className="p-6 text-sm text-slate-500 text-center">
                      No draft data available. Complete a draft to see fantasy leaderboard.
                    </p>
                  ) : fantasy.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 text-center">
                      No fantasy rankings yet. Participants need drafted players with points from this season.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Rank
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Participant
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Total Points
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Players
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Details
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {fantasy.map((row, idx) => (
                            <React.Fragment key={row.participantId}>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{idx + 1}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.participantName}</td>
                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-bold text-emerald-600">{row.totalPoints}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.playerCount}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedParticipant(expandedParticipant === row.participantId ? null : row.participantId)}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                  >
                                    {expandedParticipant === row.participantId ? 'Hide' : 'Show'}
                                  </button>
                                </td>
                              </tr>
                              {expandedParticipant === row.participantId && (
                                <tr>
                                  <td colSpan={5} className="px-4 py-3 bg-slate-50">
                                    <div className="text-xs text-slate-700 font-medium mb-2">Drafted Players:</div>
                                    <div className="space-y-1">
                                      {row.players.map((player) => (
                                        <div key={player.playerId} className="flex justify-between items-center text-xs py-1 px-2 bg-white rounded border border-slate-200">
                                          <span className="text-slate-700">{player.playerName} <span className="text-slate-500">({player.team})</span></span>
                                          <span className="font-medium text-slate-900">{player.points} pts</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
