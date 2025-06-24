# API Documentation

## Overview

The Electricity Prices NordPool API provides access to historical and current electricity price data for Baltic countries (Lithuania, Estonia, Latvia, Finland) with DST-aware timestamp handling.

**Base URL**: 
- **Production**: `https://yourdomain.com/api/v1` (accessed through frontend proxy)
- **Development**: `http://localhost:5173/api/v1` (accessed through Vite proxy)

## Architecture

All API calls are routed through the frontend proxy:
- **Production**: Nginx serves frontend and proxies `/api/v1/*` requests to backend
- **Development**: Vite dev server proxies `/api/v1/*` requests to backend
- **Backend**: Internal only, not directly accessible from internet
- **Swagger UI**: Available at `/api/` through frontend proxy only (internal service)

## Authentication

Currently, the API does not require authentication for read operations.

## Endpoints

### 1. Health Check

```http
GET /api/v1/health
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/health"

# Development
curl "http://localhost:5173/api/v1/health"
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-06-24T14:32:39.024Z",
  "services": {
    "database": "connected",
    "api": "running",
    "version": "v1"
  }
}
```

### 2. Get Available Countries

```http
GET /api/v1/countries
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/countries"

# Development
curl "http://localhost:5173/api/v1/countries"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "code": "lt",
      "name": "Lithuania"
    },
    {
      "code": "ee",
      "name": "Estonia"
    },
    {
      "code": "lv",
      "name": "Latvia"
    },
    {
      "code": "fi",
      "name": "Finland"
    }
  ]
}
```

### 3. NordPool API Endpoints

#### Get Latest Price (Elering-style)

```http
GET /api/v1/nps/price/:country/latest
```

**Parameters:**

- `country` (path, required): Country code (lt, ee, lv, fi, all) - case insensitive

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/nps/price/LT/latest"

# Development
curl "http://localhost:5173/api/v1/nps/price/LT/latest"
```

**Response:**

```json
{
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0,
      "country": "LT"
    }
  ],
  "meta": {
    "countries": ["LT"],
    "date": "2025-06-26",
    "hour": "00:00",
    "timezone": "Europe/Vilnius",
    "timestamp_local": 1750885200,
    "price_unit": "EUR/MWh",
    "data_type": "latest_published"
  }
}
```

#### Get Current Price

```http
GET /api/v1/nps/price/:country/current
```

**Parameters:**

- `country` (path, required): Country code (lt, ee, lv, fi, all) - case insensitive

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/nps/price/LT/current"

# Development
curl "http://localhost:5173/api/v1/nps/price/LT/current"
```

**Response:**

```json
{
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0,
      "country": "LT"
    }
  ],
  "meta": {
    "countries": ["LT"],
    "date": "2025-06-26",
    "hour": "00:00",
    "timezone": "Europe/Vilnius",
    "timestamp_local": 1750885200,
    "price_unit": "EUR/MWh",
    "data_type": "current_hour",
    "current_time_local": "2025-06-26 00:15:30",
    "is_current_hour": true
  }
}
```

#### Get Price Data (Date Range)

```http
GET /api/v1/nps/prices
```

**Parameters:**

- `date` (query, optional): Single date in YYYY-MM-DD format
- `start` (query, optional): Start date in YYYY-MM-DD format
- `end` (query, optional): End date in YYYY-MM-DD format
- `country` (query, optional): Country code (lt, ee, lv, fi). Default: lt

**Examples:**

```bash
# Single date - Production
curl "https://yourdomain.com/api/v1/nps/prices?date=2025-06-24&country=lt"

# Single date - Development
curl "http://localhost:5173/api/v1/nps/prices?date=2025-06-24&country=lt"

# Date range - Production
curl "https://yourdomain.com/api/v1/nps/prices?start=2025-06-20&end=2025-06-24&country=lt"

# Date range - Development
curl "http://localhost:5173/api/v1/nps/prices?start=2025-06-20&end=2025-06-24&country=lt"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "lt": [
      {
        "timestamp": 1750885200,
        "price": 45.23
      },
      {
        "timestamp": 1750888800,
        "price": 42.15
      }
    ]
  },
  "meta": {
    "date": "2025-06-24",
    "country": "lt",
    "count": 24,
    "timezone": "Europe/Vilnius"
  }
}
```

### 4. All Countries Endpoints

#### Get Latest Prices for All Countries

```http
GET /api/v1/nps/price/all/latest
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/nps/price/all/latest"

# Development
curl "http://localhost:5173/api/v1/nps/price/all/latest"
```

**Response:**

```json
{
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0,
      "country": "LT"
    },
    {
      "timestamp": 1750885200,
      "price": 68.5,
      "country": "EE"
    },
    {
      "timestamp": 1750885200,
      "price": 72.1,
      "country": "LV"
    },
    {
      "timestamp": 1750885200,
      "price": 65.3,
      "country": "FI"
    }
  ],
  "meta": {
    "countries": ["LT", "EE", "LV", "FI"],
    "date": "2025-06-26",
    "hour": "00:00",
    "timezone": "Europe/Vilnius",
    "timestamp_local": 1750885200,
    "price_unit": "EUR/MWh",
    "data_type": "latest_published_all",
    "count": 4
  }
}
```

#### Get Current Prices for All Countries

```http
GET /api/v1/nps/price/all/current
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/nps/price/all/current"

# Development
curl "http://localhost:5173/api/v1/nps/price/all/current"
```

**Response:**

```json
{
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0,
      "country": "LT"
    },
    {
      "timestamp": 1750885200,
      "price": 68.5,
      "country": "EE"
    },
    {
      "timestamp": 1750885200,
      "price": 72.1,
      "country": "LV"
    },
    {
      "timestamp": 1750885200,
      "price": 65.3,
      "country": "FI"
    }
  ],
  "meta": {
    "countries": ["LT", "EE", "LV", "FI"],
    "date": "2025-06-26",
    "hour": "00:00",
    "timezone": "Europe/Vilnius",
    "timestamp_local": 1750885200,
    "price_unit": "EUR/MWh",
    "data_type": "current_hour_all",
    "current_time_local": "2025-06-26 00:15:30",
    "is_current_hour": true,
    "count": 4
  }
}
```

### 5. Compatibility Endpoints

#### Get Latest Prices (Legacy)

```http
GET /api/v1/latest
```

**Parameters:**

- `country` (query, optional): Country code (lt, ee, lv, fi). Default: lt

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/v1/latest?country=lt"

# Development
curl "http://localhost:5173/api/v1/latest?country=lt"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0,
      "country": "lt"
    }
  ],
  "meta": {
    "country": "lt",
    "count": 1,
    "timezone": "Europe/Vilnius",
    "last_updated": "2025-06-24T14:32:39.024Z"
  }
}
```

#### Get Price Data (Legacy - Redirects to new endpoint)

```http
GET /api/v1/prices
```

**Note**: This endpoint redirects to `/api/v1/nps/prices` for backward compatibility.

### 6. Documentation Endpoints

#### Swagger UI

```http
GET /api/
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/"

# Development
curl "http://localhost:5173/api/"
```

#### OpenAPI Specification

```http
GET /api/openapi.yaml
```

**Example:**

```bash
# Production
curl "https://yourdomain.com/api/openapi.yaml"

# Development
curl "http://localhost:5173/api/openapi.yaml"
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD",
  "code": "INVALID_DATE"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "No price data found for the specified country",
  "code": "NO_DATA_FOUND"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Database connection failed"
}
```

## Timezone Handling

### Data Storage

- All timestamps are stored in UTC in the database
- NordPool day boundaries: 22:00 UTC to 21:59 UTC (next day)
- DST transitions are handled automatically

### API Responses

- All timestamps in responses are converted to Europe/Vilnius timezone
- Metadata includes timezone information
- Current time comparisons use Europe/Vilnius timezone

## Country Codes

### Supported Countries
- `lt` - Lithuania
- `ee` - Estonia  
- `lv` - Latvia
- `fi` - Finland
- `all` - All countries (pseudo country for batch requests)

### Case Insensitivity
All country codes are case-insensitive:
- `LT`, `lt`, `Lt`, `lT` all work for Lithuania
- `ALL`, `all`, `All` all work for all countries

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## CORS

CORS is handled by the frontend proxy:
- **Production**: Nginx handles CORS headers
- **Development**: Vite proxy handles CORS headers

## Monitoring

### Proxy Logging
- **Development**: Vite proxy logs all API calls with timestamps
- **Production**: Nginx access logs for all requests
- **Format**: `[timestamp] Proxying: METHOD /path -> target`

### Health Monitoring
- Use `/api/v1/health` endpoint for system health checks
- Monitor proxy logs for API call patterns
- Check backend logs for error rates and response times

## Examples

### Frontend Integration

```javascript
// Using fetch API
const response = await fetch('/api/v1/nps/price/lt/latest');
const data = await response.json();

// Using axios
const response = await axios.get('/api/v1/nps/price/lt/latest');
const data = response.data;
```

### cURL Examples

```bash
# Get current prices for all countries
curl "https://yourdomain.com/api/v1/nps/price/all/current"

# Get historical data for Lithuania
curl "https://yourdomain.com/api/v1/nps/prices?date=2025-06-24&country=lt"

# Get latest price for Estonia
curl "https://yourdomain.com/api/v1/nps/price/ee/latest"

# Check system health
curl "https://yourdomain.com/api/v1/health"

# Access Swagger UI
curl "https://yourdomain.com/api/"
```

---

**Last Updated**: June 2024  
**Status**: ✅ **PRODUCTION READY** with secure proxy architecture 