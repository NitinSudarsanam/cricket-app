/**
 * Health Check Endpoint
 * 
 * This endpoint provides health status for monitoring and uptime checks.
 * It verifies database connectivity and returns system status.
 * 
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
  };
  environment: string;
  version: string;
}

export async function GET() {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: false,
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbEndTime = Date.now();
    
    health.database.connected = true;
    health.database.responseTime = dbEndTime - dbStartTime;
  } catch (error) {
    console.error('Health check - Database error:', error);
    health.status = 'unhealthy';
    health.database.connected = false;
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
