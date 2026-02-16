# Scripts Directory

This directory contains utility scripts for development, deployment, and maintenance.

## Available Scripts

### 1. `deploy.sh` / `deploy.ps1`

Automated deployment script for Vercel.

**Usage:**

```bash
# Linux/Mac
./scripts/deploy.sh [production|preview]

# Windows PowerShell
.\scripts\deploy.ps1 [production|preview]
```

**What it does:**
1. Validates project structure
2. Installs dependencies if needed
3. Runs tests (if available)
4. Builds the project
5. Checks environment variables
6. Deploys to Vercel

**Examples:**

```bash
# Deploy to preview environment
./scripts/deploy.sh preview

# Deploy to production
./scripts/deploy.sh production
```

### 2. `test-sportmonks-api.js`

Tests the Sportmonks Cricket API (token, leagues, seasons, and optionally teams/squad). Use this to verify your API key and that Cricket is included in your plan.

**Usage:**

```bash
node scripts/test-sportmonks-api.js
# or
npm run test:sportmonks
```

**Requires:** `SPORTMONKS_API_TOKEN` in `.env` (loaded from project root).

**What it does:** Calls `GET /leagues`, `GET /seasons`, and `GET /teams?include=squad&filter[season_id]=...`. If leagues and seasons succeed, the script exits 0. A 500 on teams/squad is treated as a warning (may require a higher plan).

### 3. `run-sync.js`

Calls the app’s sync endpoint (app must be running). See main README for sync setup.

### 4. `analyze-bundle.js`

Analyzes Next.js build output and provides bundle size insights.

**Usage:**

```bash
# Run after building
npm run build
node scripts/analyze-bundle.js

# Or use the combined command
npm run build:analyze
```

**What it does:**
1. Reads build manifest
2. Calculates bundle sizes
3. Identifies large pages
4. Provides optimization recommendations

**Output:**
- Top 10 largest page bundles
- Total bundle size
- Optimization recommendations
- Checklist for improvements

## NPM Scripts

These scripts are defined in `package.json` and can be run with `npm run <script>`:

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Analysis

- `npm run analyze` - Analyze bundle sizes
- `npm run build:analyze` - Build and analyze

### API

- `npm run test:sportmonks` - Test Sportmonks Cricket API (leagues, seasons)

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database

## Creating New Scripts

When creating new scripts:

1. **Add to this directory** (`scripts/`)
2. **Make executable** (Linux/Mac): `chmod +x scripts/your-script.sh`
3. **Document here** in this README
4. **Add to package.json** if it should be an npm script
5. **Use error handling** (`set -e` in bash, `$ErrorActionPreference = "Stop"` in PowerShell)
6. **Add helpful output** with colors and emojis
7. **Include usage instructions** in comments

## Best Practices

### Bash Scripts

```bash
#!/bin/bash
set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}✅ Success${NC}"
```

### PowerShell Scripts

```powershell
$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "✅ Success"
```

### Node.js Scripts

```javascript
#!/usr/bin/env node

// Use colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
};

console.log(`${colors.green}✅ Success${colors.reset}`);

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}❌ Error:${colors.reset}`, error);
  process.exit(1);
});
```

## Troubleshooting

### Script won't execute (Linux/Mac)

```bash
# Make script executable
chmod +x scripts/your-script.sh
```

### PowerShell execution policy error

```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js script not found

```bash
# Ensure script is executable and has shebang
chmod +x scripts/your-script.js
# Add to top of file: #!/usr/bin/env node
```

## Contributing

When adding new scripts:

1. Follow existing patterns
2. Add error handling
3. Document in this README
4. Test on multiple platforms if possible
5. Add helpful output messages
