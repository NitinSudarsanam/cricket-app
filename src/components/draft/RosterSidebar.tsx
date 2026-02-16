'use client';

import { useState, useCallback } from 'react';
import { Player, DraftConfig, IPLTeam, PlayerRole, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { PlayerChip } from '@/components/PlayerChip';
import { TEAM_COLORS } from '@/config/team-colors';

export interface RosterSidebarProps {
  roster: Player[];
  draftConfig: DraftConfig;
  participantName: string;
  onPlayerDrop?: (playerId: string) => void;
}

export function RosterSidebar({
  roster,
  draftConfig,
  participantName,
  onPlayerDrop,
}: RosterSidebarProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const data = e.dataTransfer.getData('application/json');
      if (!data || !onPlayerDrop) return;
      try {
        const { playerId } = JSON.parse(data) as { playerId?: string };
        if (playerId) onPlayerDrop(playerId);
      } catch {}
    },
    [onPlayerDrop]
  );
  // Calculate team counts
  const teamCount = roster.reduce((acc, player) => {
    acc[player.team] = (acc[player.team] || 0) + 1;
    return acc;
  }, {} as Record<IPLTeam, number>);

  // Calculate role counts
  const roleCount = roster.reduce((acc, player) => {
    acc[player.role] = (acc[player.role] || 0) + 1;
    return acc;
  }, {} as Record<PlayerRole, number>);

  // Calculate remaining slots
  const remainingSlots = draftConfig.rosterSize - roster.length;

  return (
    <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">{participantName}</h2>
        <p className="text-sm text-slate-600 mt-1">
          {roster.length} / {draftConfig.rosterSize} players
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thin">
        {/* My Roster - drop zone for drag-to-draft */}
        <div
          className={`px-4 py-4 border-b border-slate-200 transition-colors ${dragOver ? 'bg-emerald-50 border-emerald-300 rounded-md' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h3 className="section-title mb-3">
            My Roster
          </h3>

          {roster.length === 0 ? (
            <div className="text-muted text-center py-8">
              {onPlayerDrop ? 'Drop a player here to draft' : 'No players drafted yet'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {roster.map((player) => (
                <PlayerChip
                  key={player.id}
                  player={player}
                  status="drafted"
                />
              ))}
            </div>
          )}
        </div>

        {/* Team Count Summary */}
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="section-title mb-3">
            Team Distribution
          </h3>
          
          <div className="stack-sm">
            {IPL_TEAMS.map((team) => {
              const count = teamCount[team] || 0;
              const max = draftConfig.maxPerTeam;
              const percentage = max > 0 ? (count / max) * 100 : 0;
              const isAtLimit = count >= max;
              const colors = TEAM_COLORS[team];

              return (
                <div key={team} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{team}</span>
                    <span
                      className={`font-semibold ${
                        isAtLimit ? 'text-red-600' : 'text-slate-600'
                      }`}
                    >
                      {count} / {max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isAtLimit ? '#DC2626' : colors.border,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Count Summary */}
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="section-title mb-3">
            Role Requirements
          </h3>
          
          <div className="stack-md">
            {PLAYER_ROLES.map((role) => {
              const count = roleCount[role] || 0;
              const required = draftConfig.mandatoryRoles[role];
              const percentage = required > 0 ? (count / required) * 100 : 100;
              const isSatisfied = count >= required;

              return (
                <div key={role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {role === 'Bat' && 'Batsman'}
                      {role === 'Bowl' && 'Bowler'}
                      {role === 'AR' && 'All-Rounder'}
                      {role === 'WK' && 'Wicket-Keeper'}
                    </span>
                    <span
                      className={`font-semibold ${
                        isSatisfied ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {count} / {required}
                      {isSatisfied && ' ✓'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isSatisfied ? 'bg-green-500' : 'bg-orange-400'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Constraints Tracker */}
        <div className="px-4 py-4">
          <h3 className="section-title mb-3">
            Constraints
          </h3>
          
          <div className="stack-sm text-sm">
            {/* Remaining slots */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Remaining Slots</span>
              <span className="font-semibold text-slate-900">{remainingSlots}</span>
            </div>

            {/* Free slots (after mandatory roles) */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Free Slots</span>
              <span className="font-semibold text-slate-900">{draftConfig.freeSlots}</span>
            </div>

            {/* Early round rules */}
            {draftConfig.earlyRoundRule.rounds > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Early Round Rules (First {draftConfig.earlyRoundRule.rounds} rounds)</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Min Batsmen</span>
                    <span className="font-medium text-slate-900">
                      {draftConfig.earlyRoundRule.minBat}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Min Bowlers</span>
                    <span className="font-medium text-slate-900">
                      {draftConfig.earlyRoundRule.minBowl}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for teams at limit */}
            {IPL_TEAMS.some(team => (teamCount[team] || 0) >= draftConfig.maxPerTeam) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800 font-medium">
                    ⚠️ Team cap reached for:
                  </p>
                  <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                    {IPL_TEAMS.filter(team => (teamCount[team] || 0) >= draftConfig.maxPerTeam).map(team => (
                      <li key={team}>• {team}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
