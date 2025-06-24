# CapRover Deployment Guide

## 🚀 **Deploying Electricity Prices NordPool to CapRover**

This guide will help you deploy the Electricity Prices NordPool application to CapRover, a powerful and easy-to-use Docker application deployment platform.

## 📋 **Prerequisites**

### **CapRover Server Setup**
- [x] CapRover server installed and running
- [x] Domain configured and pointing to your CapRover server
- [x] SSL certificates configured (CapRover handles this automatically)
- [x] Access to CapRover web interface

### **Application Requirements**
- [x] Git repository with the application code
- [x] Docker and Docker Compose knowledge
- [x] PostgreSQL database (can be external or managed by CapRover)

## 🏗 **Deployment Options**

### **Option 1: Single Container Deployment (Recommended)**
Deploy the entire application as a single container with embedded services.

### **Option 2: Multi-Service Deployment**
Deploy each service separately for better scalability and management.

## 📦 **Option 1: Single Container Deployment**

### **Step 1: Prepare Your Repository**

1. **Clone your repository** to your local machine:
```bash
git clone <your-repository-url>
cd LT-electricity-full-price-NordPool
```

2. **Verify the configuration files** are present:
```bash
ls -la
# Should include:
# - captain-definition
# - Dockerfile.captain.simple
# - docker-compose.captain.yml
```

### **Step 2: Configure Environment Variables**

1. **Update the `captain-definition` file** with your specific values:
```json
{
  "environmentVariables": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://electricity_user:electricity_password@postgres:5432/electricity_prices",
    "ELERING_API_URL": "https://dashboard.elering.ee/api/nps/price",
    "FRONTEND_URL": "https://your-app-name.your-domain.com"
  }
}
```

2. **Replace placeholders**:
   - `your-app-name.your-domain.com` with your actual domain
   - Update database credentials if needed

### **Step 3: Deploy to CapRover**

1. **Access CapRover web interface**:
   - Navigate to `http://your-caprover-server:3000`
   - Login with your credentials

2. **Create a new app**:
   - Click "One-Click Apps" or "Apps"
   - Click "Create New App"
   - Enter your app name (e.g., `electricity-prices`)

3. **Configure the app**:
   - **App Name**: `electricity-prices` (or your preferred name)
   - **Has Persistent Data**: ✅ **Yes** (for database)
   - **Instance Count**: `1` (or more for scaling)
   - **Description**: `Electricity Prices NordPool - Baltic countries electricity price monitoring`

4. **Deploy from Git**:
   - Select "Deploy from Git"
   - Enter your Git repository URL
   - Set branch to `main` (or your default branch)
   - Click "Deploy"

5. **Monitor deployment**:
   - Watch the build logs for any errors
   - Wait for the health check to pass
   - Verify the app is running

### **Step 4: Configure Domain**

1. **Set up custom domain**:
   - Go to your app settings
   - Click "HTTP Settings"
   - Add your custom domain (e.g., `electricity.yourdomain.com`)
   - Enable "Force HTTPS"

2. **Update DNS**:
   - Point your domain to your CapRover server IP
   - Wait for DNS propagation

### **Step 5: Verify Deployment**

1. **Test the application**:
```bash
# Test health endpoint
curl https://your-app-name.your-domain.com/api/v1/health

# Test frontend
curl https://your-app-name.your-domain.com/

# Test Swagger UI
curl https://your-app-name.your-domain.com/api/
```

2. **Check logs**:
   - In CapRover web interface, go to your app
   - Click "Logs" to view application logs
   - Monitor for any errors or warnings

## 🏗 **Option 2: Multi-Service Deployment (Cluster)**

### **Overview**
Deploy each service as a separate CapRover app for better scalability, monitoring, and management.

### **Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Nginx)                        │
│                    App: electricity-frontend               │
│                    Port: 80 (Public)                       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Backend API   │
                       │   App: electricity-backend           │
                       │   Port: 3000 (Internal)             │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   App: electricity-postgres          │
                       │   Port: 5432 (Internal)             │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Data Sync     │
                       │   App: electricity-sync              │
                       │   Port: 3001 (Internal)             │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Swagger UI    │
                       │   App: electricity-docs              │
                       │   Port: 8080 (Internal)             │
                       └─────────────────┘
```

### **Step 1: Prepare Multi-Service Configuration**

1. **Create service-specific directories**:
```bash
mkdir -p caprover-services/{frontend,backend,database,sync,docs}
```

2. **Create frontend service configuration**:
```bash
# caprover-services/frontend/captain-definition
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.frontend",
  "buildArguments": {
    "NODE_ENV": "production"
  },
  "healthCheck": {
    "httpPath": "/",
    "httpPort": 80,
    "httpMethod": "GET",
    "initialDelaySeconds": 30,
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": 80,
    "httpAuth": false
  },
  "environmentVariables": {
    "NODE_ENV": "production",
    "BACKEND_URL": "https://electricity-backend.your-domain.com",
    "FRONTEND_URL": "https://electricity-frontend.your-domain.com"
  },
  "notExposeAsWebApp": false,
  "containerHttpPort": 80,
  "description": "Electricity Prices Frontend - Vue.js application with Nginx",
  "imageName": "electricity-frontend",
  "imageTag": "latest",
  "instanceCount": 1
}
```

3. **Create backend service configuration**:
```bash
# caprover-services/backend/captain-definition
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.backend",
  "buildArguments": {
    "NODE_ENV": "production"
  },
  "healthCheck": {
    "httpPath": "/api/v1/health",
    "httpPort": 3000,
    "httpMethod": "GET",
    "initialDelaySeconds": 30,
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": 3000,
    "httpAuth": false
  },
  "environmentVariables": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://electricity_user:electricity_password@electricity-postgres:5432/electricity_prices",
    "ELERING_API_URL": "https://dashboard.elering.ee/api/nps/price",
    "FRONTEND_URL": "https://electricity-frontend.your-domain.com"
  },
  "notExposeAsWebApp": false,
  "containerHttpPort": 3000,
  "description": "Electricity Prices Backend - Node.js/Express API",
  "imageName": "electricity-backend",
  "imageTag": "latest",
  "instanceCount": 2
}
```

4. **Create database service configuration**:
```bash
# caprover-services/database/captain-definition
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.database",
  "healthCheck": {
    "httpPath": "/health",
    "httpPort": 5432,
    "httpMethod": "GET",
    "initialDelaySeconds": 60,
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": 5432,
    "httpAuth": false
  },
  "environmentVariables": {
    "POSTGRES_DB": "electricity_prices",
    "POSTGRES_USER": "electricity_user",
    "POSTGRES_PASSWORD": "electricity_password"
  },
  "volumes": [
    {
      "containerPath": "/var/lib/postgresql/data",
      "hostPath": "/captain/data/electricity-postgres"
    }
  ],
  "notExposeAsWebApp": true,
  "containerHttpPort": 5432,
  "description": "Electricity Prices Database - PostgreSQL",
  "imageName": "electricity-postgres",
  "imageTag": "latest",
  "instanceCount": 1
}
```

5. **Create sync service configuration**:
```bash
# caprover-services/sync/captain-definition
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.sync",
  "buildArguments": {
    "NODE_ENV": "production"
  },
  "healthCheck": {
    "httpPath": "/health",
    "httpPort": 3001,
    "httpMethod": "GET",
    "initialDelaySeconds": 30,
    "intervalSeconds": 60,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": 3001,
    "httpAuth": false
  },
  "environmentVariables": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://electricity_user:electricity_password@electricity-postgres:5432/electricity_prices",
    "ELERING_API_URL": "https://dashboard.elering.ee/api/nps/price"
  },
  "notExposeAsWebApp": true,
  "containerHttpPort": 3001,
  "description": "Electricity Prices Data Sync - Automated data synchronization",
  "imageName": "electricity-sync",
  "imageTag": "latest",
  "instanceCount": 1
}
```

6. **Create docs service configuration**:
```bash
# caprover-services/docs/captain-definition
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.docs",
  "healthCheck": {
    "httpPath": "/",
    "httpPort": 8080,
    "httpMethod": "GET",
    "initialDelaySeconds": 30,
    "intervalSeconds": 30,
    "timeoutSeconds": 10,
    "maxRetries": 3
  },
  "expose": {
    "httpPort": 8080,
    "httpAuth": false
  },
  "environmentVariables": {
    "SWAGGER_JSON": "/tmp/api.json",
    "BASE_URL": "/api"
  },
  "notExposeAsWebApp": false,
  "containerHttpPort": 8080,
  "description": "Electricity Prices API Documentation - Swagger UI",
  "imageName": "electricity-docs",
  "imageTag": "latest",
  "instanceCount": 1
}
```

### **Step 2: Create Service-Specific Dockerfiles**

1. **Frontend Dockerfile** (`caprover-services/frontend/Dockerfile.frontend`):
```dockerfile
FROM nginx:alpine

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
CMD ["nginx", "-g", "daemon off;"]
```

2. **Backend Dockerfile** (`caprover-services/backend/Dockerfile.backend`):
```dockerfile
FROM node:18-alpine

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
RUN echo '#!/bin/sh\n\
# Wait for database\n\
echo "Waiting for database..."\n\
until pg_isready -h electricity-postgres -p 5432 -U electricity_user; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "Database is ready!"\n\
\n\
# Initialize database if needed\n\
if [ ! -f /app/database/initialized ]; then\n\
  echo "Initializing database..."\n\
  psql $DATABASE_URL -f /app/database/init/01_schema.sql\n\
  touch /app/database/initialized\n\
  echo "Database initialized!"\n\
fi\n\
\n\
# Start backend API\n\
echo "Starting backend API..."\n\
cd /app/backend && npm start\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["/app/start.sh"]
```

3. **Database Dockerfile** (`caprover-services/database/Dockerfile.database`):
```dockerfile
FROM postgres:15-alpine

# Copy initialization scripts
COPY database/init /docker-entrypoint-initdb.d

# Expose port
EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD pg_isready -U electricity_user -d electricity_prices || exit 1

# Start PostgreSQL
CMD ["postgres"]
```

4. **Sync Dockerfile** (`caprover-services/sync/Dockerfile.sync`):
```dockerfile
FROM node:18-alpine

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
RUN echo '#!/bin/sh\n\
# Wait for database\n\
echo "Waiting for database..."\n\
until pg_isready -h electricity-postgres -p 5432 -U electricity_user; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "Database is ready!"\n\
\n\
# Start data sync worker\n\
echo "Starting data sync worker..."\n\
cd /app/data-sync && node src/worker.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port for health check
EXPOSE 3001

# Health check
HEALTHCHECK --interval=60s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["/app/start.sh"]
```

5. **Docs Dockerfile** (`caprover-services/docs/Dockerfile.docs`):
```dockerfile
FROM swaggerapi/swagger-ui:v5.11.0

# Copy the OpenAPI specification
COPY swagger-ui/openapi.json /tmp/api.json

# Set environment variables for Swagger UI
ENV SWAGGER_JSON=/tmp/api.json
ENV BASE_URL=/api

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api || exit 1
```

### **Step 3: Deploy Services to CapRover**

1. **Deploy Database First**:
```bash
# Create database app
# App Name: electricity-postgres
# Deploy from Git with caprover-services/database directory
```

2. **Deploy Backend**:
```bash
# Create backend app
# App Name: electricity-backend
# Deploy from Git with caprover-services/backend directory
```

3. **Deploy Data Sync**:
```bash
# Create sync app
# App Name: electricity-sync
# Deploy from Git with caprover-services/sync directory
```

4. **Deploy Documentation**:
```bash
# Create docs app
# App Name: electricity-docs
# Deploy from Git with caprover-services/docs directory
```

5. **Deploy Frontend**:
```bash
# Create frontend app
# App Name: electricity-frontend
# Deploy from Git with caprover-services/frontend directory
```

### **Step 4: Configure Service Communication**

1. **Update Nginx Configuration** for frontend to proxy to backend:
```nginx
# In electricity-prices-build/nginx.conf
location /api/v1/ {
    proxy_pass https://electricity-backend.your-domain.com;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /api/ {
    proxy_pass https://electricity-docs.your-domain.com/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

2. **Configure Environment Variables** for each service:
   - **Frontend**: `BACKEND_URL`, `FRONTEND_URL`
   - **Backend**: `DATABASE_URL`, `ELERING_API_URL`, `FRONTEND_URL`
   - **Sync**: `DATABASE_URL`, `ELERING_API_URL`
   - **Database**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

### **Step 5: Configure Domains and SSL**

1. **Set up custom domains** for each service:
   - `electricity-frontend.your-domain.com`
   - `electricity-backend.your-domain.com`
   - `electricity-postgres.your-domain.com` (internal only)
   - `electricity-sync.your-domain.com` (internal only)
   - `electricity-docs.your-domain.com`

2. **Enable SSL** for all public-facing services

### **Step 6: Verify Multi-Service Deployment**

1. **Test each service individually**:
```bash
# Test frontend
curl https://electricity-frontend.your-domain.com/

# Test backend
curl https://electricity-backend.your-domain.com/api/v1/health

# Test docs
curl https://electricity-docs.your-domain.com/api/

# Test sync (internal)
curl https://electricity-sync.your-domain.com/health
```

2. **Test service communication**:
   - Frontend should proxy API calls to backend
   - Backend should connect to database
   - Sync should connect to database
   - All services should be healthy

## 🗄 **Database Configuration**

### **Option A: Use CapRover's Built-in PostgreSQL**

1. **Deploy PostgreSQL app**:
   - In CapRover, create a new app called `postgres`
   - Use the "PostgreSQL" one-click app
   - Set password and other configurations

2. **Update environment variables**:
   - Update `DATABASE_URL` in your app settings
   - Use the internal CapRover network name

### **Option B: Use External Database**

1. **Configure external PostgreSQL**:
   - Use a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)
   - Update `DATABASE_URL` with external connection string

2. **Update security groups**:
   - Allow connections from your CapRover server IP

## 🔧 **Configuration Options**

### **Environment Variables**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `ELERING_API_URL` | Elering API endpoint | `https://dashboard.elering.ee/api/nps/price` | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | - | Yes |

### **Health Check Configuration**

The application includes health checks:
- **Endpoint**: `/api/v1/health`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Retries**: 3

## 📊 **Monitoring and Logs**

### **Accessing Logs**

1. **CapRover Web Interface**:
   - Go to your app in CapRover
   - Click "Logs" tab
   - View real-time logs

2. **Command Line**:
```bash
# SSH into your CapRover server
ssh root@your-caprover-server

# View container logs
docker logs electricity_prices_app -f
```

### **Monitoring Endpoints**

- **Health Check**: `https://your-app.com/api/v1/health`
- **API Documentation**: `https://your-app.com/api/`
- **Frontend**: `https://your-app.com/`

## 🔄 **Updates and Maintenance**

### **Updating the Application**

1. **Push changes to Git**:
```bash
git add .
git commit -m "Update application"
git push origin main
```

2. **Redeploy in CapRover**:
   - Go to your app in CapRover
   - Click "Deploy" to trigger a new deployment
   - Monitor the build process

### **Database Migrations**

1. **Automatic migrations**:
   - The application automatically runs migrations on startup
   - Check logs for migration status

2. **Manual migrations**:
```bash
# Access the container
docker exec -it electricity_prices_app sh

# Run migrations manually
psql $DATABASE_URL -f /app/database/init/01_schema.sql
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**:
   - Check build logs in CapRover
   - Verify all files are present in repository
   - Check Dockerfile syntax

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check network connectivity
   - Ensure database is running

3. **Health Check Failures**:
   - Check application logs
   - Verify all services are starting correctly
   - Check port configurations

4. **SSL Issues**:
   - CapRover handles SSL automatically
   - Check domain configuration
   - Verify DNS settings

### **Debug Commands**

```bash
# Check container status
docker ps

# View container logs
docker logs electricity_prices_app

# Access container shell
docker exec -it electricity_prices_app sh

# Check network connectivity
docker exec electricity_prices_app ping postgres

# Test database connection
docker exec electricity_prices_app pg_isready -h postgres -p 5432
```

## 📈 **Scaling**

### **Horizontal Scaling**

1. **Increase instance count**:
   - In CapRover app settings
   - Increase "Instance Count"
   - Deploy to scale

2. **Load balancing**:
   - CapRover automatically handles load balancing
   - No additional configuration needed

### **Resource Limits**

1. **Memory limits**:
   - Set in CapRover app settings
   - Monitor usage in dashboard

2. **CPU limits**:
   - Configure in app settings
   - Adjust based on usage patterns

## 🔒 **Security Considerations**

### **Environment Variables**
- Never commit sensitive data to Git
- Use CapRover's environment variable management
- Rotate database passwords regularly

### **Network Security**
- Use HTTPS for all external access
- Configure firewall rules appropriately
- Monitor access logs

### **Database Security**
- Use strong passwords
- Limit database access to application only
- Regular security updates

## 📞 **Support**

### **CapRover Support**
- [CapRover Documentation](https://caprover.com/docs/)
- [CapRover GitHub](https://github.com/caprover/caprover)
- [CapRover Community](https://caprover.com/community.html)

### **Application Support**
- Check application logs for errors
- Review this deployment guide
- Check the main project documentation

---

**Last Updated**: June 2024  
**Status**: ✅ **Ready for Production Deployment** 