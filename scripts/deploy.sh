#!/bin/bash

# =============================================================================
# Fantasy Cricket Draft - Deployment Script
# =============================================================================
# This script automates the deployment process to Vercel
# Usage: ./scripts/deploy.sh [production|preview]
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment type (default: preview)
DEPLOY_TYPE="${1:-preview}"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Fantasy Cricket Draft - Deployment Script${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Check if we're in the cricket directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo -e "${YELLOW}Please run this script from the cricket directory${NC}"
    exit 1
fi

# Step 1: Pre-deployment checks
echo -e "${BLUE}📋 Step 1: Pre-deployment checks${NC}"
echo ""

# Check if .env.example exists
if [ ! -f ".env.example" ]; then
    echo -e "${RED}❌ .env.example not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env.example found${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 2: Run tests (if available)
echo ""
echo -e "${BLUE}🧪 Step 2: Running tests${NC}"
echo ""

# Check if test script exists
if grep -q '"test"' package.json; then
    npm test || {
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  No test script found, skipping tests${NC}"
fi

# Step 3: Build check
echo ""
echo -e "${BLUE}🔨 Step 3: Build check${NC}"
echo ""

npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"

# Step 4: Environment variable check
echo ""
echo -e "${BLUE}🔐 Step 4: Environment variable check${NC}"
echo ""

echo -e "${YELLOW}Please ensure the following environment variables are set in Vercel:${NC}"
echo ""
echo "Required variables:"
echo "  - DATABASE_URL"
echo "  - PUSHER_APP_ID"
echo "  - PUSHER_KEY"
echo "  - PUSHER_SECRET"
echo "  - PUSHER_CLUSTER"
echo "  - NEXT_PUBLIC_PUSHER_KEY"
echo "  - NEXT_PUBLIC_PUSHER_CLUSTER"
echo "  - ADMIN_SECRET"
echo "  - NEXT_PUBLIC_APP_URL"
echo ""

read -p "Have you set all required environment variables in Vercel? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    echo -e "${YELLOW}Please set environment variables in Vercel dashboard first${NC}"
    exit 1
fi

# Step 5: Deploy
echo ""
echo -e "${BLUE}🚀 Step 5: Deploying to Vercel${NC}"
echo ""

if [ "$DEPLOY_TYPE" = "production" ]; then
    echo -e "${YELLOW}⚠️  Deploying to PRODUCTION${NC}"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found${NC}"
        echo -e "${YELLOW}Install with: npm install -g vercel${NC}"
        exit 1
    fi
    
    vercel --prod
else
    echo -e "${BLUE}Deploying to PREVIEW${NC}"
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found${NC}"
        echo -e "${YELLOW}Install with: npm install -g vercel${NC}"
        exit 1
    fi
    
    vercel
fi

# Step 6: Post-deployment
echo ""
echo -e "${BLUE}✅ Step 6: Post-deployment${NC}"
echo ""

echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Wait for deployment to complete"
echo "  2. Check deployment logs in Vercel dashboard"
echo "  3. Test the deployed application"
echo "  4. Run database migrations if needed"
echo "  5. Verify real-time functionality"
echo ""
echo -e "${BLUE}==============================================================================${NC}"
