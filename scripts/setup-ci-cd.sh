#!/bin/bash

# Electricity Prices NordPool - CI/CD Setup Script
# This script helps set up the CI/CD environment and required secrets

set -e

echo "🚀 Setting up CI/CD for Electricity Prices NordPool..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

print_success() {
    echo -e "${GREEN}✅ SUCCESS${NC}: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
}

print_error() {
    echo -e "${RED}❌ ERROR${NC}: $1"
}

# Check if we're in a GitHub repository
if [ ! -d ".git" ]; then
    print_error "This script must be run from a Git repository"
    exit 1
fi

# Get repository information
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")

print_info "Repository: $REPO_NAME"
print_info "Repository URL: $REPO_URL"

echo ""
echo "📋 Required GitHub Secrets Setup"
echo "================================"

echo ""
print_info "You need to configure the following secrets in your GitHub repository:"
echo ""

echo "🔐 Required Secrets:"
echo "==================="

echo "1. CAPROVER_SERVER"
echo "   - Your CapRover server URL (e.g., https://captain.yourdomain.com)"
echo "   - Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "   - Add new repository secret"
echo ""

echo "2. CAPROVER_PASSWORD"
echo "   - Your CapRover password"
echo "   - This is the password you use to log into CapRover dashboard"
echo "   - Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "   - Add new repository secret"
echo ""

echo "3. CAPROVER_APP_NAME"
echo "   - The name of your app in CapRover"
echo "   - This should match the app name you created in CapRover"
echo "   - Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "   - Add new repository secret"
echo ""

echo "4. ONE_CLICK_APPS_TOKEN (Optional)"
echo "   - GitHub Personal Access Token with repo permissions"
echo "   - Required for auto-updating one-click app in CapRover repository"
echo "   - Create at: https://github.com/settings/tokens"
echo "   - Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "   - Add new repository secret"
echo ""

echo "5. SLACK_WEBHOOK_URL (Optional)"
echo "   - Slack webhook URL for deployment notifications"
echo "   - Create at: https://your-workspace.slack.com/apps/A0F7XDUAZ-incoming-webhooks"
echo "   - Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "   - Add new repository secret"
echo ""

echo ""
echo "🔧 CapRover Configuration"
echo "========================"

echo ""
print_info "Make sure your CapRover instance is configured with:"
echo ""

echo "1. App Configuration:"
echo "   - App Name: Match CAPROVER_APP_NAME secret"
echo "   - Port: 80"
echo "   - Health Check: /api/v1/health"
echo ""

echo "2. Environment Variables:"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=postgresql://electricity_user:electricity_password@postgres:5432/electricity_prices"
echo "   - ELERING_API_URL=https://dashboard.elering.ee/api/nps/price"
echo "   - FRONTEND_URL=https://your-app-name.your-domain.com"
echo ""

echo "3. Volumes:"
echo "   - /var/lib/postgresql/data -> /captain/data/postgres"
echo ""

echo ""
echo "🚀 Workflow Triggers"
echo "==================="

echo ""
print_info "The CI/CD pipeline will trigger on:"
echo ""

echo "✅ Push to main branch"
echo "   - Builds and tests the application"
echo "   - Creates Docker images"
echo "   - Deploys to CapRover"
echo ""

echo "✅ Pull requests to main branch"
echo "   - Builds and tests the application"
echo "   - Runs security scans"
echo "   - Does NOT deploy (safety)"
echo ""

echo "✅ Release creation"
echo "   - Creates tagged Docker images"
echo "   - Updates one-click app (if token provided)"
echo "   - Generates release notes"
echo ""

echo ""
echo "📊 Available Workflows"
echo "====================="

echo ""
echo "1. ci-cd.yml"
echo "   - Main CI/CD pipeline"
echo "   - Build, test, deploy"
echo ""

echo "2. one-click-app-update.yml"
echo "   - Updates CapRover one-click app"
echo "   - Triggers on releases"
echo ""

echo "3. codeql-analysis.yml"
echo "   - Security code analysis"
echo "   - Runs on schedule and PRs"
echo ""

echo "4. dependency-review.yml"
echo "   - Dependency vulnerability scanning"
echo "   - Runs on pull requests"
echo ""

echo ""
echo "🔍 Testing Your Setup"
echo "===================="

echo ""
print_info "To test your CI/CD setup:"
echo ""

echo "1. Push a commit to main branch:"
echo "   git add ."
echo "   git commit -m 'Test CI/CD pipeline'"
echo "   git push origin main"
echo ""

echo "2. Check GitHub Actions:"
echo "   https://github.com/$REPO_NAME/actions"
echo ""

echo "3. Monitor deployment:"
echo "   - Check CapRover dashboard"
echo "   - Verify health check endpoint"
echo "   - Test application functionality"
echo ""

echo ""
echo "📝 Next Steps"
echo "============="

echo ""
print_info "After setting up secrets:"
echo ""

echo "1. Enable GitHub Actions"
echo "   - Go to: https://github.com/$REPO_NAME/actions"
echo "   - Enable workflows if prompted"
echo ""

echo "2. Configure branch protection (Recommended)"
echo "   - Go to: https://github.com/$REPO_NAME/settings/branches"
echo "   - Add rule for main branch"
echo "   - Require status checks to pass"
echo ""

echo "3. Set up release workflow"
echo "   - Create a release on GitHub"
echo "   - Tag with semantic version (e.g., v1.0.0)"
echo "   - CI/CD will automatically deploy"
echo ""

echo "4. Monitor and maintain"
echo "   - Check GitHub Actions regularly"
echo "   - Monitor security alerts"
echo "   - Update dependencies as needed"
echo ""

echo ""
print_success "CI/CD setup instructions completed!"
echo ""
print_info "Remember to:"
echo "  - Set up all required secrets"
echo "  - Test the pipeline with a small change"
echo "  - Monitor the first deployment carefully"
echo ""

# Check if required files exist
echo ""
echo "📁 File Structure Check"
echo "======================"

required_files=(
    ".github/workflows/ci-cd.yml"
    ".github/workflows/one-click-app-update.yml"
    ".github/workflows/codeql-analysis.yml"
    ".github/workflows/dependency-review.yml"
    "Dockerfile.captain"
    "caprover-oneclick-app/Dockerfile"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file"
    else
        print_error "❌ $file (missing)"
    fi
done

echo ""
print_success "Setup script completed successfully!" 