/**
 * E2E Test Seed Script
 * 
 * Sets up test data for E2E tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedE2E() {
  console.log('🌱 Seeding E2E test data...');

  // Clean up existing test data
  await prisma.pick.deleteMany({});
  await prisma.draftState.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.draftConfig.deleteMany({});

  // Create draft configuration
  const draftConfig = await prisma.draftConfig.create({
    data: {
      rosterSize: 11,
      totalRounds: 5,
      minPerTeam: 1,
      maxPerTeam: 3,
      mandatoryBat: 3,
      mandatoryBowl: 3,
      mandatoryAR: 1,
      mandatoryWK: 1,
      earlyRounds: 3,
      earlyMinBat: 2,
      earlyMinBowl: 2,
      isLocked: false,
    },
  });

  // Create test players
  const teams = ['CSK', 'MI', 'RCB', 'KKR', 'RR'];
  const roles = ['Bat', 'Bowl', 'AR', 'WK'];
  const players = [];

  for (let i = 0; i < 50; i++) {
    const team = teams[i % teams.length];
    const role = roles[i % roles.length];
    players.push({
      name: `E2E Player ${i + 1}`,
      team,
      role,
      isForeign: i % 3 === 0,
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

  console.log('✅ E2E seed completed');
  console.log(`   - Draft Config: ${draftConfig.id}`);
  console.log(`   - Players: ${players.length}`);
  console.log(`   - Participants: ${participants.length}`);

  return {
    draftConfig,
    participants,
  };
}

seedE2E()
  .catch((e) => {
    console.error('❌ E2E seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
