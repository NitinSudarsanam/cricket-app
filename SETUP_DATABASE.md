# Database Setup Instructions

## Issue: Tables Don't Exist

You're seeing this error because the database tables haven't been created yet.

## Solution: Create Database Tables

Run these commands in order:

### Step 1: Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma client based on your schema.

### Step 2: Push Schema to Database

```bash
npm run db:push
```

This creates all the tables in your Supabase database.

**What this does:**
- Creates `Player` table
- Creates `Participant` table
- Creates `DraftConfig` table
- Creates `DraftState` table
- Creates `DraftOrder` table
- Creates `Pick` table
- Sets up all relationships and indexes

### Step 3: Verify Tables Were Created

```bash
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can see all your tables.

### Step 4: (Optional) Seed Sample Data

```bash
npm run db:seed
```

This adds sample data:
- 120 IPL-style players (all 10 teams)
- 1 draft configuration

## If You Get Connection Errors

### Error: "ECONNREFUSED"

This means the database connection failed. Check:

1. **Supabase Database is Active**
   - Go to https://supabase.com/dashboard
   - Check your project is running
   - Verify the connection string

2. **Connection String is Correct**
   - Set `DATABASE_URL` in your `.env` (see `.env.example`)
   - Use the connection string from your Supabase project settings
   - Make sure the password is correct and any special characters are URL-encoded

3. **Network/Firewall**
   - Make sure your firewall allows connections to Supabase
   - Check if you're behind a VPN that might block it

## Quick Fix Commands

```bash
# Full setup from scratch
npm run db:generate
npm run db:push
npm run db:seed

# Then restart your dev server
npm run dev
```

## Verify Everything Works

After running the commands, test the API:

```bash
# In your browser, go to:
http://localhost:3000/api/health

# You should see:
{
  "status": "healthy",
  "database": {
    "connected": true
  }
}
```

## Still Having Issues?

### Check Prisma Connection

```bash
# Test database connection
npx prisma db pull
```

If this works, your connection is good.

### Reset Everything

If tables are corrupted or you want to start fresh:

```bash
# WARNING: This deletes all data!
npm run db:push -- --force-reset
```

## Next Steps

Once tables are created:
1. Restart dev server: `npm run dev`
2. Go to admin panel: http://localhost:3000/admin
3. Import players
4. Configure draft
5. Start drafting!
