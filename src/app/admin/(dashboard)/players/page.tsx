import { PlayerManagement } from '@/components/admin';
import { prisma } from '@/lib/db';
import { prismaPlayerToPlayer } from '@/lib/model-mappers';

export default async function PlayersPage() {
  const players = await prisma.player.findMany({ orderBy: { name: 'asc' } });
  return <PlayerManagement initialPlayers={players.map(prismaPlayerToPlayer)} />;
}
