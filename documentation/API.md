# API Documentation

## Overview

The Electricity Prices NordPool API provides access to historical and current electricity price data for Baltic countries (Lithuania, Estonia, Latvia, Finland) with DST-aware timestamp handling.

**Base URL**: `http://localhost:3000/api`

## Authentication

Currently, the API does not require authentication for read operations.

## Endpoints

### 1. Health Check

```http
GET /api/health
```

**Example:**
```bash
curl "http://localhost:3000/api/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-24T14:32:39.024Z",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### 2. Get Available Countries

```http
GET /api/countries
```

**Example:**
```bash
curl "http://localhost:3000/api/countries"
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
GET /api/nps/price/:country/latest
```

**Parameters:**
- `country` (path, required): Country code (lt, ee, lv, fi)

**Example:**
```bash
curl "http://localhost:3000/api/nps/price/LT/latest"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0
    }
  ]
}
```

#### Get Current Price
```http
GET /api/nps/price/:country/current
```

**Parameters:**
- `country` (path, required): Country code (lt, ee, lv, fi)

**Example:**
```bash
curl "http://localhost:3000/api/nps/price/LT/current"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": 1750885200,
      "price": 75.0
    }
  ]
}
```

#### Get Price Data (Date Range)
```http
GET /api/nps/prices
```

**Parameters:**
- `date` (query, optional): Single date in YYYY-MM-DD format
- `start` (query, optional): Start date in YYYY-MM-DD format
- `end` (query, optional): End date in YYYY-MM-DD format
- `country` (query, optional): Country code (lt, ee, lv, fi). Default: lt

**Examples:**
```bash
# Single date
curl "http://localhost:3000/api/nps/prices?date=2025-06-24&country=lt"

# Date range
curl "http://localhost:3000/api/nps/prices?start=2025-06-20&end=2025-06-24&country=lt"
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

### 4. Compatibility Endpoints

#### Get Latest Prices (Legacy)
```http
GET /api/latest
```

**Parameters:**
- `country` (query, optional): Country code (lt, ee, lv, fi). Default: lt

**Example:**
```bash
curl "http://localhost:3000/api/latest?country=lt"
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
GET /api/prices
```

**Note**: This endpoint redirects to `/api/nps/prices` for backward compatibility.

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
- All data is stored in UTC for consistency
- Database queries use UTC timestamps

### API Responses
- **NordPool endpoints** (`/api/nps/*`): Return Unix timestamps (UTC)
- **Compatibility endpoints** (`/api/latest`, `/api/prices`): Return timezone-aware timestamps
- DST (Daylight Saving Time) is automatically handled

### Date Parameters
- Date parameters are interpreted in Europe/Vilnius timezone
- Use YYYY-MM-DD format for dates
- The API automatically handles DST transitions

## API Structure Comparison

### Elering API (Reference)
```
https://dashboard.elering.ee/api/nps/price/LT/latest
```

### Our API (Compatible)
```
http://localhost:3000/api/nps/price/LT/latest
```

### Additional Features
- **Current price endpoint**: `/api/nps/price/:country/current`
- **Date range queries**: `/api/nps/prices?start=2025-06-20&end=2025-06-24`
- **Multi-country support**: All Baltic countries (LT, EE, LV, FI)
- **Enhanced metadata**: Additional information in responses

## Rate Limiting

Currently, no rate limiting is implemented. However, it's recommended to:
- Cache responses when possible
- Use date ranges instead of multiple single-date requests
- Implement appropriate delays between requests in client applications

## Data Format

### Price Data Structure (NordPool endpoints)
```json
{
  "timestamp": 1750885200,  // Unix timestamp (UTC)
  "price": 75.0             // Price in EUR/MWh
}
```

### Price Data Structure (Compatibility endpoints)
```json
{
  "timestamp": 1750885200,  // Unix timestamp (Europe/Vilnius)
  "price": 75.0,            // Price in EUR/MWh
  "country": "lt"           // Country code
}
```

### Metadata Structure
```json
{
  "date": "2025-06-24",                      // Requested date
  "country": "lt",                           // Requested country
  "count": 24,                               // Number of records
  "timezone": "Europe/Vilnius"               // Response timezone
}
```

## Examples

### Frontend Integration (JavaScript)
```javascript
// Fetch latest price for Lithuania (Elering-style)
const response = await fetch('/api/nps/price/LT/latest');
const data = await response.json();

if (data.success) {
  const latestPrice = data.data[0];
  console.log(`Latest price: ${latestPrice.price} EUR/MWh at ${new Date(latestPrice.timestamp * 1000)}`);
}

// Fetch today's prices
const response = await fetch('/api/nps/prices?date=2025-06-24&country=lt');
const data = await response.json();

if (data.success) {
  data.data.lt.forEach(price => {
    console.log(`${new Date(price.timestamp * 1000)}: ${price.price} EUR/MWh`);
  });
}
```

### Historical Data Analysis
```javascript
// Fetch last week's prices
const response = await fetch('/api/nps/prices?start=2025-06-17&end=2025-06-24&country=lt');
const data = await response.json();

if (data.success) {
  const prices = data.data.lt;
  const avgPrice = prices.reduce((sum, price) => sum + price.price, 0) / prices.length;
  console.log(`Average price: ${avgPrice.toFixed(2)} EUR/MWh`);
}
```

## Migration Notes

### From Old API to New API
- **Old**: `/api/prices?date=2025-06-24`
- **New**: `/api/nps/prices?date=2025-06-24`
- **Backward compatibility**: Old endpoints redirect to new ones

### New Features
- **Latest price endpoint**: `/api/nps/price/:country/latest`
- **Current price endpoint**: `/api/nps/price/:country/current`
- **Enhanced error handling**: Consistent error codes and messages
- **Better metadata**: More detailed response information

## Support

For API support and questions:
- Check the health endpoint for system status
- Review the sync logs for data availability
- Monitor the worker service for automated sync status

---

**API Version**: 2.0  
**Last Updated**: June 2024  
**Compatibility**: Elering API compatible 