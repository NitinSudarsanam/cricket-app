import Link from 'next/link';
import { prisma } from '@/lib/db';

// Force dynamic rendering - don't try to build this page statically
export const dynamic = 'force-dynamic';

export default async function Home() {
  let playerCount: number | null = null;
  try {
    playerCount = await prisma.player.count();
  } catch {
    // Database may not be connected yet
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Fantasy Cricket Draft
            </h1>
            <p className="text-slate-600">
              IPL draft with live sync and rules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/admin"
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors text-center border border-emerald-700/20"
            >
              Admin
            </Link>
            <Link
              href="/draft"
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors text-center"
            >
              Join Draft
            </Link>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Quick links</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <Link href="/admin/players" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Player Management
              </Link>
              <Link href="/admin/config" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Draft Configuration
              </Link>
              <Link href="/admin/participants" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Participants
              </Link>
              <Link href="/admin/monitor" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Monitor Draft
              </Link>
              <Link href="/admin/results" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Results
              </Link>
              <Link href="/docs" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Documentation
              </Link>
              <Link href="/api/health" className="text-sm text-slate-600 hover:text-emerald-700 transition-colors">
                Health
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-500">
            {playerCount !== null
              ? `${playerCount} players in pool`
              : 'Unable to load player count. Check database connection.'}
          </div>
        </div>
      </div>
    </div>
  );
}
