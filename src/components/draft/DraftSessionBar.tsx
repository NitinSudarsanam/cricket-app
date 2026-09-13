'use client';

import { Button } from '@/components/ui';

interface ParticipantOption {
  id: string;
  name: string;
}

interface DraftSessionBarProps {
  participants: ParticipantOption[];
  currentParticipantId: string;
  currentParticipantIdOnClock: string | null;
}

export function DraftSessionBar({
  participants,
  currentParticipantId,
  currentParticipantIdOnClock,
}: DraftSessionBarProps) {
  return (
    <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-700">View as:</span>
        {participants.map((p) => {
          const isCurrentParticipant = p.id === currentParticipantId;
          const isOnClock = currentParticipantIdOnClock === p.id;
          return (
            <Button
              key={p.id}
              type="button"
              onClick={async () => {
                const res = await fetch('/api/auth/participant', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ participantId: p.id }),
                });
                if (res.ok) window.location.href = '/draft';
              }}
              variant={isCurrentParticipant ? 'success' : 'secondary'}
              size="sm"
              className={isOnClock ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}
              title={isOnClock ? `${p.name} - On the clock!` : p.name}
            >
              {p.name}
            </Button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/';
        }}
        className="text-xs text-slate-600 hover:text-slate-800 underline"
      >
        Log out
      </button>
    </div>
  );
}
