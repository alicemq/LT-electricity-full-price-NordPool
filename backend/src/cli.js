#!/usr/bin/env node

import moment from 'moment-timezone';
import syncWorker from './syncWorker.js';
import { testConnection } from './database.js';

// Configure moment timezone
moment.tz.setDefault("Europe/Vilnius");

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // Default: sync last 7 days for all countries
      console.log('Syncing last 7 days for all countries...');
      await syncWorker.syncAllCountries(7);
    } else if (args[0] === 'all') {
      // Sync all countries
      const daysBack = parseInt(args[1]) || 7;
      console.log(`Syncing all countries for last ${daysBack} days...`);
      await syncWorker.syncAllCountries(daysBack);
    } else if (args[0] === 'historical') {
      // Historical sync
      const country = args[1] || 'lt';
      const startDate = args[2] || moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = args[3] || moment().format('YYYY-MM-DD');
      console.log(`Historical sync for ${country} from ${startDate} to ${endDate}...`);
      await syncWorker.syncHistoricalData(startDate, endDate, country);
    } else if (args[0] === 'year') {
      // Sync specific year
      const year = parseInt(args[1]) || new Date().getFullYear();
      const country = args[2] || 'lt';
      console.log(`Syncing year ${year} for ${country}...`);
      await syncWorker.syncYearData(year, country);
    } else if (args[0] === 'years') {
      // Sync year range
      const startYear = parseInt(args[1]) || 2020;
      const endYear = parseInt(args[2]) || new Date().getFullYear();
      const country = args[3] || 'lt';
      console.log(`Syncing years ${startYear} to ${endYear} for ${country}...`);
      await syncWorker.syncYearRange(startYear, endYear, country);
    } else if (args[0] === 'all-historical') {
      // Sync all historical data from 2012-07-01
      const country = args[1] || 'lt';
      console.log(`Syncing ALL historical data for ${country}...`);
      await syncWorker.syncAllHistoricalData(country);
    } else if (args[0] === 'test') {
      // Test connections
      console.log('Testing database connection...');
      const dbOk = await testConnection();
      console.log('Database:', dbOk ? 'OK' : 'FAILED');
      
      console.log('Testing API connection...');
      const apiOk = await syncWorker.api.testConnection();
      console.log('API:', apiOk ? 'OK' : 'FAILED');
      
      console.log('Earliest available date:', syncWorker.api.getEarliestAvailableDate());
    } else if (args[0] === 'status') {
      // Show sync status
      const status = syncWorker.getStatus();
      console.log('Sync Worker Status:');
      console.log(JSON.stringify(status, null, 2));
    } else {
      // Custom sync
      const country = args[0];
      const daysBack = parseInt(args[1]) || 7;
      console.log(`Syncing ${country} for last ${daysBack} days...`);
      await syncWorker.syncPriceData(country, daysBack);
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