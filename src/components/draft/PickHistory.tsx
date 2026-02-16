'use client';

import { useEffect, useRef, useState } from 'react';
import { PickRecord, Player } from '@/types';
import { TEAM_COLORS } from '@/config/team-colors';

export interface PickHistoryProps {
  picks: PickRecord[];
  participants: Array<{ id: string; name: string }>;
  players: Player[];
  autoScroll?: boolean;
}

export function PickHistory({
  picks,
  participants,
  players,
  autoScroll = true,
}: PickHistoryProps) {
  const [filterParticipantId, setFilterParticipantId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest pick
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [picks.length, autoScroll]);

  // Get participant name by ID
  const getParticipantName = (participantId: string) => {
    return participants.find(p => p.id === participantId)?.name || 'Unknown';
  };

  // Get player by ID
  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  // Filter picks by participant if filter is active
  const filteredPicks = filterParticipantId
    ? picks.filter(pick => pick.participantId === filterParticipantId)
    : picks;

  // Sort picks by pick number (most recent last)
  const sortedPicks = [...filteredPicks].sort((a, b) => a.pickNumber - b.pickNumber);

  return (
    <div className="bg-white flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Pick History
        </h3>

        {/* Filter dropdown */}
        <select
          value={filterParticipantId || ''}
          onChange={(e) => setFilterParticipantId(e.target.value || null)}
          className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Participants</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Picks list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
        {sortedPicks.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            No picks yet
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPicks.map((pick) => {
              const player = getPlayer(pick.playerId);
              const participantName = getParticipantName(pick.participantId);
              const colors = player ? TEAM_COLORS[player.team] : null;

              return (
                <div
                  key={pick.pickNumber}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {/* Pick number */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-xs text-gray-500">R{pick.round}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      #{pick.pickNumber}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-10 w-px bg-gray-300" />

                  {/* Pick details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {participantName}
                      </span>
                      <span className="text-xs text-gray-500">drafted</span>
                    </div>
                    
                    {player && (
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-sm font-medium truncate px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: colors?.bg,
                            color: '#111827',
                          }}
                        >
                          {player.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {player.team} • {player.role}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(pick.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {sortedPicks.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200 text-xs text-gray-500 text-center">
          {filterParticipantId
            ? `${sortedPicks.length} picks by ${getParticipantName(filterParticipantId)}`
            : `${sortedPicks.length} total picks`}
        </div>
      )}
    </div>
  );
}
