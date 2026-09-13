'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/Skeleton';
import { PlayerChip } from '@/components/PlayerChip';
import { Button, Card, Badge, StatDisplay } from '@/components/ui';
import {
  downloadDraftResults,
  type DraftResultsSnapshot,
} from '@/lib/draft-results-export';

export function DraftResultsView() {
  const [results, setResults] = useState<DraftResultsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setError(null);
      const response = await fetch('/api/draft/results');
      const data = await response.json().catch(() => ({}));

      if (response.status === 404 || (data.success === false && !data.data)) {
        setResults(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch draft results');
      }
      if (data.success && data.data) {
        setResults(data.data);
        setSelectedParticipant(data.data.participantRosters[0]?.participantId || null);
      } else {
        throw new Error(data.error || 'Failed to fetch results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;
    downloadDraftResults(results, exportFormat);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-44 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Draft Results</h2>
          <p className="text-sm text-slate-600 mt-1">
            View completed draft results and export data
          </p>
        </div>
        <ErrorState message={error} onRetry={fetchResults} title="Failed to load results" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Draft Results</h2>
          <p className="text-sm text-slate-600 mt-1">
            View completed draft results and export data
          </p>
        </div>
        <Card padded className="bg-slate-50 text-center">
          <div className="text-slate-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No completed draft yet</h3>
          <p className="text-sm text-slate-600 mb-4">
            Complete a draft to see results and export rosters here.
          </p>
          <Link href="/admin/monitor" className="inline-block btn-primary">
            Go to Monitor Draft
          </Link>
        </Card>
      </div>
    );
  }

  const selectedRoster = results.participantRosters.find(
    pr => pr.participantId === selectedParticipant
  );

  return (
    <div className="stack-xl">
      {/* Header */}
      <div className="flex-center-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Draft Results</h2>
          <p className="text-muted mt-1">
            View completed draft results and export data
          </p>
        </div>
        <div className="flex-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <Button onClick={handleExport} variant="primary">
            Export
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card padded className="bg-emerald-600 text-white">
        <h3 className="text-xl font-bold mb-2">Draft complete</h3>
        <p className="text-emerald-100 mb-4">
          All {results.draftState.totalRounds} rounds completed with {results.totalPicks} total picks
        </p>
        <div className="bg-white bg-opacity-20 rounded-md px-4 py-3">
          <span className="font-medium">
            {results.allParticipantsMeetRequirements
              ? 'All participants met mandatory role requirements'
              : 'Some participants did not meet mandatory role requirements'}
          </span>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participant List */}
        <div className="lg:col-span-1">
          <Card padded>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Participants
            </h3>
            <div className="space-y-2">
              {results.participantRosters.map(pr => (
                <button
                  key={pr.participantId}
                  onClick={() => setSelectedParticipant(pr.participantId)}
                  className={`w-full text-left px-4 py-3 rounded-md border-2 transition-all ${
                    selectedParticipant === pr.participantId
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{pr.participantName}</p>
                      <p className="text-xs text-slate-500">Position {pr.position + 1}</p>
                    </div>
                    <Badge variant={pr.allRolesMet ? 'success' : 'danger'}>
                      {pr.allRolesMet ? 'OK' : 'Check'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Selected Roster Details */}
        <div className="lg:col-span-2">
          {selectedRoster && (
            <Card padded>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {selectedRoster.participantName}'s Roster
              </h3>

              {/* Role Validation */}
              <Card padded className="bg-slate-50 mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Role Requirements
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['Bat', 'Bowl', 'AR', 'WK'] as const).map(role => (
                    <div
                      key={role}
                      className={`px-3 py-2 rounded-md ${
                        selectedRoster.roleValidation[role]
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-red-100 border border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          {role}
                        </span>
                        {selectedRoster.roleValidation[role] ? (
                          <span className="text-green-600">PASS</span>
                        ) : (
                          <span className="text-red-600">FAIL</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {selectedRoster.roleCount[role]} /{' '}
                        {selectedRoster.mandatoryRoles[role]}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Team Distribution */}
              <Card padded className="bg-slate-50 mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Team Distribution
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedRoster.teamCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([team, count]) => (
                      <div
                        key={team}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-full"
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {team}
                        </span>
                        <span className="text-xs font-bold text-slate-900 ml-1">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Roster Players */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Players ({selectedRoster.roster.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedRoster.roster.map(player => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="drafted"
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
