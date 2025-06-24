import axios from 'axios';
import moment from 'moment-timezone';

class EleringAPI {
  constructor() {
    this.baseURL = process.env.ELERING_API_URL || 'https://dashboard.elering.ee/api/nps/price';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  // Get date range for API calls using UTC (NordPool official timezone)
  getDateRangeForApi(date) {
    // Subtract one day for the start boundary
    const currentDate = moment.utc(date).subtract(1, 'days').startOf('day');
    const nextDay = moment.utc(date).startOf('day');
    
    // NordPool data is available from 22:00 UTC the previous day to 21:59 UTC the current day
    return {
      start: currentDate.set({ hour: 22, minute: 0, second: 0 }).format(),
      end: nextDay.set({ hour: 21, minute: 59, second: 59 }).format()
    };
  }

  // Fetch price data for a specific date
  async fetchPrices(date, country = 'lt') {
    try {
      const range = this.getDateRangeForApi(date);
      
      const params = {
        start: range.start,
        end: range.end
      };

      console.log(`Fetching prices for ${country} from ${range.start} to ${range.end} (UTC)`);
      
      const response = await this.client.get('', { params });
      
      if (response.data && response.data.data && response.data.data[country]) {
        return response.data.data[country];
      } else {
        console.warn(`No data found for country: ${country}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching prices from Elering API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Fetch prices for a date range (optimized for historical data)
  async fetchPricesForRange(startDate, endDate, country = 'lt') {
    const startMoment = moment.utc(startDate);
    const endMoment = moment.utc(endDate);
    
    // Calculate the difference in days
    const daysDiff = endMoment.diff(startMoment, 'days');
    
    // If more than 365 days, we need to split into multiple requests
    if (daysDiff > 365) {
      console.log(`Large date range detected (${daysDiff} days). Splitting into multiple requests...`);
      return await this.fetchLargeDateRange(startMoment, endMoment, country);
    }
    
    // For single day queries, use the proper NordPool time boundaries
    if (daysDiff === 0) {
      console.log(`Single day query detected, using NordPool time boundaries`);
      return await this.fetchPrices(startDate, country);
    }
    
    // For smaller ranges, use a single range request
    try {
      const params = {
        start: startMoment.set({ hour: 22, minute: 0, second: 0 }).format(),
        end: endMoment.set({ hour: 21, minute: 59, second: 59 }).format()
      };

      console.log(`Fetching range for ${country} from ${params.start} to ${params.end} (UTC)`);
      
      const response = await this.client.get('', { params });
      
      if (response.data && response.data.data && response.data.data[country]) {
        console.log(`Retrieved ${response.data.data[country].length} records for this range`);
        return response.data.data[country];
      } else {
        console.warn(`No data found for country: ${country} in this range`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching range from Elering API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Fetch large date ranges by splitting into year-long chunks
  async fetchLargeDateRange(startMoment, endMoment, country = 'lt') {
    const allPrices = [];
    let currentStart = moment.utc(startMoment);
    
    while (currentStart.isBefore(endMoment)) {
      // Calculate end date for this chunk (max 365 days)
      let currentEnd = moment.utc(currentStart).add(365, 'days');
      if (currentEnd.isAfter(endMoment)) {
        currentEnd = moment.utc(endMoment);
      }
      
      console.log(`Fetching chunk: ${currentStart.format('YYYY-MM-DD')} to ${currentEnd.format('YYYY-MM-DD')}`);
      
      try {
        const chunkPrices = await this.fetchYearChunk(currentStart, currentEnd, country);
        allPrices.push(...chunkPrices);
        
        // Add delay between large requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        currentStart = moment.utc(currentEnd).add(1, 'day');
      } catch (error) {
        console.error(`Error fetching chunk ${currentStart.format('YYYY-MM-DD')} to ${currentEnd.format('YYYY-MM-DD')}:`, error.message);
        currentStart = moment.utc(currentEnd).add(1, 'day');
      }
    }
    
    return allPrices;
  }

  // Fetch a year-long chunk of data
  async fetchYearChunk(startMoment, endMoment, country = 'lt') {
    try {
      const params = {
        start: startMoment.set({ hour: 22, minute: 0, second: 0 }).format(),
        end: endMoment.set({ hour: 21, minute: 59, second: 59 }).format()
      };

      console.log(`Fetching year chunk for ${country} from ${params.start} to ${params.end} (UTC)`);
      
      const response = await this.client.get('', { params });
      
      if (response.data && response.data.data && response.data.data[country]) {
        console.log(`Retrieved ${response.data.data[country].length} records for this chunk`);
        return response.data.data[country];
      } else {
        console.warn(`No data found for country: ${country} in this chunk`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching year chunk from Elering API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Fetch historical data from a specific start date to now
  async fetchHistoricalData(startDate, country = 'lt') {
    const startMoment = moment.utc(startDate);
    const endMoment = moment.utc();
    
    console.log(`Fetching historical data for ${country} from ${startMoment.format('YYYY-MM-DD')} to ${endMoment.format('YYYY-MM-DD')}`);
    
    return await this.fetchPricesForRange(startMoment.toDate(), endMoment.toDate(), country);
  }

  // Fetch data for a specific year
  async fetchYearData(year, country = 'lt') {
    const startDate = moment.utc(year, 0, 1); // January 1st
    const endDate = moment.utc(year, 11, 31); // December 31st
    
    console.log(`Fetching data for year ${year} (${country})`);
    
    return await this.fetchPricesForRange(startDate.toDate(), endDate.toDate(), country);
  }

  // Get the latest available timestamp from Elering API
  async getLatestTimestamp(country = 'lt') {
    try {
      const response = await this.client.get(`/${country.toUpperCase()}/latest`);
      
      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        return response.data.data[0].timestamp;
      } else {
        console.warn(`No latest timestamp found for country: ${country}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching latest timestamp from Elering API:', error.message);
      return null;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      const today = new Date();
      const prices = await this.fetchPrices(today, 'lt');
      console.log(`API test successful. Retrieved ${prices.length} price records for today (UTC).`);
      return true;
    } catch (error) {
      console.error('API test failed:', error.message);
      return false;
    }
  }

  // Get available countries
  getAvailableCountries() {
    return ['lt', 'ee', 'lv', 'fi'];
  }

  // Get the earliest available date
  getEarliestAvailableDate() {
    return '2012-07-01';
  }

  // Fetch data for all countries in a single API call
  async fetchAllCountriesData(startDate, endDate) {
    const startMoment = moment.utc(startDate);
    const endMoment = moment.utc(endDate);
    
    try {
      const params = {
        start: startMoment.set({ hour: 22, minute: 0, second: 0 }).format(),
        end: endMoment.set({ hour: 21, minute: 59, second: 59 }).format()
      };

      console.log(`Fetching data for all countries from ${params.start} to ${params.end} (UTC)`);
      
      const response = await this.client.get('', { params });
      
      if (response.data && response.data.data) {
        const countries = this.getAvailableCountries();
        let totalRecords = 0;
        
        for (const country of countries) {
          if (response.data.data[country]) {
            totalRecords += response.data.data[country].length;
            console.log(`${country.toUpperCase()}: ${response.data.data[country].length} records`);
          }
        }
        
        console.log(`Total records retrieved: ${totalRecords}`);
        return response.data.data;
      } else {
        console.warn('No data found in API response');
        return {};
      }
    } catch (error) {
      console.error('Error fetching all countries data from Elering API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}

export default EleringAPI; 