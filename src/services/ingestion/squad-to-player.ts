/**
 * Map Sportmonks squad players to our Player model and upsert by externalId.
 * Uses team-code map (Sportmonks team → IPL) and position → role map.
 */

import { prisma } from '@/lib/db';
import type { PlayerRole } from '@/types';
import { resolveTeamCode } from '@/lib/sportmonks/team-code-map';
import type { SportmonksSquadPlayer, SportmonksTeamWithSquad } from '@/lib/sportmonks/types';

/** India country_id in Sportmonks (for IPL domestic). Set via env DOMESTIC_COUNTRY_ID if needed. */
const DEFAULT_DOMESTIC_COUNTRY_ID = Number(process.env.SPORTMONKS_DOMESTIC_COUNTRY_ID ?? 0) || 0;

const POSITION_TO_ROLE: Record<string, PlayerRole> = {
  batsman: 'Bat',
  bowler: 'Bowl',
  wicketkeeper: 'WK',
  'wicket keeper': 'WK',
  'wicket-keeper': 'WK',
  allrounder: 'AR',
  'all-rounder': 'AR',
  'all rounder': 'AR',
};

function positionNameToRole(positionName: string | null | undefined): PlayerRole {
  if (!positionName || typeof positionName !== 'string') return 'Bat';
  const key = positionName.toLowerCase().trim();
  return POSITION_TO_ROLE[key] ?? 'Bat';
}

function isForeign(countryId: number | null | undefined): boolean {
  if (countryId == null) return false;
  if (DEFAULT_DOMESTIC_COUNTRY_ID === 0) return false; // unknown domestic, treat all as domestic
  return countryId !== DEFAULT_DOMESTIC_COUNTRY_ID;
}

function playerName(api: SportmonksSquadPlayer): string {
  if (api.fullname && api.fullname.trim()) return api.fullname.trim();
  const first = (api.firstname ?? '').trim();
  const last = (api.lastname ?? '').trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return `Player ${api.id}`;
}

export interface SyncSquadResult {
  playersUpserted: number;
  playersSkipped: number;
  errors: string[];
}

/**
 * For each team in teamsWithSquad, map squad players to Player and upsert by externalId.
 * Uses the IPL code when known, otherwise the Sportmonks short code / name abbreviation.
 */
export async function syncSquadToPlayers(
  teamsWithSquad: SportmonksTeamWithSquad[]
): Promise<SyncSquadResult> {
  const errors: string[] = [];
  let playersUpserted = 0;
  let playersSkipped = 0;

  for (const team of teamsWithSquad) {
    const teamCode = resolveTeamCode(team.short_code ?? team.code, team.name);
    if (!teamCode) {
      playersSkipped += team.squad?.length ?? 0;
      continue;
    }

    const squad = team.squad ?? [];
    for (const apiPlayer of squad) {
      try {
        const name = playerName(apiPlayer);
        const role = positionNameToRole(apiPlayer.position?.name);
        const foreign = isForeign(apiPlayer.country_id);
        const externalId = String(apiPlayer.id);

        await prisma.player.upsert({
          where: { externalId },
          create: {
            externalId,
            name,
            team: teamCode,
            role,
            isForeign: foreign,
          },
          update: {
            name,
            team: teamCode,
            role,
            isForeign: foreign,
          },
        });
        playersUpserted++;
      } catch (e) {
        errors.push(`Player ${apiPlayer.id} (${team.name}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { playersUpserted, playersSkipped, errors };
}
