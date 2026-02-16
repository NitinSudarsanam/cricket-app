import { redirect } from 'next/navigation';
import { DraftInterface } from '@/components/draft';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getParticipantSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { prismaPlayerToPlayer } from '@/lib/model-mappers';
import type { DraftState, DraftStatus } from '@/types';

// Force dynamic rendering - don't try to build this page statically
export const dynamic = 'force-dynamic';

export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ participant?: string }>;
}) {
  const params = await searchParams;

  // Require participant identity: session or explicit ?participant= (dev override)
  const session = await getParticipantSession();
  const queryParticipantId = params.participant;

  if (!session && !queryParticipantId) {
    redirect('/draft/login');
  }

  // Fetch draft state and participants from DB (no self-fetch)
  const [draftStateRow, players, draftConfigRow, participantsList] = await Promise.all([
    prisma.draftState.findFirst({
      where: { status: { in: ['in_progress', 'paused'] } },
      orderBy: { startedAt: 'desc' },
      include: {
        draftOrders: { include: { participant: true }, orderBy: { position: 'asc' } },
        picks: { include: { player: true, participant: true }, orderBy: { pickNumber: 'asc' } },
        draftConfig: true,
      },
    }),
    prisma.player.findMany(),
    prisma.draftConfig.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.participant.findMany(),
  ]);

  if (!draftStateRow) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Draft Not Started</h1>
          <p className="text-slate-600">Please wait for the admin to start the draft.</p>
        </div>
      </div>
    );
  }

  const participantOrder = draftStateRow.draftOrders.map((o) => o.participantId);
  const draftState: DraftState = {
    id: draftStateRow.id,
    currentRound: draftStateRow.currentRound,
    currentPickIndex: draftStateRow.currentPickIndex,
    draftOrderType: draftStateRow.draftOrderType === 'linear' ? 'linear' : 'snake',
    status: draftStateRow.status as DraftStatus,
    startedAt: draftStateRow.startedAt ?? undefined,
    completedAt: draftStateRow.completedAt ?? undefined,
    draftConfigId: draftStateRow.draftConfigId,
    participantOrder,
    picks: draftStateRow.picks.map((p) => ({
      round: p.round,
      pickNumber: p.pickNumber,
      participantId: p.participantId,
      playerId: p.playerId,
      timestamp: p.timestamp,
    })),
  };

  const draftConfig = draftConfigRow
    ? {
        id: draftConfigRow.id,
        rosterSize: draftConfigRow.rosterSize,
        totalRounds: draftConfigRow.totalRounds,
        minPerTeam: draftConfigRow.minPerTeam,
        maxPerTeam: draftConfigRow.maxPerTeam,
        mandatoryRoles: {
          Bat: draftConfigRow.mandatoryBat,
          Bowl: draftConfigRow.mandatoryBowl,
          AR: draftConfigRow.mandatoryAR,
          WK: draftConfigRow.mandatoryWK,
        },
        freeSlots:
          draftConfigRow.rosterSize -
          (draftConfigRow.mandatoryBat +
            draftConfigRow.mandatoryBowl +
            draftConfigRow.mandatoryAR +
            draftConfigRow.mandatoryWK),
        earlyRoundRule: {
          rounds: draftConfigRow.earlyRounds,
          minBat: draftConfigRow.earlyMinBat,
          minBowl: draftConfigRow.earlyMinBowl,
        },
        isLocked: draftConfigRow.isLocked,
      }
    : null;

  if (!draftConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">No draft configuration found.</p>
        </div>
      </div>
    );
  }

  const playersMapped = players.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    role: p.role,
    isForeign: p.isForeign,
    metadata: p.metadata ?? undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  const participants = participantsList.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email ?? undefined,
  }));

  // Prefer session; allow ?participant= override (e.g. admin testing or shared link)
  const currentParticipantId =
    queryParticipantId && participants.some((p) => p.id === queryParticipantId)
      ? queryParticipantId
      : (session?.participantId ?? participants[0]?.id ?? 'unknown');
  const currentParticipant = participants.find((p) => p.id === currentParticipantId);
  const currentParticipantName =
    currentParticipant?.name ?? session?.participantName ?? 'Participant';

  return (
    <ErrorBoundary>
      <DraftInterface
        initialDraftState={draftState}
        initialPlayers={players.map(prismaPlayerToPlayer)}
        draftConfig={draftConfig}
        participants={participants}
        currentParticipantId={currentParticipantId}
        currentParticipantName={currentParticipantName}
        showTimer={false}
        timerSeconds={60}
      />
    </ErrorBoundary>
  );
}
