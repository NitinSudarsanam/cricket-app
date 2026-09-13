import { prisma } from '@/lib/db';
import { ParticipantManagement } from '@/components/admin';

export default async function ParticipantsPage() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true },
  });

  return <ParticipantManagement initialParticipants={participants} />;
}
