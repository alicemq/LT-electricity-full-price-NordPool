#!/bin/bash

# CapRover Deployment Script for Electricity Prices NordPool
# This script helps automate the deployment process to CapRover

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="electricity-prices"
CAPROVER_SERVER="your-caprover-server.com"
CAPROVER_PORT="3000"
DOMAIN="your-app-name.your-domain.com"

echo -e "${BLUE}🚀 Electricity Prices NordPool - CapRover Deployment${NC}"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

if ! command_exists curl; then
    echo -e "${RED}❌ curl is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check if we're in the right directory
if [ ! -f "captain-definition" ]; then
    echo -e "${RED}❌ captain-definition file not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Update configuration
echo -e "${YELLOW}🔧 Updating configuration...${NC}"

# Update captain-definition with current domain
sed -i "s/your-app-name.your-domain.com/$DOMAIN/g" captain-definition

# Update environment variables
sed -i "s/your-app-name.your-domain.com/$DOMAIN/g" captain-definition

echo -e "${GREEN}✅ Configuration updated${NC}"

# Check git status
echo -e "${YELLOW}📊 Checking git status...${NC}"

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Do you want to commit them? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git add .
        git commit -m "Prepare for CapRover deployment"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Proceeding with uncommitted changes${NC}"
    fi
else
    echo -e "${GREEN}✅ Working directory is clean${NC}"
fi

# Push to remote
echo -e "${YELLOW}📤 Pushing to remote repository...${NC}"
git push origin main
echo -e "${GREEN}✅ Code pushed to remote${NC}"

# Display deployment instructions
echo -e "${BLUE}📋 Deployment Instructions${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}1. Access CapRover Dashboard:${NC}"
echo "   http://$CAPROVER_SERVER:$CAPROVER_PORT"
echo ""
echo -e "${YELLOW}2. Create New App:${NC}"
echo "   - Click 'Create New App'"
echo "   - App Name: $APP_NAME"
echo "   - Has Persistent Data: Yes"
echo "   - Instance Count: 1"
echo ""
echo -e "${YELLOW}3. Deploy from Git:${NC}"
echo "   - Select 'Deploy from Git'"
echo "   - Repository URL: $(git remote get-url origin)"
echo "   - Branch: main"
echo "   - Click 'Deploy'"
echo ""
echo -e "${YELLOW}4. Configure Domain:${NC}"
echo "   - Go to app settings"
echo "   - Click 'HTTP Settings'"
echo "   - Add custom domain: $DOMAIN"
echo "   - Enable 'Force HTTPS'"
echo ""
echo -e "${YELLOW}5. Set Environment Variables:${NC}"
echo "   - Go to app settings"
echo "   - Click 'Environment Variables'"
echo "   - Add the following variables:"
echo "     NODE_ENV=production"
echo "     DATABASE_URL=postgresql://electricity_user:electricity_password@postgres:5432/electricity_prices"
echo "     ELERING_API_URL=https://dashboard.elering.ee/api/nps/price"
echo "     FRONTEND_URL=https://$DOMAIN"
echo ""
echo -e "${YELLOW}6. Database Setup:${NC}"
echo "   - Create a PostgreSQL app in CapRover"
echo "   - Update DATABASE_URL with the correct connection string"
echo "   - The app will automatically initialize the database"
echo ""
echo -e "${YELLOW}7. Verify Deployment:${NC}"
echo "   - Wait for health check to pass"
echo "   - Test the application: https://$DOMAIN"
echo "   - Check logs for any errors"
echo ""

# Test deployment readiness
echo -e "${YELLOW}🧪 Testing deployment readiness...${NC}"

# Check if all required files exist
required_files=(
    "captain-definition"
    "Dockerfile.captain.simple"
    "electricity-prices-build/nginx.conf"
    "backend/package.json"
    "data-sync/package.json"
    "swagger-ui/openapi.yaml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (missing)${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Deployment preparation completed!${NC}"
echo ""
echo -e "${BLUE}📞 Next Steps:${NC}"
echo "1. Follow the deployment instructions above"
echo "2. Monitor the build logs in CapRover"
echo "3. Test the application once deployed"
echo "4. Check the logs for any issues"
echo ""
echo -e "${BLUE}📚 Additional Resources:${NC}"
echo "- CapRover Documentation: https://caprover.com/docs/"
echo "- Deployment Guide: ./documentation/CAPROVER_DEPLOYMENT.md"
echo "- Troubleshooting: Check logs in CapRover dashboard"
echo ""
echo -e "${GREEN}✅ Ready for deployment!${NC}" 