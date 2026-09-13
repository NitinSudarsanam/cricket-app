import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { IPL_TEAMS } from '@/types';

// Load environment variables
dotenv.config();

// Prefer DATABASE_URL (pooler) so seed uses the same connection that works for the app.
// DIRECT_URL often times out (P1008) when starting transactions to Supabase.
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set in environment variables');
}

console.log('Using connection:', connectionString.replace(/:[^:@]+@/, ':****@')); // Log without password

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  dotenv.config();
  console.log('Starting seed...');

  // First, check if we can connect
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  // Wipe all existing data (child tables first to respect FK constraints)
  console.log('Clearing all existing data...');
  await prisma.pick.deleteMany({});
  await prisma.draftOrder.deleteMany({});
  await prisma.draftState.deleteMany({});
  await prisma.playerScore.deleteMany({});
  await prisma.playerMatchStat.deleteMany({});
  await prisma.fantasyScoringRule.deleteMany({});
  await prisma.leaderboardSnapshot.deleteMany({});
  await prisma.teamScore.deleteMany({});
  await prisma.matchResult.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.scoringRule.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.league.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.draftConfig.deleteMany({});
  console.log('All existing data cleared.');

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
      pickTimeoutSeconds: 60,
    },
  });

  console.log('Created default draft config:', draftConfig.id);

  // IPL-style rosters for all 10 teams (Bat, Bowl, AR, WK)
  const samplePlayers = [
    // CSK
    { name: 'MS Dhoni', team: 'CSK', role: 'WK', isForeign: false },
    { name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', isForeign: false },
    { name: 'Ruturaj Gaikwad', team: 'CSK', role: 'Bat', isForeign: false },
    { name: 'Deepak Chahar', team: 'CSK', role: 'Bowl', isForeign: false },
    { name: 'Shivam Dube', team: 'CSK', role: 'AR', isForeign: false },
    { name: 'Moeen Ali', team: 'CSK', role: 'AR', isForeign: true },
    { name: 'Devon Conway', team: 'CSK', role: 'Bat', isForeign: true },
    { name: 'Tushar Deshpande', team: 'CSK', role: 'Bowl', isForeign: false },
    { name: 'Ajinkya Rahane', team: 'CSK', role: 'Bat', isForeign: false },
    { name: 'Mitchell Santner', team: 'CSK', role: 'AR', isForeign: true },
    { name: 'Simarjeet Singh', team: 'CSK', role: 'Bowl', isForeign: false },
    { name: 'Rachin Ravindra', team: 'CSK', role: 'Bat', isForeign: true },
    // MI
    { name: 'Rohit Sharma', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Jasprit Bumrah', team: 'MI', role: 'Bowl', isForeign: false },
    { name: 'Suryakumar Yadav', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Hardik Pandya', team: 'MI', role: 'AR', isForeign: false },
    { name: 'Ishan Kishan', team: 'MI', role: 'WK', isForeign: false },
    { name: 'Tilak Varma', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Tim David', team: 'MI', role: 'Bat', isForeign: true },
    { name: 'Piyush Chawla', team: 'MI', role: 'Bowl', isForeign: false },
    { name: 'Gerald Coetzee', team: 'MI', role: 'Bowl', isForeign: true },
    { name: 'Dewald Brevis', team: 'MI', role: 'Bat', isForeign: true },
    { name: 'Nehal Wadhera', team: 'MI', role: 'Bat', isForeign: false },
    { name: 'Akash Madhwal', team: 'MI', role: 'Bowl', isForeign: false },
    // RCB
    { name: 'Virat Kohli', team: 'RCB', role: 'Bat', isForeign: false },
    { name: 'Glenn Maxwell', team: 'RCB', role: 'AR', isForeign: true },
    { name: 'Mohammed Siraj', team: 'RCB', role: 'Bowl', isForeign: false },
    { name: 'Faf du Plessis', team: 'RCB', role: 'Bat', isForeign: true },
    { name: 'Rajat Patidar', team: 'RCB', role: 'Bat', isForeign: false },
    { name: 'Cameron Green', team: 'RCB', role: 'AR', isForeign: true },
    { name: 'Dinesh Karthik', team: 'RCB', role: 'WK', isForeign: false },
    { name: 'Yash Dayal', team: 'RCB', role: 'Bowl', isForeign: false },
    { name: 'Alzarri Joseph', team: 'RCB', role: 'Bowl', isForeign: true },
    { name: 'Mahipal Lomror', team: 'RCB', role: 'Bat', isForeign: false },
    { name: 'Lockie Ferguson', team: 'RCB', role: 'Bowl', isForeign: true },
    { name: 'Anuj Rawat', team: 'RCB', role: 'WK', isForeign: false },
    // KKR
    { name: 'Andre Russell', team: 'KKR', role: 'AR', isForeign: true },
    { name: 'Sunil Narine', team: 'KKR', role: 'AR', isForeign: true },
    { name: 'Shreyas Iyer', team: 'KKR', role: 'Bat', isForeign: false },
    { name: 'Varun Chakravarthy', team: 'KKR', role: 'Bowl', isForeign: false },
    { name: 'Venkatesh Iyer', team: 'KKR', role: 'AR', isForeign: false },
    { name: 'Rinku Singh', team: 'KKR', role: 'Bat', isForeign: false },
    { name: 'Mitchell Starc', team: 'KKR', role: 'Bowl', isForeign: true },
    { name: 'Phil Salt', team: 'KKR', role: 'WK', isForeign: true },
    { name: 'Harshit Rana', team: 'KKR', role: 'Bowl', isForeign: false },
    { name: 'Nitish Rana', team: 'KKR', role: 'Bat', isForeign: false },
    { name: 'Vaibhav Arora', team: 'KKR', role: 'Bowl', isForeign: false },
    { name: 'Angkrish Raghuvanshi', team: 'KKR', role: 'Bat', isForeign: false },
    // GT
    { name: 'Shubman Gill', team: 'GT', role: 'Bat', isForeign: false },
    { name: 'Rashid Khan', team: 'GT', role: 'Bowl', isForeign: true },
    { name: 'Mohammed Shami', team: 'GT', role: 'Bowl', isForeign: false },
    { name: 'Hardik Pandya', team: 'GT', role: 'AR', isForeign: false },
    { name: 'David Miller', team: 'GT', role: 'Bat', isForeign: true },
    { name: 'Rahul Tewatia', team: 'GT', role: 'AR', isForeign: false },
    { name: 'Vijay Shankar', team: 'GT', role: 'AR', isForeign: false },
    { name: 'Wriddhiman Saha', team: 'GT', role: 'WK', isForeign: false },
    { name: 'Mohit Sharma', team: 'GT', role: 'Bowl', isForeign: false },
    { name: 'Sai Sudharsan', team: 'GT', role: 'Bat', isForeign: false },
    { name: 'Noor Ahmad', team: 'GT', role: 'Bowl', isForeign: true },
    { name: 'Matthew Wade', team: 'GT', role: 'WK', isForeign: true },
    // RR
    { name: 'Sanju Samson', team: 'RR', role: 'WK', isForeign: false },
    { name: 'Jos Buttler', team: 'RR', role: 'Bat', isForeign: true },
    { name: 'Yuzvendra Chahal', team: 'RR', role: 'Bowl', isForeign: false },
    { name: 'Trent Boult', team: 'RR', role: 'Bowl', isForeign: true },
    { name: 'Riyan Parag', team: 'RR', role: 'Bat', isForeign: false },
    { name: 'Ravichandran Ashwin', team: 'RR', role: 'AR', isForeign: false },
    { name: 'Yashasvi Jaiswal', team: 'RR', role: 'Bat', isForeign: false },
    { name: 'Shimron Hetmyer', team: 'RR', role: 'Bat', isForeign: true },
    { name: 'Prasidh Krishna', team: 'RR', role: 'Bowl', isForeign: false },
    { name: 'Avesh Khan', team: 'RR', role: 'Bowl', isForeign: false },
    { name: 'Rovman Powell', team: 'RR', role: 'Bat', isForeign: true },
    { name: 'Dhruv Jurel', team: 'RR', role: 'WK', isForeign: false },
    // LSG
    { name: 'KL Rahul', team: 'LSG', role: 'Bat', isForeign: false },
    { name: 'Marcus Stoinis', team: 'LSG', role: 'AR', isForeign: true },
    { name: 'Ravi Bishnoi', team: 'LSG', role: 'Bowl', isForeign: false },
    { name: 'Nicholas Pooran', team: 'LSG', role: 'WK', isForeign: true },
    { name: 'Quinton de Kock', team: 'LSG', role: 'WK', isForeign: true },
    { name: 'Mark Wood', team: 'LSG', role: 'Bowl', isForeign: true },
    { name: 'Ayush Badoni', team: 'LSG', role: 'Bat', isForeign: false },
    { name: 'Krunal Pandya', team: 'LSG', role: 'AR', isForeign: false },
    { name: 'Mohsin Khan', team: 'LSG', role: 'Bowl', isForeign: false },
    { name: 'Kyle Mayers', team: 'LSG', role: 'AR', isForeign: true },
    { name: 'Deepak Hooda', team: 'LSG', role: 'Bat', isForeign: false },
    { name: 'Naveen-ul-Haq', team: 'LSG', role: 'Bowl', isForeign: true },
    // SRH
    { name: 'Pat Cummins', team: 'SRH', role: 'Bowl', isForeign: true },
    { name: 'Heinrich Klaasen', team: 'SRH', role: 'WK', isForeign: true },
    { name: 'Travis Head', team: 'SRH', role: 'Bat', isForeign: true },
    { name: 'Abhishek Sharma', team: 'SRH', role: 'Bat', isForeign: false },
    { name: 'Bhuvneshwar Kumar', team: 'SRH', role: 'Bowl', isForeign: false },
    { name: 'T Natarajan', team: 'SRH', role: 'Bowl', isForeign: false },
    { name: 'Washington Sundar', team: 'SRH', role: 'AR', isForeign: false },
    { name: 'Marco Jansen', team: 'SRH', role: 'AR', isForeign: true },
    { name: 'Nitish Reddy', team: 'SRH', role: 'AR', isForeign: false },
    { name: 'Abdul Samad', team: 'SRH', role: 'Bat', isForeign: false },
    { name: 'Umran Malik', team: 'SRH', role: 'Bowl', isForeign: false },
    { name: 'Glenn Phillips', team: 'SRH', role: 'Bat', isForeign: true },
    // PBKS
    { name: 'Shikhar Dhawan', team: 'PBKS', role: 'Bat', isForeign: false },
    { name: 'Kagiso Rabada', team: 'PBKS', role: 'Bowl', isForeign: true },
    { name: 'Arshdeep Singh', team: 'PBKS', role: 'Bowl', isForeign: false },
    { name: 'Sam Curran', team: 'PBKS', role: 'AR', isForeign: true },
    { name: 'Liam Livingstone', team: 'PBKS', role: 'AR', isForeign: true },
    { name: 'Jitesh Sharma', team: 'PBKS', role: 'WK', isForeign: false },
    { name: 'Prabhsimran Singh', team: 'PBKS', role: 'Bat', isForeign: false },
    { name: 'Harpreet Brar', team: 'PBKS', role: 'AR', isForeign: false },
    { name: 'Rahul Chahar', team: 'PBKS', role: 'Bowl', isForeign: false },
    { name: 'Jonny Bairstow', team: 'PBKS', role: 'WK', isForeign: true },
    { name: 'Rilee Rossouw', team: 'PBKS', role: 'Bat', isForeign: true },
    { name: 'Harshal Patel', team: 'PBKS', role: 'Bowl', isForeign: false },
    // DC
    { name: 'Rishabh Pant', team: 'DC', role: 'WK', isForeign: false },
    { name: 'Mitchell Marsh', team: 'DC', role: 'AR', isForeign: true },
    { name: 'Kuldeep Yadav', team: 'DC', role: 'Bowl', isForeign: false },
    { name: 'David Warner', team: 'DC', role: 'Bat', isForeign: true },
    { name: 'Anrich Nortje', team: 'DC', role: 'Bowl', isForeign: true },
    { name: 'Axar Patel', team: 'DC', role: 'AR', isForeign: false },
    { name: 'Prithvi Shaw', team: 'DC', role: 'Bat', isForeign: false },
    { name: 'Ishant Sharma', team: 'DC', role: 'Bowl', isForeign: false },
    { name: 'Jake Fraser-McGurk', team: 'DC', role: 'Bat', isForeign: true },
    { name: 'Abishek Porel', team: 'DC', role: 'WK', isForeign: false },
    { name: 'Khaleel Ahmed', team: 'DC', role: 'Bowl', isForeign: false },
    { name: 'Tristan Stubbs', team: 'DC', role: 'Bat', isForeign: true },
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
      console.log(`  Updated: ${player.name} (${player.team})`);
    } else {
      createdCount++;
      console.log(`  Created: ${player.name} (${player.team})`);
    }
  }

  console.log(`\nSeeded ${samplePlayers.length} sample players`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);

  // Default scoring rules (global: leagueId and seasonId null) — win=3, tie/no_result=1, loss=0
  const defaultScoringRules = [
    { outcome: 'win', points: 3, name: 'Win' },
    { outcome: 'tie', points: 1, name: 'Tie' },
    { outcome: 'no_result', points: 1, name: 'No result' },
    { outcome: 'loss', points: 0, name: 'Loss' },
  ];
  const existingRules = await prisma.scoringRule.findMany({
    where: { leagueId: null, seasonId: null },
  });
  const existingOutcomes = new Set(existingRules.map((r) => r.outcome));
  for (const r of defaultScoringRules) {
    if (existingOutcomes.has(r.outcome)) continue;
    await prisma.scoringRule.create({
      data: {
        leagueId: null,
        seasonId: null,
        outcome: r.outcome,
        points: r.points,
        name: r.name,
      },
    });
    console.log(`  Scoring rule: ${r.outcome} = ${r.points}`);
  }
  console.log('Default scoring rules ensured');

  // -------------------------------------------------------------------------
  // Fantasy season sample data (league, season, teams, matches, draft)
  // -------------------------------------------------------------------------
  console.log('\nCreating fantasy season sample data...');

  const TEAM_NAMES: Record<string, string> = {
    CSK: 'Chennai Super Kings',
    MI: 'Mumbai Indians',
    GT: 'Gujarat Titans',
    RR: 'Rajasthan Royals',
    RCB: 'Royal Challengers Bangalore',
    KKR: 'Kolkata Knight Riders',
    LSG: 'Lucknow Super Giants',
    SRH: 'Sunrisers Hyderabad',
    PBKS: 'Punjab Kings',
    DC: 'Delhi Capitals',
  };

  const league = await prisma.league.upsert({
    where: { externalId: 'seed-ipl' },
    update: {},
    create: {
      externalId: 'seed-ipl',
      name: 'Indian Premier League',
      slug: 'ipl',
    },
  });
  console.log('  League:', league.name);

  const season = await prisma.season.upsert({
    where: { externalId: 'seed-2024' },
    update: {},
    create: {
      externalId: 'seed-2024',
      leagueId: league.id,
      name: '2024',
      startDate: new Date('2024-03-22'),
      endDate: new Date('2024-05-26'),
    },
  });
  console.log('  Season:', season.name);

  const teamIdsByCode: Record<string, string> = {};
  for (const code of IPL_TEAMS) {
    const team = await prisma.team.upsert({
      where: { externalId: `seed-team-${code.toLowerCase()}` },
      update: {},
      create: {
        externalId: `seed-team-${code.toLowerCase()}`,
        leagueId: league.id,
        name: TEAM_NAMES[code] ?? code,
        shortCode: code,
      },
    });
    teamIdsByCode[code] = team.id;
  }
  console.log('  Teams:', IPL_TEAMS.length);

  const matchPairs: [string, string, string][] = [
    ['CSK', 'MI', 'CSK'],
    ['GT', 'RR', 'GT'],
    ['RCB', 'KKR', 'KKR'],
    ['LSG', 'SRH', 'SRH'],
    ['PBKS', 'DC', 'DC'],
    ['MI', 'GT', 'MI'],
    ['RR', 'RCB', 'RR'],
    ['KKR', 'LSG', 'LSG'],
    ['SRH', 'PBKS', 'SRH'],
    ['DC', 'CSK', 'CSK'],
    ['GT', 'MI', 'GT'],
    ['RR', 'KKR', 'RR'],
  ];
  const baseDate = new Date('2024-03-22T19:30:00Z');
  const matchResultIds: string[] = [];

  for (let i = 0; i < matchPairs.length; i++) {
    const [localCode, visitorCode, winnerCode] = matchPairs[i];
    const localId = teamIdsByCode[localCode];
    const visitorId = teamIdsByCode[visitorCode];
    const winnerId = teamIdsByCode[winnerCode];
    const startAt = new Date(baseDate.getTime() + i * 2 * 24 * 60 * 60 * 1000);

    const match = await prisma.match.upsert({
      where: { externalId: `seed-match-${i + 1}` },
      update: {},
      create: {
        externalId: `seed-match-${i + 1}`,
        seasonId: season.id,
        leagueId: league.id,
        localTeamId: localId,
        visitorTeamId: visitorId,
        winnerTeamId: winnerId,
        startAt,
        status: 'FT',
        resultSummary: '180-5 - 175-8',
      },
    });

    const outcome = winnerCode === localCode ? 'win_local' : 'win_visitor';
    const existingMr = await prisma.matchResult.findUnique({
      where: { matchId: match.id },
    });
    if (!existingMr) {
      const mr = await prisma.matchResult.create({
        data: {
          matchId: match.id,
          localTeamId: localId,
          visitorTeamId: visitorId,
          winnerTeamId: winnerId,
          outcome,
        },
      });
      matchResultIds.push(mr.id);
    }
  }
  console.log('  Matches:', matchPairs.length);

  const { processMatchResult } = await import('@/services/ranking/ranking-engine');
  const { updatePlayerScoresFromTeamScores } = await import('@/services/ranking/player-ranking-service');

  for (const mrId of matchResultIds) {
    await processMatchResult(mrId);
  }
  console.log('  TeamScore updated from MatchResults');

  await updatePlayerScoresFromTeamScores(season.id);
  console.log('  PlayerScore updated from TeamScore');

  const { DEFAULT_FANTASY_RULES } = await import('@/services/scoring/fantasy-scoring-engine');
  const { updatePlayerScoresFromMatchStats } = await import('@/services/ingestion/player-match-stats');
  for (const [statKey, points] of Object.entries(DEFAULT_FANTASY_RULES)) {
    await prisma.fantasyScoringRule.create({
      data: {
        statKey,
        points,
        name: statKey.replace(/_/g, ' '),
      },
    });
  }

  const seededMatches = await prisma.match.findMany({
    where: { seasonId: season.id },
    orderBy: { startAt: 'asc' },
  });
  const playersByTeam = new Map<string, { id: string; role: string }[]>();
  const allDbPlayers = await prisma.player.findMany({ select: { id: true, team: true, role: true } });
  for (const player of allDbPlayers) {
    const list = playersByTeam.get(player.team) ?? [];
    list.push({ id: player.id, role: player.role });
    playersByTeam.set(player.team, list);
  }

  for (let i = 0; i < seededMatches.length; i++) {
    const [localCode, visitorCode] = matchPairs[i];
    const localPlayers = playersByTeam.get(localCode) ?? [];
    const visitorPlayers = playersByTeam.get(visitorCode) ?? [];
    const samples = [
      { player: localPlayers.find((p) => p.role === 'Bat'), runs: 62 + i, fours: 6, sixes: 2, didBat: true, dismissed: true },
      { player: localPlayers.find((p) => p.role === 'Bowl'), wickets: 3, maidens: 1, didBowl: true },
      { player: visitorPlayers.find((p) => p.role === 'AR'), runs: 28, wickets: 1, fours: 3, didBat: true, didBowl: true, dismissed: true },
      { player: visitorPlayers.find((p) => p.role === 'WK'), catches: 2, stumpings: i % 2, didBat: true, runs: 12, dismissed: true },
    ];
    for (const sample of samples) {
      if (!sample.player) continue;
      await prisma.playerMatchStat.upsert({
        where: { playerId_matchId: { playerId: sample.player.id, matchId: seededMatches[i].id } },
        create: {
          playerId: sample.player.id,
          matchId: seededMatches[i].id,
          seasonId: season.id,
          runs: sample.runs ?? 0,
          fours: sample.fours ?? 0,
          sixes: sample.sixes ?? 0,
          wickets: sample.wickets ?? 0,
          maidens: sample.maidens ?? 0,
          catches: sample.catches ?? 0,
          stumpings: sample.stumpings ?? 0,
          didBat: Boolean(sample.didBat),
          didBowl: Boolean(sample.didBowl),
          dismissed: Boolean(sample.dismissed),
        },
        update: {},
      });
    }
  }
  await updatePlayerScoresFromMatchStats(season.id);
  console.log('  Fantasy PlayerScore updated from match stats');

  const participantData = [
    { id: 'seed-p1', name: 'Alice', email: 'alice@example.com' },
    { id: 'seed-p2', name: 'Bob', email: 'bob@example.com' },
    { id: 'seed-p3', name: 'Charlie', email: 'charlie@example.com' },
    { id: 'seed-p4', name: 'Diana', email: 'diana@example.com' },
  ];
  const participantIds: string[] = [];
  for (const p of participantData) {
    const participant = await prisma.participant.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        email: p.email,
      },
    });
    participantIds.push(participant.id);
  }
  console.log('  Participants:', participantIds.length);

  await prisma.pick.deleteMany({ where: { draftStateId: 'seed-draft' } });
  await prisma.draftOrder.deleteMany({ where: { draftStateId: 'seed-draft' } });

  const draftStartedAt = new Date('2024-03-01T10:00:00Z');
  const draftCompletedAt = new Date('2024-03-01T11:30:00Z');

  await prisma.draftState.upsert({
    where: { id: 'seed-draft' },
    update: {},
    create: {
      id: 'seed-draft',
      draftConfigId: 'default',
      status: 'completed',
      draftOrderType: 'snake',
      currentRound: 9,
      currentPickIndex: 0,
      startedAt: draftStartedAt,
      completedAt: draftCompletedAt,
    },
  });

  for (let pos = 0; pos < 4; pos++) {
    await prisma.draftOrder.create({
      data: {
        draftStateId: 'seed-draft',
        participantId: participantIds[pos],
        position: pos,
      },
    });
  }

  const allPlayerIds = samplePlayers.map(
    (p) => `${p.team}-${p.name.replace(/\s+/g, '-').toLowerCase()}`
  );
  const pickedPlayerIds = allPlayerIds.slice(0, 32);
  const pickTimestamp = new Date('2024-03-01T10:05:00Z');

  for (let p = 1; p <= 32; p++) {
    const round = Math.ceil(p / 4);
    const indexInRound = (p - 1) % 4;
    const participantIndex = round % 2 === 1 ? indexInRound : 3 - indexInRound;
    const participantId = participantIds[participantIndex];
    const playerId = pickedPlayerIds[p - 1];

    await prisma.pick.create({
      data: {
        draftStateId: 'seed-draft',
        participantId,
        playerId,
        round,
        pickNumber: p,
        timestamp: new Date(pickTimestamp.getTime() + (p - 1) * 60000),
      },
    });
  }
  console.log('  Draft (completed) with 32 picks');

  // Verify the data
  const totalPlayers = await prisma.player.count();
  const totalConfigs = await prisma.draftConfig.count();
  const totalScoringRules = await prisma.scoringRule.count();
  const totalLeagues = await prisma.league.count();
  const totalSeasons = await prisma.season.count();
  const totalTeams = await prisma.team.count();
  const totalMatches = await prisma.match.count();
  const totalPicks = await prisma.pick.count();

  console.log(`\nDatabase Summary:`);
  console.log(`   - Total Players: ${totalPlayers}`);
  console.log(`   - Total Configs: ${totalConfigs}`);
  console.log(`   - Total Scoring Rules: ${totalScoringRules}`);
  console.log(`   - Leagues: ${totalLeagues}, Seasons: ${totalSeasons}, Teams: ${totalTeams}`);
  console.log(`   - Matches: ${totalMatches}, Picks: ${totalPicks}`);

  console.log('\nSeed completed successfully!');
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
