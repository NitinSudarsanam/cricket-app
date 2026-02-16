# Database Setup Script for Windows PowerShell
# Run this script to set up your database tables

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fantasy Cricket Draft - Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host "Prisma client generated successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Push Schema to Database
Write-Host "Step 2: Creating database tables..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create database tables" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Database connection failed - check your DATABASE_URL in .env" -ForegroundColor White
    Write-Host "  2. Supabase database is not running - check https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "  3. Network/firewall blocking connection" -ForegroundColor White
    Write-Host ""
    Write-Host "See SETUP_DATABASE.md for troubleshooting" -ForegroundColor Cyan
    exit 1
}

Write-Host "Database tables created successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Ask about seeding
Write-Host "Step 3: Seed sample data?" -ForegroundColor Yellow
$seed = Read-Host "Do you want to add sample data (100 players, 4 participants)? (y/n)"

if ($seed -eq "y" -or $seed -eq "Y") {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Seeding failed, but tables are created" -ForegroundColor Yellow
    } else {
        Write-Host "Sample data added successfully" -ForegroundColor Green
    }
} else {
    Write-Host "Skipping sample data" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Open admin panel: http://localhost:3000/admin" -ForegroundColor White
Write-Host "  3. Import players and configure draft" -ForegroundColor White
Write-Host ""
Write-Host "To view your database:" -ForegroundColor Yellow
Write-Host "  npm run db:studio" -ForegroundColor White
Write-Host "  Then open: http://localhost:5555" -ForegroundColor White
Write-Host ""
