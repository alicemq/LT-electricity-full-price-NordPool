import moment from 'moment-timezone';
import EleringAPI from './elering-api.js';
import { 
  testConnection, 
  getLatestTimestamp, 
  insertPriceData, 
  logSync 
} from './database.js';

// Configure moment timezone
moment.tz.setDefault("Europe/Vilnius");

// Helper: split a date range into half-year chunks (Jan 1-Jun 30, Jul 1-Dec 31)
function splitToHalfYearChunks(startDate, endDate) {
  const chunks = [];
  let start = moment(startDate);
  const end = moment(endDate);
  
  while (start.isBefore(end)) {
    const year = start.year();
    let chunkEnd;
    
    // Determine which half of the year we're in
    if (start.month() < 6) {
      // First half: Jan 1 to Jun 30
      chunkEnd = moment([year, 5, 30]); // June 30 (month is 0-indexed)
    } else {
      // Second half: Jul 1 to Dec 31
      chunkEnd = moment([year, 11, 31]); // December 31
    }
    
    // Don't exceed the requested end date
    if (chunkEnd.isAfter(end)) {
      chunkEnd = moment(end);
    }
    
    chunks.push({
      start: start.format('YYYY-MM-DD'),
      end: chunkEnd.format('YYYY-MM-DD'),
    });
    
    // Move to the next half-year period
    start = chunkEnd.clone().add(1, 'day');
  }
  
  return chunks;
}

class DataSync {
  constructor() {
    this.api = new EleringAPI();
  }

  // Main sync function
  async syncPriceData(country = 'lt', daysBack = 7) {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let errorMessage = null;

    try {
      console.log(`Starting price data sync for ${country} (${daysBack} days back)`);

      // Test database connection
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Test API connection
      const apiConnected = await this.api.testConnection();
      if (!apiConnected) {
        throw new Error('Elering API connection failed');
      }

      // Get latest timestamp from Elering API
      const latestEleringTimestamp = await this.api.getLatestTimestamp(country);
      let startDate, endDate;

      if (latestEleringTimestamp) {
        // Fetch from 2 days before the latest available timestamp
        startDate = moment.unix(latestEleringTimestamp).subtract(2, 'days').startOf('day');
        endDate = moment.unix(latestEleringTimestamp).endOf('day');
      } else {
        // Fallback: fetch from daysBack days ago
        startDate = moment().subtract(daysBack, 'days').startOf('day');
        endDate = moment().add(2, 'days').endOf('day');
      }

      console.log(`Fetching data from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);

      // Fetch price data from API
      const priceData = await this.api.fetchPricesForRange(startDate.toDate(), endDate.toDate(), country);
      
      if (priceData.length === 0) {
        console.log('No new price data to sync');
        await logSync('price_data', 'success', 0, 0, 0, null, Date.now() - startTime);
        return;
      }

      // Transform data for database insertion
      const transformedData = priceData.map(item => ({
        timestamp: item.timestamp,
        price: parseFloat(item.price),
        country: country
      }));

      // Insert data into database
      recordsProcessed = transformedData.length;
      recordsCreated = await insertPriceData(transformedData);

      const duration = Date.now() - startTime;
      console.log(`Sync completed: ${recordsCreated} records processed in ${duration}ms`);

      // Log successful sync
      await logSync('price_data', 'success', recordsProcessed, recordsCreated, recordsUpdated, null, duration);

    } catch (error) {
      errorMessage = error.message;
      console.error('Sync failed:', error);
      
      const duration = Date.now() - startTime;
      await logSync('price_data', 'error', recordsProcessed, recordsCreated, recordsUpdated, errorMessage, duration);
      
      throw error;
    }
  }

  // Sync multiple countries efficiently with a single API call
  async syncAllCountriesEfficient(daysBack = 7) {
    const countries = this.api.getAvailableCountries();
    const startTime = Date.now();
    
    try {
      console.log(`\n=== Syncing all countries efficiently (${daysBack} days back) ===`);
      
      // Get the date range for the API call
      const endDate = moment().format('YYYY-MM-DD');
      const startDate = moment().subtract(daysBack, 'days').format('YYYY-MM-DD');
      
      console.log(`Fetching data from ${startDate} to ${endDate}`);
      
      // Make a single API call to get data for all countries
      const allData = await this.api.fetchAllCountriesData(startDate, endDate);
      
      let totalRecordsProcessed = 0;
      let totalRecordsCreated = 0;
      
      // Process each country's data
      for (const country of countries) {
        if (allData[country] && allData[country].length > 0) {
          console.log(`Processing ${country.toUpperCase()}: ${allData[country].length} records`);
          
          // Transform data for database insertion
          const transformedData = allData[country].map(item => ({
            timestamp: item.timestamp,
            price: parseFloat(item.price),
            country: country
          }));
          
          // Insert data into database
          const recordsCreated = await insertPriceData(transformedData);
          totalRecordsProcessed += transformedData.length;
          totalRecordsCreated += recordsCreated;
          
          console.log(`${country.toUpperCase()}: ${recordsCreated} records inserted`);
        } else {
          console.log(`${country.toUpperCase()}: No data available`);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`\nEfficient sync completed: ${totalRecordsCreated} records processed in ${duration}ms`);
      
      // Log successful sync
      await logSync('price_data_all', 'success', totalRecordsProcessed, totalRecordsCreated, 0, null, duration);
      
    } catch (error) {
      console.error('Efficient sync failed:', error);
      const duration = Date.now() - startTime;
      await logSync('price_data_all', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Sync multiple countries
  async syncAllCountries(daysBack = 7) {
    // Use the efficient method instead of individual calls
    await this.syncAllCountriesEfficient(daysBack);
  }

  // Historical data sync (for initial setup)
  async syncHistoricalData(startDate, endDate, country = 'lt') {
    const startTime = Date.now();
    const start = moment(startDate);
    const end = moment(endDate);
    const diffDays = end.diff(start, 'days');
    try {
      if (diffDays > 180) {
        console.log(`Long date range detected (${diffDays} days). Splitting into half-year chunks...`);
        const chunks = splitToHalfYearChunks(startDate, endDate);
        let totalCreated = 0;
        for (const chunk of chunks) {
          console.log(`Fetching chunk: ${chunk.start} to ${chunk.end}`);
          totalCreated += await this.syncHistoricalChunk(chunk.start, chunk.end, country);
        }
        const duration = Date.now() - startTime;
        console.log(`Historical sync completed: ${totalCreated} records in ${duration}ms`);
        return totalCreated;
      }
      return await this.syncHistoricalChunk(startDate, endDate, country);
    } catch (error) {
      console.error('Historical sync failed:', error);
      const duration = Date.now() - startTime;
      await logSync('historical_data', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Process a single historical chunk (no recursion)
  async syncHistoricalChunk(startDate, endDate, country = 'lt') {
    const startTime = Date.now();
    try {
      console.log(`Starting historical sync for ${country} from ${startDate} to ${endDate}`);
      const priceData = await this.api.fetchPricesForRange(startDate, endDate, country);
      if (priceData.length === 0) {
        console.log('No historical data found');
        return 0;
      }
      const transformedData = priceData.map(item => ({
        timestamp: item.timestamp,
        price: parseFloat(item.price),
        country: country
      }));
      const recordsCreated = await insertPriceData(transformedData);
      const duration = Date.now() - startTime;
      console.log(`Historical sync completed: ${recordsCreated} records in ${duration}ms`);
      await logSync('historical_data', 'success', priceData.length, recordsCreated, 0, null, duration);
      return recordsCreated;
    } catch (error) {
      console.error('Historical chunk sync failed:', error);
      const duration = Date.now() - startTime;
      await logSync('historical_data', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Sync data for a specific year
  async syncYearData(year, country = 'lt') {
    const startDate = moment.utc(year, 0, 1).format('YYYY-MM-DD');
    const endDate = moment.utc(year, 11, 31).format('YYYY-MM-DD');
    
    console.log(`Syncing data for year ${year} (${country})`);
    await this.syncHistoricalData(startDate, endDate, country);
  }

  // Sync all historical data from 2012-07-01
  async syncAllHistoricalData(country = 'lt') {
    const startDate = this.api.getEarliestAvailableDate();
    const endDate = moment().format('YYYY-MM-DD');
    
    console.log(`Syncing ALL historical data for ${country} from ${startDate} to ${endDate}`);
    console.log('This will take a significant amount of time...');
    
    await this.syncHistoricalData(startDate, endDate, country);
  }

  // Sync multiple years
  async syncYearRange(startYear, endYear, country = 'lt') {
    console.log(`Syncing data for years ${startYear} to ${endYear} (${country})`);
    
    for (let year = startYear; year <= endYear; year++) {
      try {
        console.log(`\n=== Syncing year ${year} ===`);
        await this.syncYearData(year, country);
        
        // Add delay between years
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Failed to sync year ${year}:`, error.message);
      }
    }
  }
}

// CLI interface
async function main() {
  const sync = new DataSync();
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // Default: sync last 7 days for all countries
      await sync.syncAllCountries(7);
    } else if (args[0] === 'all') {
      // Sync all countries
      const daysBack = parseInt(args[1]) || 7;
      await sync.syncAllCountries(daysBack);
    } else if (args[0] === 'historical') {
      // Historical sync
      const country = args[1] || 'lt';
      const startDate = args[2] || moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = args[3] || moment().format('YYYY-MM-DD');
      await sync.syncHistoricalData(startDate, endDate, country);
    } else if (args[0] === 'year') {
      // Sync specific year
      const year = parseInt(args[1]) || new Date().getFullYear();
      const country = args[2] || 'lt';
      await sync.syncYearData(year, country);
    } else if (args[0] === 'years') {
      // Sync year range
      const startYear = parseInt(args[1]) || 2020;
      const endYear = parseInt(args[2]) || new Date().getFullYear();
      const country = args[3] || 'lt';
      await sync.syncYearRange(startYear, endYear, country);
    } else if (args[0] === 'all-historical') {
      // Sync all historical data from 2012-07-01
      const country = args[1] || 'lt';
      await sync.syncAllHistoricalData(country);
    } else if (args[0] === 'test') {
      // Test connections
      console.log('Testing database connection...');
      const dbOk = await testConnection();
      console.log('Database:', dbOk ? 'OK' : 'FAILED');
      
      console.log('Testing API connection...');
      const apiOk = await sync.api.testConnection();
      console.log('API:', apiOk ? 'OK' : 'FAILED');
      
      console.log('Earliest available date:', sync.api.getEarliestAvailableDate());
    } else {
      // Custom sync
      const country = args[0];
      const daysBack = parseInt(args[1]) || 7;
      await sync.syncPriceData(country, daysBack);
    }
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DataSync; 