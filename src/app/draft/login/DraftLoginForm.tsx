'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Participant = { id: string; name: string; email?: string | null };

export function DraftLoginForm({ participants }: { participants: Participant[] }) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState(participants[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join');
        return;
      }
      router.push('/draft');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="participant" className="block text-sm font-medium text-slate-700 mb-2">
          I am
        </label>
        <select
          id="participant"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          required
        >
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.email ? ` (${p.email})` : ''}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join Draft'}
      </button>
    </form>
  );
}
