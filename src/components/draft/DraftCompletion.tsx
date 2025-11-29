'use client';

import { useState } from 'react';
import { Player, DraftConfig } from '@/types';
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

interface DraftCompletionProps {
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
  onClose?: () => void;
}

export function DraftCompletion({
  draftState,
  draftConfig,
  participantRosters,
  allParticipantsMeetRequirements,
  totalPicks,
  onClose
}: DraftCompletionProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    participantRosters[0]?.participantId || null
  );
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const selectedRoster = participantRosters.find(
    pr => pr.participantId === selectedParticipant
  );

  // Export functions
  const exportAsJSON = () => {
    const data = {
      draftState,
      draftConfig,
      participantRosters: participantRosters.map(pr => ({
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
    a.download = `draft-results-${draftState.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    // Create CSV with all rosters
    const headers = ['Participant', 'Position', 'Player Name', 'Team', 'Role', 'Is Foreign'];
    const rows = participantRosters.flatMap(pr =>
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
    a.download = `draft-results-${draftState.id}.csv`;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🎉 Draft Complete!</h1>
              <p className="text-green-100">
                All {draftState.totalRounds} rounds completed with {totalPicks} total picks
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-green-100 text-2xl"
              >
                ✕
              </button>
            )}
          </div>

          {/* Validation status */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-lg px-4 py-3">
            {allParticipantsMeetRequirements ? (
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Participant list */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Participants
              </h2>
              <div className="space-y-2">
                {participantRosters.map(pr => (
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

            {/* Selected roster details */}
            <div className="lg:col-span-2">
              {selectedRoster && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {selectedRoster.participantName}'s Roster
                  </h2>

                  {/* Role validation */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Role Requirements
                    </h3>
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

                  {/* Team distribution */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Team Distribution
                    </h3>
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

                  {/* Roster players */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Players ({selectedRoster.roster.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedRoster.roster.map(player => (
                        <PlayerChip
                          key={player.id}
                          player={player}
                          status="drafted"
                          onClick={() => {}}
                          disabled={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with export options */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Export Format:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    exportFormat === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    exportFormat === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              📥 Export Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
