# Changelog

All notable changes to the Electricity Prices NordPool project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### 🚀 **Major Architecture Simplification**
- **BREAKING CHANGE**: Removed separate data-sync and worker containers
- **BREAKING CHANGE**: Integrated all cron jobs into the backend service
- **BREAKING CHANGE**: Reduced container count from 6 to 4 for simpler deployment
- **BREAKING CHANGE**: Updated all Docker images to use stable, pinned versions

### ✨ **Added**
- **Integrated Sync Worker**: Moved all sync functionality into backend service
- **Last Run Time Tracking**: Added comprehensive tracking of sync job execution times
- **Startup Sync Checks**: Backend now checks last sync time and runs catch-up if needed
- **Manual Sync API Endpoints**: 
  - `POST /api/sync/trigger` - Manual sync trigger
  - `POST /api/sync/historical` - Historical data sync
  - `POST /api/sync/year` - Year data sync
  - `POST /api/sync/all-historical` - All historical data sync
  - `GET /api/sync/status` - Sync worker status
- **Comprehensive CLI Commands**:
  - `npm run cli all <days>` - Sync all countries for specified days
  - `npm run cli historical <country> <startDate> <endDate>` - Historical sync
  - `npm run cli year <year> <country>` - Year sync
  - `npm run cli all-historical <country>` - All historical sync
  - `npm run cli test` - Test sync functionality
  - `npm run cli status` - Check sync status
- **Smart Startup Logic**: Backend automatically syncs missing data on startup
- **Enhanced Error Handling**: Improved error handling and logging for sync operations

### 🔧 **Technical Upgrades**
- **Node.js 20**: Upgraded all services from Node.js 18 to Node.js 20
- **PostgreSQL 16**: Upgraded database from PostgreSQL 15 to PostgreSQL 16-alpine
- **Vite 7+ Compatibility**: Fixed all Vite compatibility issues with Node.js 20
- **Dependency Updates**: Updated all npm packages to latest compatible versions
- **Docker Image Pinning**: Pinned all Docker images to stable versions:
  - `node:20-alpine` for all Node.js services
  - `postgres:16-alpine` for database
  - `nginx:stable-alpine` for frontend proxy
  - `swaggerapi/swagger-ui:latest` for API documentation

### 🐛 **Fixed**
- **Crypto Hash Errors**: Resolved Node.js version incompatibility with crypto module
- **Vite Build Errors**: Fixed Vite 7+ compatibility issues with Node.js 20
- **PostgreSQL Version Conflicts**: Resolved database initialization compatibility
- **Swagger UI Image**: Fixed missing `swaggerapi/swagger-ui:v5` tag issue
- **Missing Dependencies**: Added `node-cron` and `axios` packages to backend
- **API Client Issues**: Fixed incorrect URL structures for external API calls
- **NPM Dependency Conflicts**: Resolved version conflicts in frontend dependencies

### 🏗 **Architecture Changes**
- **Simplified Container Structure**:
  ```
  Before: 6 containers (frontend, backend, database, data-sync, worker, swagger-ui)
  After:  4 containers (frontend, backend, database, swagger-ui)
  ```
- **Integrated Cron Jobs**: All scheduled tasks now run within backend service
- **Improved State Management**: Better tracking of sync job states and last run times
- **Enhanced Monitoring**: Better visibility into sync operations and system health

### 📚 **Documentation Updates**
- **Updated README**: Comprehensive documentation of new architecture
- **API Documentation**: Added new sync endpoints to Swagger UI
- **CLI Documentation**: Added comprehensive CLI usage examples
- **Architecture Diagrams**: Updated to reflect simplified container structure
- **Troubleshooting Guide**: Enhanced with new sync management commands

### 🔒 **Security & Performance**
- **Maintained Security**: All security features preserved in simplified architecture
- **Improved Performance**: Reduced container overhead and improved resource utilization
- **Better Resource Management**: More efficient use of system resources
- **Enhanced Reliability**: Simplified architecture reduces failure points

### 🧪 **Testing & Validation**
- **End-to-End Testing**: Validated all sync operations work correctly
- **API Testing**: Confirmed all endpoints function as expected
- **CLI Testing**: Verified all CLI commands work properly
- **Performance Testing**: Confirmed no performance degradation from architecture changes

## [1.0.0] - 2024-06-XX

### ✨ **Initial Release**
- **Multi-country Support**: Lithuania, Estonia, Latvia, Finland
- **Automated Data Sync**: Integration with Elering NordPool API
- **Containerized Architecture**: Docker-based deployment
- **Vue.js Frontend**: Modern reactive UI
- **Express Backend**: RESTful API with DST handling
- **PostgreSQL Database**: Historical data storage
- **Swagger UI**: Interactive API documentation
- **Production Security**: Frontend proxy architecture
- **Development Tools**: Hot-reload and debugging support

---

## Version History

### Version 2.0.0 (Current)
- **Major architecture simplification**
- **Node.js 20 and PostgreSQL 16 upgrades**
- **Integrated cron jobs and sync management**
- **Enhanced CLI tools and monitoring**

### Version 1.0.0 (Previous)
- **Initial production-ready release**
- **Multi-container architecture**
- **Basic sync functionality**
- **Core API and frontend features**

---

## Migration Notes

### From Version 1.0.0 to 2.0.0
1. **Backup your data**: Always backup your database before upgrading
2. **Update Docker images**: Pull latest images with `docker-compose pull`
3. **Rebuild containers**: Run `docker-compose build --no-cache`
4. **Verify sync status**: Check `/api/sync/status` endpoint
5. **Test CLI commands**: Verify all new CLI functionality works

### Breaking Changes
- **Container names**: Some internal container names have changed
- **Sync behavior**: Sync jobs now run within backend service
- **API endpoints**: New sync management endpoints added
- **CLI interface**: New CLI commands available for sync management

---

**Note**: This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format and [Semantic Versioning](https://semver.org/) principles. 