/**
 * Run cricket data sync by calling POST /api/sync/cricket-data.
 * Loads .env from cricket-app root. Requires the app to be running (e.g. npm run dev).
 */
const path = require('path');

// Load .env using dotenv (same as the app)
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const secret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

if (!secret) {
  console.error('Missing CRON_SECRET or ADMIN_SECRET in .env');
  process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, '')}/api/sync/cricket-data`;

async function run() {
  console.log('Calling sync at', url, '...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Sync failed:', res.status, data.error || data);
      process.exit(1);
    }
    console.log('Sync completed:', JSON.stringify(data, null, 2));
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED') {
      console.error('Connection refused. Is the app running? Start with: npm run dev');
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

run();
