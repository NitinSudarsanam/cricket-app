@echo off
REM Database Setup Script for Windows Command Prompt
REM Run this script to set up your database tables

echo ========================================
echo Fantasy Cricket Draft - Database Setup
echo ========================================
echo.

REM Step 1: Generate Prisma Client
echo Step 1: Generating Prisma Client...
call npm run db:generate

if %ERRORLEVEL% NEQ 0 (
    echo Failed to generate Prisma client
    exit /b 1
)

echo Prisma client generated successfully
echo.

REM Step 2: Push Schema to Database
echo Step 2: Creating database tables...
call npm run db:push

if %ERRORLEVEL% NEQ 0 (
    echo Failed to create database tables
    echo.
    echo Possible issues:
    echo   1. Database connection failed - check your DATABASE_URL in .env
    echo   2. Supabase database is not running
    echo   3. Network/firewall blocking connection
    echo.
    echo See SETUP_DATABASE.md for troubleshooting
    exit /b 1
)

echo Database tables created successfully
echo.

REM Step 3: Ask about seeding
set /p seed="Do you want to add sample data (100 players, 4 participants)? (y/n): "

if /i "%seed%"=="y" (
    echo Seeding database...
    call npm run db:seed
    
    if %ERRORLEVEL% NEQ 0 (
        echo Seeding failed, but tables are created
    ) else (
        echo Sample data added successfully
    )
) else (
    echo Skipping sample data
)

echo.
echo ========================================
echo Database Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start the dev server: npm run dev
echo   2. Open admin panel: http://localhost:3000/admin
echo   3. Import players and configure draft
echo.
echo To view your database:
echo   npm run db:studio
echo   Then open: http://localhost:5555
echo.
pause
