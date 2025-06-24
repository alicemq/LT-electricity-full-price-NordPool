#!/bin/bash

# Generate Client SDKs from OpenAPI Specification
# This script generates client SDKs for various programming languages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OPENAPI_SPEC="swagger-ui/openapi.yaml"
OUTPUT_DIR="generated-sdks"
TEMP_DIR="temp-sdk-generation"

echo -e "${BLUE}🔧 Electricity Prices NordPool API - SDK Generator${NC}"
echo "=================================================="

# Create output directory
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if OpenAPI spec exists
if [ ! -f "$OPENAPI_SPEC" ]; then
    echo -e "${RED}❌ OpenAPI specification not found at $OPENAPI_SPEC${NC}"
    exit 1
fi

echo -e "${GREEN}✅ OpenAPI specification found${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install npm package globally if not exists
install_npm_package() {
    local package=$1
    if ! command_exists "$package"; then
        echo -e "${YELLOW}📦 Installing $package...${NC}"
        npm install -g "$package" || {
            echo -e "${RED}❌ Failed to install $package${NC}"
            return 1
        }
    else
        echo -e "${GREEN}✅ $package already installed${NC}"
    fi
}

# Function to install Python package if not exists
install_python_package() {
    local package=$1
    if ! python3 -c "import $package" 2>/dev/null; then
        echo -e "${YELLOW}📦 Installing $package...${NC}"
        pip3 install "$package" || {
            echo -e "${RED}❌ Failed to install $package${NC}"
            return 1
        }
    else
        echo -e "${GREEN}✅ $package already available${NC}"
    fi
}

# Check and install prerequisites
echo -e "${YELLOW}🔍 Checking and installing code generation tools...${NC}"

# Node.js tools
if command_exists node; then
    echo -e "${GREEN}✅ Node.js found${NC}"
    install_npm_package "openapi-generator-cli" || echo -e "${YELLOW}⚠️  Skipping openapi-generator-cli${NC}"
    install_npm_package "@openapitools/openapi-generator-cli" || echo -e "${YELLOW}⚠️  Skipping @openapitools/openapi-generator-cli${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js to generate JavaScript/TypeScript SDKs${NC}"
fi

# Python tools
if command_exists python3; then
    echo -e "${GREEN}✅ Python 3 found${NC}"
    install_python_package "openapi-generator" || echo -e "${YELLOW}⚠️  Skipping openapi-generator${NC}"
else
    echo -e "${RED}❌ Python 3 not found. Please install Python 3 to generate Python SDKs${NC}"
fi

# Java tools
if command_exists java; then
    echo -e "${GREEN}✅ Java found${NC}"
    # Download OpenAPI Generator JAR if not exists
    if [ ! -f "$TEMP_DIR/openapi-generator-cli.jar" ]; then
        echo -e "${YELLOW}📦 Downloading OpenAPI Generator JAR...${NC}"
        curl -L https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/6.6.0/openapi-generator-cli-6.6.0.jar -o "$TEMP_DIR/openapi-generator-cli.jar"
    fi
else
    echo -e "${YELLOW}⚠️  Java not found. Skipping Java SDK generation${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# Generate SDKs
echo -e "${BLUE}🚀 Generating client SDKs...${NC}"

# JavaScript/TypeScript SDK
if command_exists openapi-generator-cli; then
    echo -e "${YELLOW}📦 Generating JavaScript SDK...${NC}"
    openapi-generator-cli generate \
        -i "$OPENAPI_SPEC" \
        -g javascript \
        -o "$OUTPUT_DIR/javascript" \
        --additional-properties=usePromises=true,emitModelMethods=true,emitJSDoc=true
    
    echo -e "${YELLOW}📦 Generating TypeScript SDK...${NC}"
    openapi-generator-cli generate \
        -i "$OPENAPI_SPEC" \
        -g typescript-fetch \
        -o "$OUTPUT_DIR/typescript" \
        --additional-properties=supportsES6=true,withInterfaces=true,typescriptThreePlus=true
    
    echo -e "${GREEN}✅ JavaScript/TypeScript SDKs generated${NC}"
fi

# Python SDK
if command_exists openapi-generator; then
    echo -e "${YELLOW}📦 Generating Python SDK...${NC}"
    openapi-generator generate \
        -i "$OPENAPI_SPEC" \
        -g python \
        -o "$OUTPUT_DIR/python" \
        --additional-properties=packageName=electricity_prices_api,packageVersion=1.0.0
    
    echo -e "${GREEN}✅ Python SDK generated${NC}"
fi

# Java SDK
if [ -f "$TEMP_DIR/openapi-generator-cli.jar" ]; then
    echo -e "${YELLOW}📦 Generating Java SDK...${NC}"
    java -jar "$TEMP_DIR/openapi-generator-cli.jar" generate \
        -i "$OPENAPI_SPEC" \
        -g java \
        -o "$OUTPUT_DIR/java" \
        --additional-properties=artifactId=electricity-prices-api,artifactVersion=1.0.0,apiPackage=com.electricityprices.api,modelPackage=com.electricityprices.model
    
    echo -e "${GREEN}✅ Java SDK generated${NC}"
fi

# C# SDK
if command_exists dotnet; then
    echo -e "${YELLOW}📦 Generating C# SDK...${NC}"
    if command_exists openapi-generator-cli; then
        openapi-generator-cli generate \
            -i "$OPENAPI_SPEC" \
            -g csharp \
            -o "$OUTPUT_DIR/csharp" \
            --additional-properties=packageName=ElectricityPricesApi,packageVersion=1.0.0,targetFramework=net6.0
        
        echo -e "${GREEN}✅ C# SDK generated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .NET not found. Skipping C# SDK generation${NC}"
fi

# Go SDK
if command_exists go; then
    echo -e "${YELLOW}📦 Generating Go SDK...${NC}"
    if command_exists openapi-generator-cli; then
        openapi-generator-cli generate \
            -i "$OPENAPI_SPEC" \
            -g go \
            -o "$OUTPUT_DIR/go" \
            --additional-properties=packageName=electricitypricesapi,packageVersion=1.0.0
        
        echo -e "${GREEN}✅ Go SDK generated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Go not found. Skipping Go SDK generation${NC}"
fi

# PHP SDK
if command_exists php; then
    echo -e "${YELLOW}📦 Generating PHP SDK...${NC}"
    if command_exists openapi-generator-cli; then
        openapi-generator-cli generate \
            -i "$OPENAPI_SPEC" \
            -g php \
            -o "$OUTPUT_DIR/php" \
            --additional-properties=packageName=electricity-prices-api,packageVersion=1.0.0
        
        echo -e "${GREEN}✅ PHP SDK generated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PHP not found. Skipping PHP SDK generation${NC}"
fi

# Create README for generated SDKs
echo -e "${YELLOW}📝 Creating SDK documentation...${NC}"

cat > "$OUTPUT_DIR/README.md" << 'EOF'
# Electricity Prices NordPool API - Generated Client SDKs

This directory contains auto-generated client SDKs for the Electricity Prices NordPool API.

## Available SDKs

### JavaScript/TypeScript
- **Location**: `javascript/` and `typescript/`
- **Usage**: 
  ```javascript
  import { ElectricityPricesApi } from './typescript';
  const api = new ElectricityPricesApi({ basePath: 'http://localhost/api/v1' });
  ```

### Python
- **Location**: `python/`
- **Usage**:
  ```python
  from electricity_prices_api import ElectricityPricesApi
  api = ElectricityPricesApi(host='http://localhost/api/v1')
  ```

### Java
- **Location**: `java/`
- **Usage**:
  ```java
  import com.electricityprices.api.ElectricityPricesApi;
  ElectricityPricesApi api = new ElectricityPricesApi();
  api.setBasePath("http://localhost/api/v1");
  ```

### C#
- **Location**: `csharp/`
- **Usage**:
  ```csharp
  using ElectricityPricesApi;
  var api = new ElectricityPricesApi("http://localhost/api/v1");
  ```

### Go
- **Location**: `go/`
- **Usage**:
  ```go
  import "github.com/your-repo/electricity-prices-api/go"
  api := electricitypricesapi.NewAPIClient(&electricitypricesapi.Configuration{
      BasePath: "http://localhost/api/v1",
  })
  ```

### PHP
- **Location**: `php/`
- **Usage**:
  ```php
  require_once 'php/vendor/autoload.php';
  $api = new \ElectricityPricesApi\Api\ElectricityPricesApi();
  $api->getConfig()->setHost('http://localhost/api/v1');
  ```

## API Documentation

- **Interactive Documentation**: http://localhost/api/
- **OpenAPI Specification**: http://localhost/api/openapi.yaml
- **Project Documentation**: https://github.com/your-repo/electricity-prices

## Generation

SDKs are generated using OpenAPI Generator tools. To regenerate:

```bash
./scripts/generate-sdks.sh
```

## Notes

- All SDKs are generated from the same OpenAPI specification
- SDKs include full type safety and documentation
- Examples and usage patterns are included in each SDK
- All SDKs support the same API endpoints and data models

Generated on: $(date)
EOF

# Clean up temporary files
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 SDK generation completed!${NC}"
echo -e "${BLUE}📁 Generated SDKs are available in: $OUTPUT_DIR${NC}"
echo -e "${BLUE}📖 SDK documentation: $OUTPUT_DIR/README.md${NC}"
echo ""
echo -e "${YELLOW}📋 Generated SDKs:${NC}"
ls -la "$OUTPUT_DIR" | grep "^d" | awk '{print "  - " $9}'
echo ""
echo -e "${GREEN}✅ All done! You can now use the generated SDKs in your projects.${NC}" 