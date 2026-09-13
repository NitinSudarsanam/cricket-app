'use client';

import { useEffect, useState, useCallback } from 'react';
import { Player } from '@/types';
import { PlayerChip } from '@/components/PlayerChip';
import { resolveTeamColors, teamsForBoard } from '@/lib/teams';

const CARD_SIZES_STORAGE_KEY = 'draft-player-card-sizes';

export interface DraftBoardProps {
  availablePlayers: Player[];
  onPlayerSelect?: (player: Player) => void;
  disabled?: boolean;
  currentParticipantId?: string;
  /** Set of player IDs that are eligible for the current pick. If null, no filtering is applied. */
  eligiblePlayerIds?: Set<string> | null;
  allowDrag?: boolean;
}

function loadCardSizes(): Record<string, { w: number; h: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CARD_SIZES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { w?: number; h?: number }>;
    const result: Record<string, { w: number; h: number }> = {};
    for (const [id, v] of Object.entries(parsed)) {
      if (typeof v?.w === 'number' && typeof v?.h === 'number') result[id] = { w: v.w, h: v.h };
    }
    return result;
  } catch {
    return {};
  }
}

export function DraftBoard({
  availablePlayers,
  onPlayerSelect,
  disabled = false,
  currentParticipantId,
  eligiblePlayerIds = null,
  allowDrag = false,
}: DraftBoardProps) {
  const [cardSizes, setCardSizes] = useState<Record<string, { w: number; h: number }>>({});

  useEffect(() => {
    setCardSizes(loadCardSizes());
  }, []);

  const handleResize = useCallback((playerId: string, width: number, height: number) => {
    setCardSizes((prev) => {
      const next = { ...prev, [playerId]: { w: width, h: height } };
      try {
        window.localStorage.setItem(CARD_SIZES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isChipDisabled = (player: Player) =>
    disabled || (eligiblePlayerIds != null && !eligiblePlayerIds.has(player.id));

  // Group players by team
  const playersByTeam = availablePlayers.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = [];
    }
    acc[player.team].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  const boardTeams = teamsForBoard(availablePlayers);

  return (
    <div className="w-full h-full overflow-auto">
      {/* Flexible wrapping grid: all team boxes same size (md and up) */}
      <div
        className="hidden md:grid gap-2 p-4 min-h-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 180px))',
          gridAutoRows: 'minmax(200px, 1fr)',
        }}
      >
        {boardTeams.map((team) => {
          const teamPlayers = playersByTeam[team] || [];
          const colors = resolveTeamColors(team);

          return (
            <div
              key={team}
              className="flex flex-col rounded-lg border-2 overflow-hidden min-h-[200px]"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.bg}33`,
              }}
            >
              <div
                className="px-2 py-2 font-semibold text-xs text-center border-b-2 flex-shrink-0"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <span>{team}</span>
                <span className="ml-1.5 text-slate-600 font-normal">{teamPlayers.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2 flex-1">
                {teamPlayers.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">No players</div>
                ) : (
                  teamPlayers.map((player) => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="available"
                      onClick={onPlayerSelect}
                      disabled={isChipDisabled(player)}
                      resizable
                      width={undefined}
                      height={undefined}
                      onResize={(w, h) => handleResize(player.id, w, h)}
                      draggable={allowDrag}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical collapsible columns with swipe support */}
      <div className="md:hidden flex flex-col gap-2 p-3">
        {boardTeams.map((team) => {
          const teamPlayers = playersByTeam[team] || [];
          const colors = resolveTeamColors(team);

          return (
            <details key={team} className="group" open={teamPlayers.length > 0 && teamPlayers.length <= 5}>
              <summary
                className="cursor-pointer list-none px-4 py-3 font-semibold text-sm rounded-lg border-2 flex items-center justify-between touch-manipulation active:scale-98 transition-transform"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <span className="flex items-center gap-2">
                  <svg 
                    className="w-4 h-4 transition-transform group-open:rotate-90" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {team}
                </span>
                <span className="text-xs font-normal px-2 py-1 bg-white bg-opacity-50 rounded">
                  {teamPlayers.length}
                </span>
              </summary>

              <div className="mt-2 flex flex-col gap-2 px-1">
                {teamPlayers.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No players available
                  </div>
                ) : (
                  teamPlayers.map((player) => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="available"
                      onClick={onPlayerSelect}
                      disabled={isChipDisabled(player)}
                      resizable
                      width={undefined}
                      height={undefined}
                      onResize={(w, h) => handleResize(player.id, w, h)}
                      draggable={allowDrag}
                    />
                  ))
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
