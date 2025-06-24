#!/bin/bash

# Multi-Service CapRover Deployment Setup Script
# This script creates the directory structure and configuration files for multi-service deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="your-domain.com"
APP_PREFIX="electricity"

echo -e "${BLUE}🏗 Electricity Prices NordPool - Multi-Service Setup${NC}"
echo "=================================================="

# Create service directories
echo -e "${YELLOW}📁 Creating service directories...${NC}"
mkdir -p caprover-services/{frontend,backend,database,sync,docs}

echo -e "${GREEN}✅ Service directories created${NC}"

# Function to create captain-definition file
create_captain_definition() {
    local service=$1
    local port=$2
    local health_path=$3
    local description=$4
    local env_vars=$5
    
    cat > "caprover-services/$service/captain-definition" << EOF
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.$service",
  "buildArguments": {
    "NODE_ENV": "production"
  },
  "healthCheck": {
    "httpPath": "$health_path",
    "httpPort": $port,
    "httpMethod": "GET",
    "initialDelaySeconds": 30,
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": $port,
    "httpAuth": false
  },
  "environmentVariables": {
    $env_vars
  },
  "notExposeAsWebApp": false,
  "containerHttpPort": $port,
  "description": "$description",
  "imageName": "$APP_PREFIX-$service",
  "imageTag": "latest",
  "instanceCount": 1
}
EOF
}

# Create captain-definition files
echo -e "${YELLOW}📝 Creating captain-definition files...${NC}"

# Frontend
create_captain_definition "frontend" 80 "/" \
  "Electricity Prices Frontend - Vue.js application with Nginx" \
  '"NODE_ENV": "production",
    "BACKEND_URL": "https://electricity-backend.'$DOMAIN'",
    "FRONTEND_URL": "https://electricity-frontend.'$DOMAIN'"'

# Backend
create_captain_definition "backend" 3000 "/api/v1/health" \
  "Electricity Prices Backend - Node.js/Express API" \
  '"NODE_ENV": "production",
    "DATABASE_URL": "postgresql://electricity_user:electricity_password@electricity-postgres:5432/electricity_prices",
    "ELERING_API_URL": "https://dashboard.elering.ee/api/nps/price",
    "FRONTEND_URL": "https://electricity-frontend.'$DOMAIN'"'

# Database
create_captain_definition "database" 5432 "/health" \
  "Electricity Prices Database - PostgreSQL" \
  '"POSTGRES_DB": "electricity_prices",
    "POSTGRES_USER": "electricity_user",
    "POSTGRES_PASSWORD": "electricity_password"'

# Sync
create_captain_definition "sync" 3001 "/health" \
  "Electricity Prices Data Sync - Automated data synchronization" \
  '"NODE_ENV": "production",
    "DATABASE_URL": "postgresql://electricity_user:electricity_password@electricity-postgres:5432/electricity_prices",
    "ELERING_API_URL": "https://dashboard.elering.ee/api/nps/price"'

# Docs
create_captain_definition "docs" 8080 "/" \
  "Electricity Prices API Documentation - Swagger UI" \
  '"SWAGGER_JSON": "/tmp/api.json",
    "BASE_URL": "/api"'

echo -e "${GREEN}✅ Captain-definition files created${NC}"

# Function to create Dockerfile
create_dockerfile() {
    local service=$1
    local dockerfile_content=$2
    
    cat > "caprover-services/$service/Dockerfile.$service" << EOF
$dockerfile_content
EOF
}

# Create Dockerfiles
echo -e "${YELLOW}🐳 Creating Dockerfiles...${NC}"

# Frontend Dockerfile
create_dockerfile "frontend" 'FROM nginx:alpine

# Install Node.js for build process
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package files
COPY electricity-prices-build/package*.json ./electricity-prices-build/

# Install dependencies
RUN cd electricity-prices-build && npm ci --only=production

# Copy source code
COPY electricity-prices-build ./electricity-prices-build

# Build frontend
RUN cd electricity-prices-build && npm run build

# Copy nginx configuration
COPY electricity-prices-build/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY electricity-prices-build/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]'

# Backend Dockerfile
create_dockerfile "backend" 'FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client curl

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm ci --only=production

# Copy source code
COPY backend ./backend
COPY database ./database

# Create startup script
RUN echo '"'"'#!/bin/sh
# Wait for database
echo "Waiting for database..."
until pg_isready -h electricity-postgres -p 5432 -U electricity_user; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Initialize database if needed
if [ ! -f /app/database/initialized ]; then
  echo "Initializing database..."
  psql $DATABASE_URL -f /app/database/init/01_schema.sql
  touch /app/database/initialized
  echo "Database initialized!"
fi

# Start backend API
echo "Starting backend API..."
cd /app/backend && npm start
'"'"' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["/app/start.sh"]'

# Database Dockerfile
create_dockerfile "database" 'FROM postgres:15-alpine

# Copy initialization scripts
COPY database/init /docker-entrypoint-initdb.d

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pg_isready -U electricity_user -d electricity_prices || exit 1

# Start PostgreSQL
CMD ["postgres"]'

# Sync Dockerfile
create_dockerfile "sync" 'FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client curl

# Set working directory
WORKDIR /app

# Copy package files
COPY data-sync/package*.json ./data-sync/

# Install dependencies
RUN cd data-sync && npm ci --only=production

# Copy source code
COPY data-sync ./data-sync

# Create startup script
RUN echo '"'"'#!/bin/sh
# Wait for database
echo "Waiting for database..."
until pg_isready -h electricity-postgres -p 5432 -U electricity_user; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Start data sync worker
echo "Starting data sync worker..."
cd /app/data-sync && node src/worker.js
'"'"' > /app/start.sh && chmod +x /app/start.sh

# Expose port for health check
EXPOSE 3001

# Health check
HEALTHCHECK --interval=60s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["/app/start.sh"]'

# Docs Dockerfile
create_dockerfile "docs" 'FROM swaggerapi/swagger-ui:v5.11.0

# Copy the OpenAPI specification
COPY swagger-ui/openapi.json /tmp/api.json

# Set environment variables for Swagger UI
ENV SWAGGER_JSON=/tmp/api.json
ENV BASE_URL=/api

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1'

echo -e "${GREEN}✅ Dockerfiles created${NC}"

# Create README files for each service
echo -e "${YELLOW}📚 Creating README files...${NC}"

for service in frontend backend database sync docs; do
    cat > "caprover-services/$service/README.md" << EOF
# $service Service

This is the $service service for the Electricity Prices NordPool application.

## Configuration

- **App Name**: $APP_PREFIX-$service
- **Port**: $(case $service in
    frontend) echo "80" ;;
    backend) echo "3000" ;;
    database) echo "5432" ;;
    sync) echo "3001" ;;
    docs) echo "8080" ;;
  esac)
- **Health Check**: $(case $service in
    frontend) echo "/" ;;
    backend) echo "/api/v1/health" ;;
    database) echo "PostgreSQL health check" ;;
    sync) echo "/health" ;;
    docs) echo "/api/" ;;
  esac)

## Deployment

1. Create app in CapRover: \`$APP_PREFIX-$service\`
2. Deploy from Git with this directory
3. Configure environment variables
4. Set up domain and SSL

## Dependencies

$(case $service in
    frontend) echo "- Backend API" ;;
    backend) echo "- Database" ;;
    database) echo "- None" ;;
    sync) echo "- Database" ;;
    docs) echo "- None" ;;
  esac)
EOF
done

echo -e "${GREEN}✅ README files created${NC}"

# Create deployment script
echo -e "${YELLOW}📜 Creating deployment script...${NC}"

cat > "caprover-services/deploy-all.sh" << 'EOF'
#!/bin/bash

# Multi-Service Deployment Script
# Deploy all services to CapRover in the correct order

set -e

echo "🚀 Deploying Electricity Prices NordPool - Multi-Service"
echo "=================================================="

# Configuration
DOMAIN="your-domain.com"
APP_PREFIX="electricity"

# Deployment order
services=("database" "backend" "sync" "docs" "frontend")

echo "📋 Deployment order:"
for i in "${!services[@]}"; do
    echo "  $((i+1)). ${services[$i]}"
done

echo ""
echo "⚠️  Please deploy services in the following order:"
echo ""

for service in "${services[@]}"; do
    echo "🔧 $service"
    echo "   App Name: $APP_PREFIX-$service"
    echo "   Directory: caprover-services/$service"
    echo "   Dependencies: $(case $service in
        frontend) echo "Backend, Docs" ;;
        backend) echo "Database" ;;
        database) echo "None" ;;
        sync) echo "Database" ;;
        docs) echo "None" ;;
      esac)"
    echo ""
done

echo "✅ Setup complete! Follow the deployment guide for detailed instructions."
EOF

chmod +x caprover-services/deploy-all.sh

echo -e "${GREEN}✅ Deployment script created${NC}"

# Display summary
echo -e "${BLUE}📊 Setup Summary${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Created service directories:${NC}"
ls -la caprover-services/
echo ""
echo -e "${GREEN}✅ Created configuration files:${NC}"
for service in frontend backend database sync docs; do
    echo "  - caprover-services/$service/captain-definition"
    echo "  - caprover-services/$service/Dockerfile.$service"
    echo "  - caprover-services/$service/README.md"
done
echo ""
echo -e "${GREEN}✅ Created deployment script:${NC}"
echo "  - caprover-services/deploy-all.sh"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update domain in configuration files"
echo "2. Deploy services in order: database → backend → sync → docs → frontend"
echo "3. Configure environment variables in CapRover"
echo "4. Set up domains and SSL certificates"
echo "5. Test service communication"
echo ""
echo -e "${BLUE}📚 Resources:${NC}"
echo "- Multi-Service Guide: ./documentation/CAPROVER_DEPLOYMENT.md"
echo "- CapRover Documentation: https://caprover.com/docs/"
echo "- Service READMEs: ./caprover-services/*/README.md"
echo ""
echo -e "${GREEN}🎉 Multi-service setup completed!${NC}" 