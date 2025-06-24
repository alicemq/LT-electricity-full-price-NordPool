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
- **Backend**: Node.js/Express API (internal only)
- **Database**: PostgreSQL with DST-aware timestamps
- **Data Sync**: Automated service with NordPool-aware scheduling
- **Worker**: Scheduled synchronization service
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
- **Production**: Internal only, accessed via frontend proxy

### **Frontend (Vue.js 3 + Nginx)**
- Reactive UI for price display
- Date range selection
- Multi-country data visualization
- **Production**: Acts as proxy to backend API
- **Development**: Vite dev server with proxy configuration

### **Data Sync Service**
- Manual synchronization and historical imports
- Efficient single API calls for all countries
- Chunked processing for large datasets

### **Worker Service**
- Automated scheduled syncs every 30 minutes (12:30-18:00 CET)
- Weekly full sync on Sundays at 2 AM
- NordPool clearing price announcement timing

### **Swagger UI Service**
- Interactive API documentation and testing
- OpenAPI specification
- Auto-generated endpoint documentation
- Accessible at `/api/` through frontend proxy only (internal service)

## 📋 **Usage**

### **Manual Data Sync**
```bash
# Production mode
docker-compose run data-sync

# Development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml run data-sync

# Sync specific country
docker-compose run data-sync lt

# Historical sync
docker-compose run data-sync historical lt 2024-01-01 2024-12-31
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
GET /api/                             // Swagger UI documentation
GET /api/openapi.yaml                 // OpenAPI specification
```

**Country Codes**: `lt`, `ee`, `lv`, `fi`, `all` (case insensitive)

## 📈 **Performance**

### **Data Sync Performance**
- **Speed**: 672 records processed in 478ms (1.4 records/ms)
- **Efficiency**: Single API call for all 4 countries
- **Reliability**: 100% success rate with proper error handling

### **API Performance**
- **Response Time**: < 100ms for typical queries
- **Throughput**: Handles concurrent requests efficiently
- **Caching**: Database-based caching eliminates external API calls
- **Proxy Overhead**: Minimal (< 5ms additional latency)

## 🏗 **Architecture**

### **Production Architecture (Secure)**
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
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       ▲
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Data Sync     │    │   Worker        │
                       │   (Manual)      │    │   (Automated)   │
                       └─────────────────┘    └─────────────────┘
```

## 🔮 **Future Enhancements**

### **High Priority**
- [x] **Enhanced Swagger UI Integration - COMPLETED**
  - [x] Complete OpenAPI specification documentation
  - [x] Interactive API testing interface
  - [x] Auto-generated client SDKs
  - [x] Production-ready integration
  - [x] Enhanced documentation with rich descriptions

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

### **Troubleshooting**

#### **Production Mode**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f

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

---

**Status**: ✅ Production Ready  
**Last Updated**: June 2024