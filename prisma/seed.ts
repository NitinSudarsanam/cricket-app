import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use DIRECT_URL for seeding to avoid connection pooling issues
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set in environment variables');
}

console.log('Using connection:', connectionString.replace(/:[^:@]+@/, ':****@')); // Log without password

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // First, check if we can connect
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }

  // Create default draft configuration
  console.log('Creating draft configuration...');
  const draftConfig = await prisma.draftConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      rosterSize: 8,
      totalRounds: 8,
      minPerTeam: 0,
      maxPerTeam: 1,
      mandatoryBat: 3,
      mandatoryBowl: 3,
      mandatoryAR: 0,
      mandatoryWK: 0,
      earlyRounds: 4,
      earlyMinBat: 2,
      earlyMinBowl: 2,
    },
  });

  console.log('✅ Created default draft config:', draftConfig.id);

  // Sample players (you can expand this list)
  const samplePlayers = [
    // CSK
    { name: 'MS Dhoni', team: 'CSK', role: 'WK', isForeign: false },
    { name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', isForeign: false },
    { name: 'Ruturaj Gaikwad', team: 'CSK', role: 'Bat', isForeign: false },
    { name: 'Deepak Chahar', team: 'CSK', role: 'Bowl', isForeign: false },
    
    // MI
    { name: 'Rohit Sharma', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Jasprit Bumrah', team: 'MI', role: 'Bowl', isForeign: false },
    { name: 'Suryakumar Yadav', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Hardik Pandya', team: 'MI', role: 'AR', isForeign: false },
    
    // RCB
    { name: 'Virat Kohli', team: 'RCB', role: 'Bat', isForeign: false },
    { name: 'Glenn Maxwell', team: 'RCB', role: 'AR', isForeign: true },
    { name: 'Mohammed Siraj', team: 'RCB', role: 'Bowl', isForeign: false },
    { name: 'Faf du Plessis', team: 'RCB', role: 'Bat', isForeign: true },
    
    // KKR
    { name: 'Andre Russell', team: 'KKR', role: 'AR', isForeign: true },
    { name: 'Sunil Narine', team: 'KKR', role: 'AR', isForeign: true },
    { name: 'Shreyas Iyer', team: 'KKR', role: 'Bat', isForeign: false },
    { name: 'Varun Chakravarthy', team: 'KKR', role: 'Bowl', isForeign: false },
  ];

  console.log(`Creating ${samplePlayers.length} players...`);
  let createdCount = 0;
  let updatedCount = 0;

  for (const player of samplePlayers) {
    const playerId = `${player.team}-${player.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Check if player exists
    const existing = await prisma.player.findUnique({ where: { id: playerId } });
    
    const result = await prisma.player.upsert({
      where: { id: playerId },
      update: {},
      create: {
        id: playerId,
        ...player,
      },
    });
    
    if (existing) {
      updatedCount++;
      console.log(`  ↻ Updated: ${player.name} (${player.team})`);
    } else {
      createdCount++;
      console.log(`  ✅ Created: ${player.name} (${player.team})`);
    }
  }

  console.log(`\n✅ Seeded ${samplePlayers.length} sample players`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  
  // Verify the data
  const totalPlayers = await prisma.player.count();
  const totalConfigs = await prisma.draftConfig.count();
  
  console.log(`\n📊 Database Summary:`);
  console.log(`   - Total Players: ${totalPlayers}`);
  console.log(`   - Total Configs: ${totalConfigs}`);
  
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
