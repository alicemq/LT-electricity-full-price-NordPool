import cron from 'node-cron';
import moment from 'moment-timezone';
import DataSync from './sync.js';
import { logSync } from './database.js';

// Configure moment timezone
moment.tz.setDefault("Europe/Vilnius");

class SyncWorker {
  constructor() {
    this.sync = new DataSync();
    this.isRunning = false;
    this.jobs = new Map();
  }

  // Start the worker
  async start() {
    console.log('Starting Electricity Prices Sync Worker...');
    console.log('Current timezone:', moment.tz().zoneName());
    console.log('Current time:', moment().format('YYYY-MM-DD HH:mm:ss'));

    // Schedule NordPool-aware sync (every 30 minutes between 12:30-18:00 CET)
    this.scheduleNordPoolSync('all', 'All Countries');
    
    // Schedule weekly full sync (every Sunday at 2 AM)
    this.scheduleWeeklySync('0 2 * * 0', 'Weekly Full Sync');

    console.log('Sync worker started successfully');
    console.log('Scheduled jobs:');
    this.jobs.forEach((job, name) => {
      console.log(`- ${name}: ${job.cronTime}`);
    });
  }

  // Schedule daily sync for a specific country
  scheduleDailySync(country, cronExpression, description) {
    const job = cron.schedule(cronExpression, async () => {
      await this.runDailySync(country, description);
    }, {
      scheduled: true,
      timezone: "Europe/Vilnius"
    });

    this.jobs.set(description, job);
    console.log(`Scheduled ${description} sync: ${cronExpression}`);
  }

  // Schedule NordPool-aware sync (every 30 minutes between 12:30-18:00 CET)
  scheduleNordPoolSync(country, description) {
    // Every 30 minutes between 12:30 and 18:00 CET
    // This covers the period when NordPool announces clearing prices (12:45 CET onwards)
    const cronExpression = '30,0 12-17 * * *'; // Every 30 minutes from 12:30 to 17:59
    
    const job = cron.schedule(cronExpression, async () => {
      await this.runNordPoolSync(country, description);
    }, {
      scheduled: true,
      timezone: "Europe/Vilnius"
    });

    this.jobs.set(description, job);
    console.log(`Scheduled ${description} NordPool sync: ${cronExpression} (12:30-18:00 CET)`);
  }

  // Schedule weekly full sync
  scheduleWeeklySync(cronExpression, description) {
    const job = cron.schedule(cronExpression, async () => {
      await this.runWeeklySync(description);
    }, {
      scheduled: true,
      timezone: "Europe/Vilnius"
    });

    this.jobs.set(description, job);
    console.log(`Scheduled ${description}: ${cronExpression}`);
  }

  // Run daily sync for a specific country
  async runDailySync(country, description) {
    if (this.isRunning) {
      console.log(`${description} sync skipped - another sync is already running`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n=== Starting ${description} Daily Sync ===`);
      console.log(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      
      if (country === 'all') {
        await this.sync.syncAllCountries(1); // Last 1 day
      } else {
        await this.sync.syncPriceData(country, 1); // Last 1 day
      }
      
      const duration = Date.now() - startTime;
      console.log(`${description} daily sync completed in ${duration}ms`);
      
      // Log successful sync
      await logSync('daily_sync', 'success', 0, 0, 0, null, duration);
      
    } catch (error) {
      console.error(`${description} daily sync failed:`, error.message);
      const duration = Date.now() - startTime;
      await logSync('daily_sync', 'error', 0, 0, 0, error.message, duration);
    } finally {
      this.isRunning = false;
    }
  }

  // Run NordPool-aware sync
  async runNordPoolSync(country, description) {
    if (this.isRunning) {
      console.log(`${description} NordPool sync skipped - another sync is already running`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n=== Starting ${description} NordPool Sync ===`);
      console.log(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      console.log(`NordPool clearing prices typically announced at 12:45 CET or later`);
      
      if (country === 'all') {
        await this.sync.syncAllCountries(1); // Sync latest data for all countries
      } else {
        await this.sync.syncPriceData(country, 1); // Sync latest data for single country
      }
      
      const duration = Date.now() - startTime;
      console.log(`${description} NordPool sync completed in ${duration}ms`);
      
      // Log successful sync
      await logSync('nordpool_sync', 'success', 0, 0, 0, null, duration);
      
    } catch (error) {
      console.error(`${description} NordPool sync failed:`, error.message);
      const duration = Date.now() - startTime;
      await logSync('nordpool_sync', 'error', 0, 0, 0, error.message, duration);
    } finally {
      this.isRunning = false;
    }
  }

  // Run weekly full sync
  async runWeeklySync(description) {
    if (this.isRunning) {
      console.log(`${description} skipped - another sync is already running`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n=== Starting ${description} ===`);
      console.log(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      
      // Sync last 2 weeks for all countries (buffer to ensure no gaps)
      await this.sync.syncAllCountries(14);
      
      const duration = Date.now() - startTime;
      console.log(`${description} completed in ${duration}ms`);
      
      // Log successful sync
      await logSync('weekly_sync', 'success', 0, 0, 0, null, duration);
      
    } catch (error) {
      console.error(`${description} failed:`, error.message);
      const duration = Date.now() - startTime;
      await logSync('weekly_sync', 'error', 0, 0, 0, error.message, duration);
    } finally {
      this.isRunning = false;
    }
  }

  // Stop the worker
  stop() {
    console.log('Stopping sync worker...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    console.log('Sync worker stopped');
  }

  // Get worker status
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      currentTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      timezone: moment.tz().zoneName()
    };
  }

  // Manual trigger for testing
  async triggerManualSync(country = 'lt', daysBack = 1) {
    console.log(`Manual sync triggered for ${country} (${daysBack} days back)`);
    await this.runDailySync(country, `Manual ${country.toUpperCase()}`);
  }
}

// CLI interface for the worker
async function main() {
  const worker = new SyncWorker();
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // Start the worker
      await worker.start();
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        worker.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        worker.stop();
        process.exit(0);
      });
      
    } else if (args[0] === 'status') {
      // Show worker status
      const status = worker.getStatus();
      console.log('Worker Status:', JSON.stringify(status, null, 2));
      
    } else if (args[0] === 'manual') {
      // Manual sync trigger
      const country = args[1] || 'lt';
      const daysBack = parseInt(args[2]) || 1;
      await worker.triggerManualSync(country, daysBack);
      process.exit(0);
      
    } else if (args[0] === 'test') {
      // Test worker without starting cron jobs
      console.log('Testing worker...');
      await worker.triggerManualSync('lt', 1);
      process.exit(0);
      
    } else {
      console.log('Usage:');
      console.log('  node worker.js                    - Start the worker');
      console.log('  node worker.js status             - Show worker status');
      console.log('  node worker.js manual [country] [days] - Manual sync');
      console.log('  node worker.js test               - Test manual sync');
    }
  } catch (error) {
    console.error('Worker failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SyncWorker;