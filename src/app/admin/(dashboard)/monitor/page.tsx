import { DraftMonitor } from '@/components/admin';
import { prisma } from '@/lib/db';
import { getLatestDraftState } from '@/lib/draft-state-manager';
import { prismaPlayerToPlayer } from '@/lib/model-mappers';

export default async function MonitorPage() {
  const [initialDraftState, players, participants] = await Promise.all([
    getLatestDraftState(),
    prisma.player.findMany({ orderBy: { name: 'asc' } }),
    prisma.participant.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <DraftMonitor
      initialDraftState={initialDraftState}
      initialPlayers={players.map(prismaPlayerToPlayer)}
      initialParticipants={participants}
    />
  );
}
