import type { DraftConfig, Player } from '@/types';

export interface ParticipantRoster {
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

export interface DraftResultsSnapshot {
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

function downloadFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildDraftResultsJson(results: DraftResultsSnapshot): string {
  return JSON.stringify(
    {
      draftState: results.draftState,
      draftConfig: results.draftConfig,
      participantRosters: results.participantRosters.map((pr) => ({
        ...pr,
        roster: pr.roster.map((p) => ({
          id: p.id,
          name: p.name,
          team: p.team,
          role: p.role,
          isForeign: p.isForeign,
        })),
      })),
    },
    null,
    2
  );
}

export function buildDraftResultsCsv(results: DraftResultsSnapshot): string {
  const headers = ['Participant', 'Position', 'Player Name', 'Team', 'Role', 'Is Foreign'];
  const rows = results.participantRosters.flatMap((pr) =>
    pr.roster.map((player) => [
      pr.participantName,
      (pr.position + 1).toString(),
      player.name,
      player.team,
      player.role,
      player.isForeign ? 'Yes' : 'No',
    ])
  );

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
}

export function downloadDraftResults(results: DraftResultsSnapshot, format: 'json' | 'csv') {
  const id = results.draftState.id;
  if (format === 'json') {
    downloadFile(`draft-results-${id}.json`, buildDraftResultsJson(results), 'application/json');
    return;
  }
  downloadFile(`draft-results-${id}.csv`, buildDraftResultsCsv(results), 'text/csv');
}
