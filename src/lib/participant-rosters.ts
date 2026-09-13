import type { DraftState, Player } from '@/types';

export interface ParticipantSummary {
  id: string;
  name: string;
  email?: string | null;
}

export interface ParticipantWithRoster extends ParticipantSummary {
  roster: Player[];
  teamCount: Record<string, number>;
  roleCount: Record<string, number>;
}

export function buildParticipantRosters(
  participants: ParticipantSummary[],
  draftState: DraftState | null,
  allPlayers: Player[]
): ParticipantWithRoster[] {
  const playersById = new Map(allPlayers.map((player) => [player.id, player]));

  return participants.map((participant) => {
    const roster = (draftState?.picks ?? [])
      .filter((pick) => pick.participantId === participant.id)
      .map((pick) => playersById.get(pick.playerId))
      .filter((player): player is Player => Boolean(player));

    const teamCount: Record<string, number> = {};
    const roleCount: Record<string, number> = {};
    for (const player of roster) {
      teamCount[player.team] = (teamCount[player.team] || 0) + 1;
      roleCount[player.role] = (roleCount[player.role] || 0) + 1;
    }

    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      roster,
      teamCount,
      roleCount,
    };
  });
}
