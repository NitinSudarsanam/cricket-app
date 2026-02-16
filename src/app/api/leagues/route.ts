import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/leagues
 * List all leagues (for admin sync league/season selector).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const [items, total] = await Promise.all([
    prisma.league.findMany({
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.league.count(),
  ]);

  return Response.json({
    success: true,
    data: { items, total },
  });
}
