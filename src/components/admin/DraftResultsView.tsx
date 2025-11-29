'use client';

import { useState, useEffect } from 'react';
import { Player, DraftConfig } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlayerChip } from '@/components/PlayerChip';

interface ParticipantRoster {
  participantId: string;
  participantName: string;
  participantEmail?: string | null;
  position: number;
  roster: Player[];
  teamCount: Record<string, number>;
  roleCount: {
    Bat: number;
    Bowl: number;
    AR: number;
    WK: number;
  };
  mandatoryRoles: {
    Bat: number;
    Bowl: number;
    AR: number;
    WK: number;
  };
  roleValidation: {
    Bat: boolean;
    Bowl: boolean;
    AR: boolean;
    WK: boolean;
  };
  allRolesMet: boolean;
}

interface DraftResults {
  draftState: {
    id: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    totalRounds: number;
  };
  draftConfig: DraftConfig;
  participantRosters: ParticipantRoster[];
  allParticipantsMeetRequirements: boolean;
  totalPicks: number;
}

export function DraftResultsView() {
  const [results, setResults] = useState<DraftResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/draft/results');
      if (!response.ok) {
        throw new Error('Failed to fetch draft results');
      }
      const data = await response.json();
      if (data.success) {
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

  const exportAsJSON = () => {
    if (!results) return;

    const data = {
      draftState: results.draftState,
      draftConfig: results.draftConfig,
      participantRosters: results.participantRosters.map(pr => ({
        ...pr,
        roster: pr.roster.map(p => ({
          id: p.id,
          name: p.name,
          team: p.team,
          role: p.role,
          isForeign: p.isForeign
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft-results-${results.draftState.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (!results) return;

    const headers = ['Participant', 'Position', 'Player Name', 'Team', 'Role', 'Is Foreign'];
    const rows = results.participantRosters.flatMap(pr =>
      pr.roster.map(player => [
        pr.participantName,
        (pr.position + 1).toString(),
        player.name,
        player.team,
        player.role,
        player.isForeign ? 'Yes' : 'No'
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft-results-${results.draftState.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportFormat === 'json') {
      exportAsJSON();
    } else {
      exportAsCSV();
    }
  };

  if (loading) {
    return <LoadingSpinner variant="full-page" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Draft Results</h2>
          <p className="text-sm text-gray-600 mt-1">
            View completed draft results and export data
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchResults}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Draft Results</h2>
          <p className="text-sm text-gray-600 mt-1">
            View completed draft results and export data
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No completed draft found</p>
        </div>
      </div>
    );
  }

  const selectedRoster = results.participantRosters.find(
    pr => pr.participantId === selectedParticipant
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Draft Results</h2>
          <p className="text-sm text-gray-600 mt-1">
            View completed draft results and export data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            📥 Export
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-2">🎉 Draft Complete!</h3>
        <p className="text-green-100 mb-4">
          All {results.draftState.totalRounds} rounds completed with {results.totalPicks} total picks
        </p>
        <div className="bg-white bg-opacity-20 rounded-lg px-4 py-3">
          {results.allParticipantsMeetRequirements ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="font-medium">
                All participants met mandatory role requirements
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span className="font-medium">
                Some participants did not meet mandatory role requirements
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participant List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Participants
            </h3>
            <div className="space-y-2">
              {results.participantRosters.map(pr => (
                <button
                  key={pr.participantId}
                  onClick={() => setSelectedParticipant(pr.participantId)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedParticipant === pr.participantId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {pr.participantName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Position {pr.position + 1}
                      </p>
                    </div>
                    {pr.allRolesMet ? (
                      <span className="text-green-600 text-xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Roster Details */}
        <div className="lg:col-span-2">
          {selectedRoster && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedRoster.participantName}'s Roster
              </h3>

              {/* Role Validation */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Role Requirements
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['Bat', 'Bowl', 'AR', 'WK'] as const).map(role => (
                    <div
                      key={role}
                      className={`px-3 py-2 rounded-lg ${
                        selectedRoster.roleValidation[role]
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-red-100 border border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          {role}
                        </span>
                        {selectedRoster.roleValidation[role] ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {selectedRoster.roleCount[role]} /{' '}
                        {selectedRoster.mandatoryRoles[role]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Distribution */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Team Distribution
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedRoster.teamCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([team, count]) => (
                      <div
                        key={team}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-full"
                      >
                        <span className="text-xs font-medium text-gray-700">
                          {team}
                        </span>
                        <span className="text-xs font-bold text-gray-900 ml-1">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Roster Players */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
