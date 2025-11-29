import { redirect } from 'next/navigation';
import { DraftInterface } from '@/components/draft';
import { getDraftState } from '@/lib/draft-api-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function DraftPage({
  searchParams,
}: {
  searchParams: Promise<{ participant?: string }>;
}) {
  const params = await searchParams;
  // Fetch initial data
  const draftStateResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/draft/state`, {
    cache: 'no-store',
  });

  if (!draftStateResult.ok) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Draft Not Started</h1>
          <p className="text-gray-600">Please wait for the admin to start the draft.</p>
        </div>
      </div>
    );
  }

  const { data: draftState } = await draftStateResult.json();

  if (!draftState || draftState.status === 'not_started') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Draft Not Started</h1>
          <p className="text-gray-600">Please wait for the admin to start the draft.</p>
        </div>
      </div>
    );
  }

  // Fetch players
  const playersResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/players`, {
    cache: 'no-store',
  });

  if (!playersResult.ok) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load players.</p>
        </div>
      </div>
    );
  }

  const { data: players } = await playersResult.json();

  // Fetch draft config
  const configResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/draft-config`, {
    cache: 'no-store',
  });

  if (!configResult.ok) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load draft configuration.</p>
        </div>
      </div>
    );
  }

  const { data: draftConfig } = await configResult.json();

  // Fetch participants
  const participantsResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/participants`, {
    cache: 'no-store',
  });

  if (!participantsResult.ok) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">Failed to load participants.</p>
        </div>
      </div>
    );
  }

  const { data: participants } = await participantsResult.json();

  // Use participant from URL query param, or default to first participant
  // In a real app, this would come from authentication/session
  const currentParticipantId = params.participant || draftState.participantOrder?.[0] || participants[0]?.id || 'unknown';
  const currentParticipant = participants.find((p: any) => p.id === currentParticipantId);
  const currentParticipantName = currentParticipant?.name || 'Participant';

  return (
    <ErrorBoundary>
      <DraftInterface
        initialDraftState={draftState}
        initialPlayers={players}
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
