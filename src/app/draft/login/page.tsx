import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { DraftLoginForm } from './DraftLoginForm';

export default async function DraftLoginPage() {
  const participants = await prisma.participant.findMany({
    orderBy: { name: 'asc' },
  });

  if (participants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Participants Yet</h1>
          <p className="text-slate-600 mb-4">
            The admin needs to add participants before you can join the draft.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-md border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Join the Draft</h1>
        <p className="text-slate-600 mb-6">
          Select your name to join as a participant. You will stay logged in for this draft.
        </p>
        <DraftLoginForm participants={participants} />
        <p className="mt-4 text-center text-xs text-slate-500">
          Your selection is saved for this session. Use the same device or browser to make your picks.
        </p>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
