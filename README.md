# Electricity Prices NordPool

A modern, containerized electricity price monitoring system for Baltic countries (Lithuania, Estonia, Latvia, Finland) with automated data synchronization from the Elering NordPool API.

## 🚀 **Quick Start**

### **Prerequisites**
- Docker and Docker Compose
- Node.js 18+ (for development)

### **Start the System**

#### **Production Mode (Recommended)**
```bash
# Clone the repository
git clone <repository-url>
cd LT-electricity-full-price-NordPool

# Start in production mode (secure architecture)
./scripts/prod.sh

# Or manually:
docker-compose --env-file .env.production up -d --build
```

#### **Development Mode**
```bash
# Start in development mode (exposed services for debugging)
./scripts/dev.sh

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.development up -d --build
```

#### **CapRover Deployment (Cloud)**
```bash
# Prepare for CapRover deployment
./scripts/deploy-caprover.sh

# Follow the deployment instructions displayed by the script
# Or manually deploy using the CapRover web interface
```

### **Access the Application**

#### **Production Mode**
- **Frontend**: http://localhost:80 (Nginx with API proxy)
- **Backend**: Internal only (accessed via frontend proxy)
- **Database**: Internal only
- **Swagger UI**: http://localhost:80/api/ (API documentation)

#### **Development Mode**
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express with hot-reload)
- **Database**: localhost:5432
- **Swagger UI**: http://localhost:5173/api/ (API documentation)

#### **CapRover Deployment**
- **Frontend**: https://your-app-name.your-domain.com
- **API**: https://your-app-name.your-domain.com/api/v1/
- **Swagger UI**: https://your-app-name.your-domain.com/api/
- **Health Check**: https://your-app-name.your-domain.com/api/v1/health

## 📊 **System Overview**

### **Architecture**
- **Frontend**: Vue.js 3 application with Nginx proxy
- **Backend**: Node.js/Express API with integrated cron jobs
- **Database**: PostgreSQL with DST-aware timestamps
- **Swagger UI**: Interactive API documentation

### **Security Architecture**
- ✅ **Frontend proxy**: All API calls routed through frontend
- ✅ **Backend isolation**: Backend not exposed to internet
- ✅ **Database isolation**: Database not exposed to internet
- ✅ **Swagger UI isolation**: Swagger UI not exposed to internet
- ✅ **CORS handling**: Proper CORS configuration in proxy
- ✅ **Production hardening**: Security headers and optimizations

### **Features**
- ✅ **Multi-country support** (LT, EE, LV, FI)
- ✅ **Efficient data sync** (672 records in 478ms)
- ✅ **DST-aware timestamps** for electricity markets
- ✅ **Automated scheduling** during NordPool hours
- ✅ **Containerized deployment** for easy scaling
- ✅ **Historical data** from 2012-07-01 to present
- ✅ **Secure production architecture** with proxy routing
- ✅ **Interactive API documentation** with Swagger UI
- ✅ **Smart startup sync** with last run time tracking

## 🔧 **Services**

### **Database (PostgreSQL)**
- Stores historical price data with proper indexing
- DST-aware timestamp handling
- Sync logs and system configuration
- **Production**: Internal only, not exposed to internet

### **Backend API (Node.js/Express)**
- RESTful API endpoints for price data
- DST conversion for user-friendly display
- Error handling and validation
- **Integrated cron jobs** for automated data synchronization
- **Startup sync checks** to ensure data freshness
- **Manual sync triggers** via API endpoints
- **Production**: Internal only, accessed via frontend proxy

### **Frontend (Vue.js 3 + Nginx)**
- Reactive UI for price display
- Date range selection
- Multi-country data visualization
- **Production**: Acts as proxy to backend API
- **Development**: Vite dev server with proxy configuration

### **Swagger UI Service**
- Interactive API documentation and testing
- OpenAPI specification
- Auto-generated endpoint documentation
- Accessible at `/api/` through frontend proxy only (internal service)

## 📋 **Usage**

### **Manual Data Sync**
```bash
# Production mode - via API endpoint
curl -X POST http://localhost/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"country": "lt", "days": 1}'

# Development mode - via API endpoint
curl -X POST http://localhost:3000/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"country": "all", "days": 7}'

# Historical sync via API
curl -X POST http://localhost/api/sync/historical \
  -H "Content-Type: application/json" \
  -d '{"country": "lt", "startDate": "2024-01-01", "endDate": "2024-12-31"}'

# Year sync via API
curl -X POST http://localhost/api/sync/year \
  -H "Content-Type: application/json" \
  -d '{"country": "lt", "year": 2024}'

# All historical sync via API
curl -X POST http://localhost/api/sync/all-historical \
  -H "Content-Type: application/json" \
  -d '{"country": "lt"}'

# CLI usage (inside backend container)
docker-compose exec backend npm run cli all 7
docker-compose exec backend npm run cli historical lt 2024-01-01 2024-12-31
docker-compose exec backend npm run cli year 2024 lt
docker-compose exec backend npm run cli all-historical lt
docker-compose exec backend npm run cli test
docker-compose exec backend npm run cli status
```

### **Development Mode**
```bash
# Start in development mode
./scripts/dev.sh

# Frontend development (hot-reload)
cd electricity-prices-build && npm run dev

# Backend development (hot-reload)
cd backend && npm run dev

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### **API Endpoints**
All API endpoints are accessed through the frontend proxy:

```javascript
GET /api/v1/nps/prices/:date          // Single date prices
GET /api/v1/nps/prices/:start/:end    // Date range prices
GET /api/v1/nps/price/:country/latest // Latest price (Elering-style)
GET /api/v1/nps/price/:country/current // Current hour price
GET /api/v1/nps/price/ALL/latest      // Latest prices for all countries
GET /api/v1/nps/price/ALL/current     // Current hour prices for all countries
GET /api/v1/latest                    // Latest available prices
GET /api/v1/countries                 // Available countries
GET /api/v1/health                    // System health check
GET /api/sync/status                  // Sync worker status
POST /api/sync/trigger                // Manual sync trigger
POST /api/sync/historical             // Historical data sync
POST /api/sync/year                   // Year data sync
POST /api/sync/all-historical         // All historical data sync
GET /api/                             // Swagger UI documentation
GET /api/openapi.yaml                 // OpenAPI specification
```

**Country Codes**: `lt`, `ee`, `lv`, `fi`, `all` (case insensitive)

## 📈 **Performance**

### **Data Sync Performance**
- **Speed**: 672 records processed in 478ms (1.4 records/ms)
- **Efficiency**: Single API call for all 4 countries
- **Reliability**: 100% success rate with proper error handling
- **Smart startup**: Checks last sync time and runs catch-up if needed

### **API Performance**
- **Response Time**: < 100ms for typical queries
- **Throughput**: Handles concurrent requests efficiently
- **Caching**: Database-based caching eliminates external API calls
- **Proxy Overhead**: Minimal (< 5ms additional latency)

## 🏗 **Architecture**

### **Production Architecture (Simplified & Secure)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Nginx)                        │
│                    Port: 80 (Public)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Vue.js App    │  │   API Proxy     │  │   Swagger   │ │
│  │   (Static)      │  │   (/api/v1/*)   │  │   UI        │ │
│  │                 │  │                 │  │   (/api/)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Backend API   │
                       │   (Internal)    │
                       │   Port: 3000    │
                       │   + Cron Jobs   │
                       │   + Sync Logic  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (Internal)    │
                       │   Port: 5432    │
                       └─────────────────┘
```

### **Development Architecture (Exposed)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Vite)        │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│   Port: 5173    │    │   Port: 3000    │    │   Port: 5432    │
│                 │    │   + Cron Jobs   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔮 **Future Enhancements**

### **High Priority**
- [x] **Enhanced Swagger UI Integration - COMPLETED**
  - [x] Complete OpenAPI specification documentation
  - [x] Interactive API testing interface
  - [x] Auto-generated client SDKs
  - [x] Production-ready integration
  - [x] Enhanced documentation with rich descriptions

- [x] **Simplified Architecture - COMPLETED**
  - [x] Moved cron jobs to backend service
  - [x] Removed redundant data-sync and worker containers
  - [x] Added startup sync checks with last run time tracking
  - [x] Integrated manual sync triggers via API
  - [x] Reduced from 6 to 4 containers

- [ ] **PWA Features**
  - [ ] Service worker for offline functionality
  - [ ] App-like installation experience
  - [ ] Background data sync
  - [ ] Push notifications for price alerts
  - [ ] Offline data caching

- [ ] **Push Notifications**
  - [ ] Price alerts for expensive periods
  - [ ] Daily price summaries
  - [ ] System maintenance notifications
  - [ ] Custom alert thresholds
  - [ ] Notification preferences

### **Medium Priority**
- [ ] **Admin Panel**
  - [ ] Data management interface
  - [ ] Sync monitoring dashboard
  - [ ] System configuration
  - [ ] User management
  - [ ] Analytics dashboard

- [ ] **Advanced Analytics**
  - [ ] Price trend analysis
  - [ ] Usage statistics
  - [ ] Performance metrics
  - [ ] Historical data visualization
  - [ ] Price forecasting models

- [ ] **TypeScript Migration**
  - [ ] Type safety for all components
  - [ ] Better development experience
  - [ ] Reduced runtime errors
  - [ ] Enhanced IDE support
  - [ ] Strict type checking

### **Low Priority**
- [ ] **API Rate Limiting**
  - [ ] Implement rate limiting for public API
  - [ ] API key authentication
  - [ ] Usage tracking and quotas
  - [ ] Rate limit headers

- [ ] **GraphQL API**
  - [ ] GraphQL endpoint for flexible queries
  - [ ] Real-time subscriptions
  - [ ] Schema introspection
  - [ ] GraphQL playground

- [ ] **Mobile App**
  - [ ] React Native mobile application
  - [ ] Native push notifications
  - [ ] Offline data storage
  - [ ] Mobile-optimized UI

- [ ] **Machine Learning Integration**
  - [ ] Price prediction models
  - [ ] Anomaly detection
  - [ ] Pattern recognition
  - [ ] Automated insights

## 📊 **SDK Generation**

### **Available Client SDKs**
The system includes an automated SDK generation script that creates client libraries for multiple programming languages:

```bash
# Generate all SDKs
./scripts/generate-sdks.sh

# Generated SDKs will be available in:
# - generated-sdks/javascript/
# - generated-sdks/typescript/
# - generated-sdks/python/
# - generated-sdks/java/
# - generated-sdks/csharp/
# - generated-sdks/go/
# - generated-sdks/php/
```

### **Supported Languages**
- [x] **JavaScript/TypeScript** - Full type safety and Promise-based API
- [x] **Python** - Native Python client with type hints
- [x] **Java** - Maven-ready Java client library
- [x] **C#** - .NET client with async/await support
- [x] **Go** - Native Go client with context support
- [x] **PHP** - Composer-ready PHP client
- [ ] **Rust** - Native Rust client (planned)
- [ ] **Swift** - iOS/macOS client (planned)

## 📞 **Support**

### **Monitoring**
- Database sync logs for data integrity
- API response times and error rates
- Container health and resource usage
- Proxy performance metrics
- Sync worker status and last run times

### **Troubleshooting**

#### **Production Mode**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f

# Check sync status
curl http://localhost/api/sync/status

# Trigger manual sync
curl -X POST http://localhost/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"country": "all", "days": 1}'

# Restart services
docker-compose restart [service-name]

# Rebuild containers
docker-compose build --no-cache
```

#### **Development Mode**
```bash
# Check service status
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# View service logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Check sync status
curl http://localhost:3000/api/sync/status

# Restart services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart [service-name]
```

## 📄 **Documentation**

- [Project Planning](./documentation/project_planning.md) - Detailed project documentation
- [API Documentation](./electricity-prices-build/public/docs/swagger.yaml) - Swagger API specs
- [Interactive API Docs](./api/) - Swagger UI interface

## 🏆 **Migration Success**

### **What We Accomplished**
- ✅ **Complete migration** from PHP proxy to modern architecture
- ✅ **Efficient data sync** with 4x performance improvement
- ✅ **Multi-country support** with single API call optimization
- ✅ **Production-ready system** with automated scheduling
- ✅ **Containerized deployment** for easy scaling and maintenance
- ✅ **Secure production architecture** with frontend proxy routing
- ✅ **Development-friendly setup** with hot-reload and debugging
- ✅ **Interactive API documentation** with Swagger UI integration
- ✅ **Simplified architecture** with integrated cron jobs and smart startup sync

---

**Status**: ✅ Production Ready  
**Last Updated**: June 2024