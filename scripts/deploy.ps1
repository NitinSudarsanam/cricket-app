# =============================================================================
# Fantasy Cricket Draft - Deployment Script (PowerShell)
# =============================================================================
# This script automates the deployment process to Vercel
# Usage: .\scripts\deploy.ps1 [production|preview]
# =============================================================================

param(
    [string]$DeployType = "preview"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Blue "=============================================================================="
Write-ColorOutput Blue "Fantasy Cricket Draft - Deployment Script"
Write-ColorOutput Blue "=============================================================================="
Write-Output ""

# Check if we're in the cricket directory
if (-not (Test-Path "package.json")) {
    Write-ColorOutput Red "Error: package.json not found"
    Write-ColorOutput Yellow "Please run this script from the cricket directory"
    exit 1
}

# Step 1: Pre-deployment checks
Write-ColorOutput Blue "Step 1: Pre-deployment checks"
Write-Output ""

# Check if .env.example exists
if (-not (Test-Path ".env.example")) {
    Write-ColorOutput Red ".env.example not found"
    exit 1
}
Write-ColorOutput Green ".env.example found"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Yellow "node_modules not found, installing dependencies..."
    npm install
}
Write-ColorOutput Green "Dependencies installed"

# Step 2: Run tests (if available)
Write-Output ""
Write-ColorOutput Blue "Step 2: Running tests"
Write-Output ""

# Check if test script exists
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts.test) {
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Tests failed"
        exit 1
    }
    Write-ColorOutput Green "Tests passed"
} else {
    Write-ColorOutput Yellow "No test script found, skipping tests"
}

# Step 3: Build check
Write-Output ""
Write-ColorOutput Blue "Step 3: Build check"
Write-Output ""

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Build failed"
    exit 1
}
Write-ColorOutput Green "Build successful"

# Step 4: Environment variable check
Write-Output ""
Write-ColorOutput Blue "Step 4: Environment variable check"
Write-Output ""

Write-ColorOutput Yellow "Please ensure the following environment variables are set in Vercel:"
Write-Output ""
Write-Output "Required variables:"
Write-Output "  - DATABASE_URL"
Write-Output "  - PUSHER_APP_ID"
Write-Output "  - PUSHER_KEY"
Write-Output "  - PUSHER_SECRET"
Write-Output "  - PUSHER_CLUSTER"
Write-Output "  - NEXT_PUBLIC_PUSHER_KEY"
Write-Output "  - NEXT_PUBLIC_PUSHER_CLUSTER"
Write-Output "  - ADMIN_SECRET"
Write-Output "  - NEXT_PUBLIC_APP_URL"
Write-Output ""

$response = Read-Host "Have you set all required environment variables in Vercel? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-ColorOutput Red "Deployment cancelled"
    Write-ColorOutput Yellow "Please set environment variables in Vercel dashboard first"
    exit 1
}

# Step 5: Deploy
Write-Output ""
Write-ColorOutput Blue "Step 5: Deploying to Vercel"
Write-Output ""

if ($DeployType -eq "production") {
    Write-ColorOutput Yellow "Deploying to PRODUCTION"
    $response = Read-Host "Are you sure? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-ColorOutput Red "Deployment cancelled"
        exit 1
    }
    
    # Check if vercel CLI is installed
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-ColorOutput Red "Vercel CLI not found"
        Write-ColorOutput Yellow "Install with: npm install -g vercel"
        exit 1
    }
    
    vercel --prod
} else {
    Write-ColorOutput Blue "Deploying to PREVIEW"
    
    # Check if vercel CLI is installed
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-ColorOutput Red "Vercel CLI not found"
        Write-ColorOutput Yellow "Install with: npm install -g vercel"
        exit 1
    }
    
    vercel
}

# Step 6: Post-deployment
Write-Output ""
Write-ColorOutput Blue "Step 6: Post-deployment"
Write-Output ""

Write-ColorOutput Green "Deployment initiated successfully!"
Write-Output ""
Write-ColorOutput Yellow "Next steps:"
Write-Output "  1. Wait for deployment to complete"
Write-Output "  2. Check deployment logs in Vercel dashboard"
Write-Output "  3. Test the deployed application"
Write-Output "  4. Run database migrations if needed"
Write-Output "  5. Verify real-time functionality"
Write-Output ""
Write-ColorOutput Blue "=============================================================================="
