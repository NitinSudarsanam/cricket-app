'use client';

import { Player, IPLTeam, IPL_TEAMS } from '@/types';
import { PlayerChip } from '@/components/PlayerChip';
import { TEAM_COLORS } from '@/lib/team-colors';

export interface DraftBoardProps {
  availablePlayers: Player[];
  onPlayerSelect?: (player: Player) => void;
  disabled?: boolean;
  currentParticipantId?: string;
}

export function DraftBoard({
  availablePlayers,
  onPlayerSelect,
  disabled = false,
  currentParticipantId,
}: DraftBoardProps) {
  // Group players by team
  const playersByTeam = availablePlayers.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = [];
    }
    acc[player.team].push(player);
    return acc;
  }, {} as Record<IPLTeam, Player[]>);

  return (
    <div className="w-full h-full overflow-auto">
      {/* Desktop: 10-column grid */}
      <div className="hidden lg:grid lg:grid-cols-10 gap-2 p-4 min-h-full">
        {IPL_TEAMS.map((team) => {
          const teamPlayers = playersByTeam[team] || [];
          const colors = TEAM_COLORS[team];

          return (
            <div
              key={team}
              className="flex flex-col rounded-lg border-2 overflow-hidden h-fit min-h-[200px]"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.bg}33`, // 20% opacity
              }}
            >
              {/* Team header */}
              <div
                className="px-2 py-2 font-semibold text-xs text-center border-b-2 flex-shrink-0"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                {team}
              </div>

              {/* Players list */}
              <div className="flex flex-col gap-2 p-2 flex-1">
                {teamPlayers.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No players
                  </div>
                ) : (
                  teamPlayers.map((player) => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="available"
                      onClick={onPlayerSelect}
                      disabled={disabled}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet: 2-column grid */}
      <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-3 p-4 min-h-full">
        {IPL_TEAMS.map((team) => {
          const teamPlayers = playersByTeam[team] || [];
          const colors = TEAM_COLORS[team];

          return (
            <div
              key={team}
              className="flex flex-col rounded-lg border-2 overflow-hidden h-fit"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.bg}33`,
              }}
            >
              {/* Team header */}
              <div
                className="px-4 py-3 font-semibold text-sm text-center border-b-2 flex-shrink-0 touch-manipulation"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{team}</span>
                  <span className="text-xs text-gray-600 font-normal">
                    {teamPlayers.length}
                  </span>
                </div>
              </div>

              {/* Players list */}
              <div className="flex flex-col gap-2 p-3">
                {teamPlayers.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No players available
                  </div>
                ) : (
                  teamPlayers.map((player) => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="available"
                      onClick={onPlayerSelect}
                      disabled={disabled}
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
        {IPL_TEAMS.map((team) => {
          const teamPlayers = playersByTeam[team] || [];
          const colors = TEAM_COLORS[team];

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
                  <div className="text-sm text-gray-500 text-center py-4">
                    No players available
                  </div>
                ) : (
                  teamPlayers.map((player) => (
                    <PlayerChip
                      key={player.id}
                      player={player}
                      status="available"
                      onClick={onPlayerSelect}
                      disabled={disabled}
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
