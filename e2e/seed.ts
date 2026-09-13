/**
 * E2E Test Seed Script
 *
 * Sets up test data for E2E tests including:
 * - Draft configuration
 * - Players across IPL teams and roles
 * - Participants
 * - An in-progress draft state with draft orders
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import { getPoolSslOption } from '../src/lib/db-ssl';

const connectionString = process.env.DATABASE_URL || '';
const isDisposableTarget =
  process.env.E2E_SEED_CONFIRM === '1' ||
  /localhost|127\.0\.0\.1|cricket_ci/.test(connectionString);

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to seed E2E data');
}

if (!isDisposableTarget) {
  throw new Error(
    'Refusing to wipe data: DATABASE_URL does not look like a local/CI test database. Set E2E_SEED_CONFIRM=1 to override.',
  );
}

const ssl = getPoolSslOption({
  connectionString,
  caCert: process.env.DATABASE_CA_CERT,
  sslFlag: process.env.DATABASE_SSL,
});
const pool = new Pool({
  connectionString,
  ...(ssl ? { ssl } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedE2E() {
  console.log('Seeding E2E test data...');

  // Clean up existing data in dependency order
  await prisma.pick.deleteMany({});
  await prisma.draftOrder.deleteMany({});
  await prisma.draftState.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.draftConfig.deleteMany({});

  // Create draft configuration
  const draftConfig = await prisma.draftConfig.create({
    data: {
      rosterSize: 11,
      totalRounds: 5,
      minPerTeam: 0,
      maxPerTeam: 3,
      mandatoryBat: 3,
      mandatoryBowl: 3,
      mandatoryAR: 1,
      mandatoryWK: 1,
      earlyRounds: 3,
      earlyMinBat: 2,
      earlyMinBowl: 2,
      isLocked: true,
    },
  });

  // Create test players across teams and roles
  const teams = ['CSK', 'MI', 'RCB', 'KKR', 'RR', 'GT', 'LSG', 'SRH', 'PBKS', 'DC'];
  const roles = ['Bat', 'Bowl', 'AR', 'WK'];
  const players = [];

  for (let i = 0; i < 50; i++) {
    const team = teams[i % teams.length];
    const role = roles[i % roles.length];
    players.push({
      name: `E2E Player ${i + 1}`,
      team,
      role,
      isForeign: i % 5 === 0,
    });
  }

  await prisma.player.createMany({ data: players });

  // Create test participants
  const participants = await Promise.all([
    prisma.participant.create({
      data: { name: 'E2E Participant 1', email: 'e2e1@test.com' },
    }),
    prisma.participant.create({
      data: { name: 'E2E Participant 2', email: 'e2e2@test.com' },
    }),
    prisma.participant.create({
      data: { name: 'E2E Participant 3', email: 'e2e3@test.com' },
    }),
  ]);

  // Create an in-progress draft state so draft-flow tests have data
  const draftState = await prisma.draftState.create({
    data: {
      status: 'in_progress',
      currentRound: 1,
      currentPickIndex: 0,
      draftOrderType: 'snake',
      startedAt: new Date(),
      draftConfigId: draftConfig.id,
    },
  });

  // Create draft orders for each participant
  await Promise.all(
    participants.map((p, index) =>
      prisma.draftOrder.create({
        data: {
          draftStateId: draftState.id,
          participantId: p.id,
          position: index,
        },
      }),
    ),
  );

  console.log('E2E seed completed');
  console.log(`   - Draft Config: ${draftConfig.id}`);
  console.log(`   - Players: ${players.length}`);
  console.log(`   - Participants: ${participants.length}`);
  console.log(`   - Draft State: ${draftState.id} (in_progress)`);
  console.log(`   - Draft Orders: ${participants.length}`);

  return { draftConfig, participants, draftState };
}

seedE2E()
  .catch((e) => {
    console.error('E2E seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
