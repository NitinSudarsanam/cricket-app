import { NextRequest } from 'next/server';
import { runFullSync } from '@/services/ingestion/sync-service';

/**
 * POST /api/sync/cricket-data
 * Run sync: leagues/seasons, teams, fixtures, process finished matches.
 * Body (optional): { leagueId?, seasonId?, from?, to?, fullSync?: boolean }
 * Protected by CRON_SECRET or ADMIN_SECRET (header Authorization: Bearer <secret> or x-cron-secret).
 */
export async function POST(request: NextRequest) {
  const secret =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET ?? process.env.ADMIN_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { leagueId?: string; seasonId?: string; from?: string; to?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // optional body
  }

  try {
    const result = await runFullSync({
      leagueId: body.leagueId,
      seasonId: body.seasonId,
      from: body.from,
      to: body.to,
    });
    return Response.json({
      success: true,
      ...result,
    });
  } catch (e) {
    console.error('Sync error:', e);
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
