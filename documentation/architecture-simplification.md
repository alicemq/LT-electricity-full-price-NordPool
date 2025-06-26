# Architecture Simplification

## Overview

This document outlines the simplification of the Electricity Prices NordPool system architecture, moving from a 6-container to a 4-container setup by integrating cron jobs into the backend service.

## Problem Statement

### Original Architecture Issues
1. **Redundant containers**: Both `data-sync` and `worker` services used the same codebase
2. **No state persistence**: Worker didn't track when it last ran
3. **Complex orchestration**: 6 containers to manage and monitor
4. **Resource overhead**: Multiple containers running similar functionality
5. **Restart gaps**: After container restarts, no automatic catch-up sync

### Key Problems Addressed
- ✅ **Worker state management**: Now tracks last sync time in database
- ✅ **Startup sync checks**: Automatically runs catch-up sync if needed
- ✅ **Simplified deployment**: Reduced from 6 to 4 containers
- ✅ **Better monitoring**: Centralized sync status and logging
- ✅ **Manual sync triggers**: API endpoints for manual sync operations

## Architecture Changes

### Before (6 Containers)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Vue.js)      │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       ▲
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Data Sync     │    │   Worker        │
                       │   (Manual)      │    │   (Automated)   │
                       └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Swagger UI    │
                       │   (Docs)        │
                       └─────────────────┘
```

### After (4 Containers)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Vue.js)      │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│                 │    │   + Cron Jobs   │    │                 │
│                 │    │   + Sync Logic  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Swagger UI    │
                       │   (Docs)        │
                       └─────────────────┘
```

## Implementation Details

### New Backend Features

#### 1. Integrated Sync Worker (`backend/src/syncWorker.js`)
```javascript
class SyncWorker {
  // Startup sync check with last run time tracking
  async checkStartupSync() {
    const lastSync = await this.getLastSyncTime();
    if (hoursSinceLastSync > 2) {
      await this.runStartupSync();
    }
  }
  
  // Database-based last sync time tracking
  async getLastSyncTime() {
    const result = await pool.query(
      'SELECT MAX(completed_at) as last_sync FROM sync_log WHERE status = $1',
      ['success']
    );
    return result.rows[0]?.last_sync || null;
  }
}
```

#### 2. New API Endpoints
```javascript
// Sync status endpoint
GET /api/sync/status

// Manual sync trigger endpoint
POST /api/sync/trigger
{
  "country": "lt",
  "days": 1
}
```

#### 3. Enhanced Health Check
```javascript
GET /api/health
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "api": "running",
    "sync": {
      "isRunning": false,
      "jobs": ["All Countries", "Weekly Full Sync"],
      "currentTime": "2024-06-15 10:30:00"
    }
  }
}
```

### Removed Services

#### Data Sync Service
- **Purpose**: Manual data synchronization
- **Replacement**: Integrated into backend with API endpoints
- **Migration**: Manual sync now available via `POST /api/sync/trigger`

#### Worker Service
- **Purpose**: Automated cron jobs for data sync
- **Replacement**: Integrated into backend with enhanced state management
- **Migration**: Cron jobs now run in backend with startup sync checks

## Benefits

### 1. Simplified Operations
- **Fewer containers**: 6 → 4 containers
- **Easier monitoring**: Single service for sync operations
- **Reduced complexity**: Less orchestration overhead

### 2. Better State Management
- **Persistent state**: Last sync time stored in database
- **Startup recovery**: Automatic catch-up sync after restarts
- **Audit trail**: Complete sync history in database

### 3. Enhanced Monitoring
- **Real-time status**: Sync worker status via API
- **Manual control**: Trigger syncs via API endpoints
- **Better logging**: Centralized sync logs in database

### 4. Resource Efficiency
- **Reduced memory**: Fewer container overhead
- **Lower CPU**: Consolidated sync operations
- **Simplified networking**: Fewer inter-container communications

## Migration Guide

### For Existing Deployments

1. **Backup current data**:
   ```bash
   docker-compose exec db pg_dump -U electricity_user electricity_prices > backup.sql
   ```

2. **Stop current services**:
   ```bash
   docker-compose down
   ```

3. **Run migration script**:
   ```bash
   ./scripts/simplified-arch.sh
   ```

4. **Verify migration**:
   ```bash
   # Check service status
   docker-compose ps
   
   # Test sync functionality
   curl http://localhost/api/sync/status
   ```

### For New Deployments

1. **Clone and start**:
   ```bash
   git clone <repository>
   cd LT-electricity-full-price-NordPool
   ./scripts/prod.sh
   ```

2. **Verify functionality**:
   ```bash
   # Check health
   curl http://localhost/api/health
   
   # Check sync status
   curl http://localhost/api/sync/status
   ```

## Configuration

### Environment Variables

The backend now requires these additional environment variables:

```bash
# Elering API URL (for data sync)
ELERING_API_URL=https://dashboard.elering.ee/api/nps/price

# Database connection (existing)
DATABASE_URL=postgresql://electricity_user:electricity_password@db:5432/electricity_prices

# Node environment
NODE_ENV=production
```

### Dependencies

New backend dependencies added:

```json
{
  "node-cron": "^3.0.3",
  "node-fetch": "^3.3.2"
}
```

## Monitoring and Troubleshooting

### Sync Status Monitoring

```bash
# Check sync worker status
curl http://localhost/api/sync/status

# Trigger manual sync
curl -X POST http://localhost/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"country": "all", "days": 1}'
```

### Log Monitoring

```bash
# View backend logs (includes sync operations)
docker-compose logs -f backend

# View database logs
docker-compose logs -f db
```

### Database Queries

```sql
-- Check last sync time
SELECT MAX(completed_at) as last_sync 
FROM sync_log 
WHERE status = 'success';

-- View recent sync operations
SELECT sync_type, status, completed_at, duration_ms 
FROM sync_log 
ORDER BY completed_at DESC 
LIMIT 10;
```

## Future Considerations

### Potential Enhancements
1. **Sync metrics**: Add detailed sync performance metrics
2. **Alerting**: Notify on sync failures or delays
3. **Retry logic**: Implement exponential backoff for failed syncs
4. **Sync scheduling**: Allow dynamic cron schedule updates via API

### Scalability
- **Horizontal scaling**: Backend can be scaled horizontally with shared database
- **Load balancing**: Multiple backend instances can share sync workload
- **Database optimization**: Consider read replicas for high-traffic scenarios

## Conclusion

The architecture simplification successfully addresses the original problems while providing additional benefits:

- ✅ **Reduced complexity**: 6 → 4 containers
- ✅ **Better state management**: Persistent sync tracking
- ✅ **Enhanced monitoring**: Real-time sync status
- ✅ **Improved reliability**: Startup sync checks
- ✅ **Resource efficiency**: Lower overhead and better resource utilization

The new architecture maintains all existing functionality while providing a more maintainable and efficient system for electricity price monitoring. 