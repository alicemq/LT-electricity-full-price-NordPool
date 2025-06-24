import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import moment from 'moment-timezone';
import { getPriceData, getLatestPrice, getCurrentPrice, getAvailableCountries, getSettings, updateSetting, getCurrentHourPrice, getLatestPriceAll, getCurrentHourPriceAll } from './database.js';
import v1Router from './v1.js';

dotenv.config();

// Configure moment timezone for user-facing operations
moment.tz.setDefault("Europe/Vilnius");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://unpkg.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',  // Swagger UI
    'http://swagger-ui:8080'  // Swagger UI (Docker internal)
  ],
  credentials: true
}));
app.use(express.json());

// Mount v1 API router
app.use('/api/v1', v1Router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    timezone: 'Europe/Vilnius'
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'running'
    }
  });
});

// Get available countries
app.get('/api/countries', async (req, res) => {
  try {
    const countries = await getAvailableCountries();
    const countryData = countries.map(code => ({
      code,
      name: {
        'lt': 'Lithuania',
        'ee': 'Estonia',
        'lv': 'Latvia',
        'fi': 'Finland'
      }[code] || code.toUpperCase()
    }));
    
    res.json({
      success: true,
      data: countryData
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get latest price for a specific country (similar to Elering API)
app.get('/api/nps/price/:country/latest', async (req, res) => {
  try {
    const country = req.params.country.toLowerCase();
    
    if (country === 'all') {
      // Handle "all" pseudo country
      const latestPrices = await getLatestPriceAll();
      
      if (latestPrices.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'No price data found for any country',
          code: 'NO_DATA_FOUND'
        });
      }
      
      const data = latestPrices.map(price => ({
        timestamp: price.timestamp,
        price: parseFloat(price.price),
        country: price.country.toUpperCase()
      }));
      
      // Get the most recent timestamp for metadata
      const mostRecent = latestPrices.reduce((prev, current) => 
        (prev.timestamp > current.timestamp) ? prev : current
      );
      const priceDate = moment.unix(mostRecent.timestamp).tz("Europe/Vilnius");
      
      res.json({
        data,
        meta: {
          countries: latestPrices.map(p => p.country.toUpperCase()),
          date: priceDate.format('YYYY-MM-DD'),
          hour: priceDate.format('HH:00'),
          timezone: 'Europe/Vilnius',
          timestamp_local: priceDate.unix(),
          price_unit: 'EUR/MWh',
          data_type: 'latest_published_all',
          count: latestPrices.length
        }
      });
    } else {
      // Handle individual country
      const latestPrice = await getLatestPrice(country);
      
      if (!latestPrice) {
        return res.status(404).json({ 
          success: false,
          error: 'No price data found for the specified country',
          code: 'NO_DATA_FOUND'
        });
      }
      
      // Convert timestamp to Vilnius timezone for metadata
      const priceDate = moment.unix(latestPrice.timestamp).tz("Europe/Vilnius");
      
      res.json({
        data: [{
          timestamp: latestPrice.timestamp,
          price: parseFloat(latestPrice.price)
        }],
        meta: {
          country: country.toUpperCase(),
          date: priceDate.format('YYYY-MM-DD'),
          hour: priceDate.format('HH:00'),
          timezone: 'Europe/Vilnius',
          timestamp_local: priceDate.unix(),
          price_unit: 'EUR/MWh',
          data_type: 'latest_published'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching latest price:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get current price for a specific country (current hour in Europe/Vilnius)
app.get('/api/nps/price/:country/current', async (req, res) => {
  try {
    const country = req.params.country.toLowerCase();
    
    if (country === 'all') {
      // Handle "all" pseudo country
      const currentPrices = await getCurrentHourPriceAll();
      
      if (currentPrices.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'No price data found for the current hour',
          code: 'NO_DATA_FOUND'
        });
      }
      
      const data = currentPrices.map(price => ({
        timestamp: price.timestamp,
        price: parseFloat(price.price),
        country: price.country.toUpperCase()
      }));
      
      // Convert timestamp to Vilnius timezone for metadata
      const priceDate = moment.unix(currentPrices[0].timestamp).tz("Europe/Vilnius");
      const nowVilnius = moment().tz("Europe/Vilnius");
      
      res.json({
        data,
        meta: {
          countries: currentPrices.map(p => p.country.toUpperCase()),
          date: priceDate.format('YYYY-MM-DD'),
          hour: priceDate.format('HH:00'),
          timezone: 'Europe/Vilnius',
          timestamp_local: priceDate.unix(),
          price_unit: 'EUR/MWh',
          data_type: 'current_hour_all',
          current_time_local: nowVilnius.format('YYYY-MM-DD HH:mm:ss'),
          is_current_hour: nowVilnius.format('HH') === priceDate.format('HH'),
          count: currentPrices.length
        }
      });
    } else {
      // Handle individual country
      const currentPrice = await getCurrentHourPrice(country);
      
      if (!currentPrice) {
        return res.status(404).json({ 
          success: false,
          error: 'No price data found for the current hour',
          code: 'NO_DATA_FOUND'
        });
      }
      
      // Convert timestamp to Vilnius timezone for metadata
      const priceDate = moment.unix(currentPrice.timestamp).tz("Europe/Vilnius");
      const nowVilnius = moment().tz("Europe/Vilnius");
      
      res.json({
        data: [{
          timestamp: currentPrice.timestamp,
          price: parseFloat(currentPrice.price)
        }],
        meta: {
          country: country.toUpperCase(),
          date: priceDate.format('YYYY-MM-DD'),
          hour: priceDate.format('HH:00'),
          timezone: 'Europe/Vilnius',
          timestamp_local: priceDate.unix(),
          price_unit: 'EUR/MWh',
          data_type: 'current_hour',
          current_time_local: nowVilnius.format('YYYY-MM-DD HH:mm:ss'),
          is_current_hour: nowVilnius.format('HH') === priceDate.format('HH')
        }
      });
    }
  } catch (error) {
    console.error('Error fetching current price:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get price data for a specific date or date range (moved to /api/nps/prices)
app.get('/api/nps/prices', async (req, res) => {
  try {
    let { date, start, end, country = 'lt' } = req.query;
    country = country.toLowerCase();
    
    let startDate, endDate;

    if (date && date.trim() !== '') {
      // Single date query - query based on target timezone
      const userDate = moment.tz(date, "Europe/Vilnius").startOf('day');
      const userEndDate = moment.tz(date, "Europe/Vilnius").endOf('day');
      
      // Convert to UTC for database querying
      startDate = userDate.utc().format();
      endDate = userEndDate.utc().format();

      console.log(`Fetching prices for ${date} (${country}) - User timezone range: ${userDate.format('YYYY-MM-DD HH:mm:ss')} to ${userEndDate.format('YYYY-MM-DD HH:mm:ss')} (Vilnius)`);
      console.log(`Database query range: ${startDate} to ${endDate} (UTC)`);
    } else if (start && start.trim() !== '' && end && end.trim() !== '') {
      // Date range query - query based on target timezone
      const userStartDate = moment.tz(start, "Europe/Vilnius").startOf('day');
      const userEndDate = moment.tz(end, "Europe/Vilnius").endOf('day');
      
      // Convert to UTC for database querying
      startDate = userStartDate.utc().format();
      endDate = userEndDate.utc().format();
      
      console.log(`Fetching prices for range ${start} to ${end} (${country}) - User timezone range: ${userStartDate.format('YYYY-MM-DD HH:mm:ss')} to ${userEndDate.format('YYYY-MM-DD HH:mm:ss')} (Vilnius)`);
      console.log(`Database query range: ${startDate} to ${endDate} (UTC)`);
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Either date parameter or start/end parameters are required',
        code: 'INVALID_PARAMETERS'
      });
    }

    const priceData = await getPriceData(startDate, endDate, country);
    
    if (priceData.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No price data found for the specified date range',
        code: 'NO_DATA_FOUND'
      });
    }
    
    // Transform data to match frontend expectations and convert to local timezone
    const transformedData = priceData.map(item => ({
      timestamp: moment.unix(item.timestamp).tz("Europe/Vilnius").unix(),
      price: parseFloat(item.price)
    }));

    res.json({
      success: true,
      data: {
        [country]: transformedData
      },
      meta: {
        date: date || `${start} to ${end}`,
        country,
        count: transformedData.length,
        timezone: 'Europe/Vilnius'
      }
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Legacy endpoint for backward compatibility (redirects to new path)
app.get('/api/prices', async (req, res) => {
  // Redirect to the new endpoint
  const query = { ...req.query };
  if (query.country) query.country = query.country.toLowerCase();
  const queryString = new URLSearchParams(query).toString();
  res.redirect(`/api/nps/prices?${queryString}`);
});

// Get latest prices (compatibility endpoint)
app.get('/api/latest', async (req, res) => {
  try {
    const { country = 'lt' } = req.query;
    const latestPrice = await getLatestPrice(country);
    
    if (!latestPrice) {
      return res.status(404).json({ 
        success: false,
        error: 'No price data found for the specified country',
        code: 'NO_DATA_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: [{
        timestamp: moment.unix(latestPrice.timestamp).tz("Europe/Vilnius").unix(),
        price: parseFloat(latestPrice.price),
        country: latestPrice.country
      }],
      meta: {
        country,
        count: 1,
        timezone: 'Europe/Vilnius',
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching latest price:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update setting
app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    await updateSetting(key, value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price configurations
app.get('/api/configurations', async (req, res) => {
  try {
    const { date, zone, plan } = req.query;
    
    // This would query the price_configurations table
    // For now, return a placeholder response
    res.json({
      message: 'Price configurations endpoint - to be implemented'
    });
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
  console.log(`NordPool API: http://localhost:${PORT}/api/nps`);
}); 