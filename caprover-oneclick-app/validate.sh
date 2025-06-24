#!/bin/bash

# Electricity Prices NordPool - CapRover One-Click App Validation Script
# This script validates the one-click app template against CapRover standards

set -e

echo "🔍 Validating CapRover One-Click App Template..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    fi
}

# Check if required files exist
echo "📁 Checking required files..."

if [ -f "captain-definition" ]; then
    print_status "PASS" "captain-definition exists"
else
    print_status "FAIL" "captain-definition missing"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    print_status "PASS" "Dockerfile exists"
else
    print_status "FAIL" "Dockerfile missing"
    exit 1
fi

if [ -f "one-click-app.json" ]; then
    print_status "PASS" "one-click-app.json exists"
else
    print_status "FAIL" "one-click-app.json missing"
    exit 1
fi

if [ -f "README.md" ]; then
    print_status "PASS" "README.md exists"
else
    print_status "FAIL" "README.md missing"
    exit 1
fi

# Validate captain-definition JSON
echo "🔧 Validating captain-definition..."
if command -v jq >/dev/null 2>&1; then
    if jq empty captain-definition 2>/dev/null; then
        print_status "PASS" "captain-definition is valid JSON"
    else
        print_status "FAIL" "captain-definition contains invalid JSON"
        exit 1
    fi
    
    # Check required fields
    if jq -e '.schemaVersion' captain-definition >/dev/null 2>&1; then
        print_status "PASS" "captain-definition has schemaVersion"
    else
        print_status "FAIL" "captain-definition missing schemaVersion"
        exit 1
    fi
    
    if jq -e '.dockerfilePath' captain-definition >/dev/null 2>&1; then
        print_status "PASS" "captain-definition has dockerfilePath"
    else
        print_status "FAIL" "captain-definition missing dockerfilePath"
        exit 1
    fi
else
    print_status "WARN" "jq not installed, skipping JSON validation"
fi

# Validate one-click-app.json JSON
echo "📋 Validating one-click-app.json..."
if command -v jq >/dev/null 2>&1; then
    if jq empty one-click-app.json 2>/dev/null; then
        print_status "PASS" "one-click-app.json is valid JSON"
    else
        print_status "FAIL" "one-click-app.json contains invalid JSON"
        exit 1
    fi
    
    # Check required fields
    if jq -e '.captainVersion' one-click-app.json >/dev/null 2>&1; then
        print_status "PASS" "one-click-app.json has captainVersion"
    else
        print_status "FAIL" "one-click-app.json missing captainVersion"
        exit 1
    fi
    
    if jq -e '.displayName' one-click-app.json >/dev/null 2>&1; then
        print_status "PASS" "one-click-app.json has displayName"
    else
        print_status "FAIL" "one-click-app.json missing displayName"
        exit 1
    fi
    
    if jq -e '.description' one-click-app.json >/dev/null 2>&1; then
        print_status "PASS" "one-click-app.json has description"
    else
        print_status "FAIL" "one-click-app.json missing description"
        exit 1
    fi
    
    if jq -e '.instructions' one-click-app.json >/dev/null 2>&1; then
        print_status "PASS" "one-click-app.json has instructions"
    else
        print_status "FAIL" "one-click-app.json missing instructions"
        exit 1
    fi
else
    print_status "WARN" "jq not installed, skipping JSON validation"
fi

# Validate Dockerfile
echo "🐳 Validating Dockerfile..."
if grep -q "FROM" Dockerfile; then
    print_status "PASS" "Dockerfile contains FROM instruction"
else
    print_status "FAIL" "Dockerfile missing FROM instruction"
    exit 1
fi

if grep -q "EXPOSE" Dockerfile; then
    print_status "PASS" "Dockerfile contains EXPOSE instruction"
else
    print_status "FAIL" "Dockerfile missing EXPOSE instruction"
    exit 1
fi

if grep -q "CMD\|ENTRYPOINT" Dockerfile; then
    print_status "PASS" "Dockerfile contains CMD or ENTRYPOINT"
else
    print_status "FAIL" "Dockerfile missing CMD or ENTRYPOINT"
    exit 1
fi

# Check for health check
if grep -q "HEALTHCHECK" Dockerfile; then
    print_status "PASS" "Dockerfile contains HEALTHCHECK"
else
    print_status "WARN" "Dockerfile missing HEALTHCHECK (recommended)"
fi

# Validate README.md
echo "📖 Validating README.md..."
if [ -s README.md ]; then
    print_status "PASS" "README.md is not empty"
else
    print_status "FAIL" "README.md is empty"
    exit 1
fi

if grep -q "CapRover" README.md; then
    print_status "PASS" "README.md mentions CapRover"
else
    print_status "WARN" "README.md should mention CapRover"
fi

if grep -q "one-click" README.md; then
    print_status "PASS" "README.md mentions one-click deployment"
else
    print_status "WARN" "README.md should mention one-click deployment"
fi

# Check for logo
if [ -f "logo.svg" ] || [ -f "logo.png" ]; then
    print_status "PASS" "Logo file exists"
else
    print_status "WARN" "Logo file missing (recommended for better UX)"
fi

# Check file permissions
echo "🔐 Checking file permissions..."
if [ -x "install.sh" ]; then
    print_status "PASS" "install.sh is executable"
else
    print_status "WARN" "install.sh should be executable"
fi

# Summary
echo ""
echo "📊 Validation Summary:"
echo "======================"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 All validation checks passed!${NC}"
    echo ""
    echo "✅ Your one-click app template is ready for CapRover deployment"
    echo "📝 Next steps:"
    echo "   1. Update repository URLs in one-click-app.json"
    echo "   2. Add logo file (optional but recommended)"
    echo "   3. Test deployment on a CapRover instance"
    echo "   4. Submit to CapRover one-click apps repository"
else
    echo -e "${RED}❌ Validation failed!${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    exit 1
fi 