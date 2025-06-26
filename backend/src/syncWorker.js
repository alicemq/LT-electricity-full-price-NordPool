import cron from 'node-cron';
import moment from 'moment-timezone';
import EleringAPI from './elering-api.js';
import { 
  testConnection, 
  getLatestTimestamp, 
  logSync,
  setInitialSyncComplete,
  isInitialSyncComplete,
  getInitialSyncStatus,
  getAllEarliestTimestamps,
  updateChunkCompletion,
  getLastCompletedChunk,
  markInitialSyncComplete
} from './database.js';
import pool from './database.js';

// Configure moment timezone
moment.tz.setDefault("Europe/Vilnius");

class SyncWorker {
  constructor() {
    this.api = new EleringAPI();
    this.isRunning = false;
    this.jobs = new Map();
    this.startTime = moment();
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
    this.nordPoolJobs = {};
    this.weeklySyncJob = null;
    this.nextDaySyncJob = null;
    this.dailySyncJobs = [];
  }

  // Start the worker
  async start() {
    console.log('Starting Electricity Prices Sync Worker...');
    console.log('Current timezone:', moment.tz().zoneName());
    console.log('Current time:', moment().format('YYYY-MM-DD HH:mm:ss'));
    
    this.startTime = moment();

    // Check if we need to run a startup sync
    await this.checkStartupSync();

    // Schedule daily sync that runs every 15 minutes from 12:45 to 16:00 UTC
    this.scheduleDailySync();
    
    // Schedule weekly full sync (every Sunday at 2 AM)
    this.scheduleWeeklySync('0 2 * * 0', 'Weekly Full Sync');

    // Schedule next day sync (every day at 13:30 CET - after NordPool publishes next day data)
    this.scheduleNextDaySync('30 13 * * *', 'Next Day Sync');

    // Start health monitoring
    this.startHealthMonitoring();

    // Historical data check is now optional and won't trigger additional syncs
    // await this.checkHistoricalDataPresence();

    console.log('Sync worker started successfully');
    console.log('Scheduled jobs:');
    const jobs = this.getScheduledJobs();
    jobs.forEach(job => {
      console.log(`- ${job.name}: ${job.description}`);
    });
  }

  // Start health monitoring (check every hour)
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60 * 60 * 1000); // Every hour

    // Perform initial health check
    this.performHealthCheck();
    
    console.log('Health monitoring started (every hour)');
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    try {
      this.lastHealthCheck = moment();
      console.log(`[Health Check] ${this.lastHealthCheck.format('YYYY-MM-DD HH:mm:ss')}`);
      
      const health = {
        timestamp: this.lastHealthCheck.toISOString(),
        uptime: moment.duration(moment().diff(this.startTime)).asHours(),
        database: await this.checkDatabaseHealth(),
        cronJobs: this.checkCronJobsHealth(),
        dataCompleteness: await this.checkDataCompleteness(),
        nextSync: await this.getNextSyncInfo()
      };

      // Log health status
      await this.logHealthStatus(health);

      // Check if any issues need attention
      const issues = this.analyzeHealthIssues(health);
      if (issues.length > 0) {
        console.log(`[Health Check] Issues detected: ${issues.join(', ')}`);
        await this.handleHealthIssues(issues, health);
      } else {
        console.log('[Health Check] All systems healthy');
      }

      return health;
    } catch (error) {
      console.error('[Health Check] Error during health check:', error);
      return { error: error.message };
    }
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      const result = await pool.query('SELECT 1 as health_check');
      const latestSync = await this.getLastSyncTime();
      
      return {
        connected: true,
        lastSync: latestSync,
        lastSyncAge: latestSync ? moment.duration(moment().diff(moment(latestSync))).asHours() : null
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Check cron jobs health
  checkCronJobsHealth() {
    const jobs = {};
    
    // Check daily sync job
    if (this.dailySyncJobs && this.dailySyncJobs.length > 0) {
      jobs['Daily Sync'] = {
        scheduled: this.dailySyncJobs.some(job => job.running),
        nextRun: this.dailySyncJobs.map(job => job.nextDate ? job.nextDate().toISOString() : null).filter(Boolean).sort()[0] || null
      };
    }
    
    // Check weekly sync job
    if (this.weeklySyncJob) {
      jobs['Weekly Sync'] = {
        scheduled: this.weeklySyncJob.running,
        nextRun: this.weeklySyncJob.nextDate ? this.weeklySyncJob.nextDate().toISOString() : null
      };
    }
    
    // Check next day sync job
    if (this.nextDaySyncJob) {
      jobs['Next Day Sync'] = {
        scheduled: this.nextDaySyncJob.running,
        nextRun: this.nextDaySyncJob.nextDate ? this.nextDaySyncJob.nextDate().toISOString() : null
      };
    }
    
    return jobs;
  }

  // Check data completeness
  async checkDataCompleteness() {
    try {
      const countries = ['lt', 'ee', 'lv', 'fi'];
      const completeness = {};
      
      for (const country of countries) {
        const latestTimestamp = await this.getLatestPriceTimestamp(country);
        if (!latestTimestamp) {
          completeness[country] = { hasData: false, latestHour: null, missingHours: null };
          continue;
        }

        const latestDate = moment.unix(latestTimestamp).tz('Europe/Vilnius');
        const now = moment().tz('Europe/Vilnius');
        const expectedLatest = now.clone().add(1, 'day').endOf('day'); // Should have tomorrow's data
        
        const missingHours = expectedLatest.diff(latestDate, 'hours');
        
        completeness[country] = {
          hasData: true,
          latestHour: latestDate.format('YYYY-MM-DD HH:mm'),
          missingHours: Math.max(0, missingHours),
          isUpToDate: missingHours <= 0
        };
      }
      
      return completeness;
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get next sync information
  async getNextSyncInfo() {
    const now = moment().tz('Europe/Vilnius');
    const nextNordPool = this.getNextNordPoolSyncTime();
    const nextWeekly = this.getNextWeeklySyncTime();
    const nextNextDay = this.getNextNextDaySyncTime();
    
    return {
      nordPool: nextNordPool,
      weekly: nextWeekly,
      nextDay: nextNextDay,
      nextSync: this.getEarliestTime([nextNordPool, nextWeekly, nextNextDay])
    };
  }

  // Analyze health issues
  analyzeHealthIssues(health) {
    const issues = [];
    
    // Database issues
    if (!health.database.connected) {
      issues.push('Database disconnected');
    }
    
    // Data completeness issues
    if (health.dataCompleteness) {
      Object.entries(health.dataCompleteness).forEach(([country, data]) => {
        if (data.error) {
          issues.push(`${country.toUpperCase()} data check failed`);
        } else if (!data.hasData) {
          issues.push(`${country.toUpperCase()} has no data`);
        } else if (data.missingHours > 24) {
          issues.push(`${country.toUpperCase()} missing ${data.missingHours} hours`);
        }
      });
    }
    
    // Check if we're in the active period for daily sync
    const now = moment().tz('UTC');
    const activeStart = moment().tz('UTC').set({ hour: 12, minute: 45, second: 0, millisecond: 0 });
    const activeEnd = moment().tz('UTC').set({ hour: 15, minute: 55, second: 0, millisecond: 0 });
    const isInActivePeriod = now.isBetween(activeStart, activeEnd, null, '[]'); // inclusive
    
    // Cron job issues - only report daily sync issues during active period
    Object.entries(health.cronJobs).forEach(([jobName, job]) => {
      if (!job.scheduled) {
        // Only report daily sync issues during active period
        if (jobName === 'Daily Sync' && !isInActivePeriod) {
          // Outside active period - daily sync not running is expected
          return;
        }
        // Report other job issues or daily sync issues during active period
        issues.push(`${jobName} cron job not running`);
      }
    });
    
    return issues;
  }

  // Handle health issues
  async handleHealthIssues(issues, health) {
    // If database is disconnected, try to reconnect
    if (issues.includes('Database disconnected')) {
      console.log('[Health Check] Attempting database reconnection...');
      // The database connection will be retried on next operation
    }
    
    // If data is missing, trigger a catch-up sync
    const missingDataIssues = issues.filter(issue => issue.includes('missing') || issue.includes('has no data'));
    if (missingDataIssues.length > 0) {
      console.log('[Health Check] Triggering catch-up sync due to missing data...');
      await this.triggerCatchUpSync();
    }
  }

  // Log health status
  async logHealthStatus(health) {
    try {
      await pool.query(
        `INSERT INTO sync_log (sync_type, status, records_processed, error_message, started_at, completed_at, duration_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'health_check',
          'success',
          0,
          JSON.stringify(health),
          this.lastHealthCheck.toDate(),
          moment().toDate(),
          moment().diff(this.lastHealthCheck)
        ]
      );
    } catch (error) {
      console.error('[Health Check] Failed to log health status:', error);
    }
  }

  // Check startup sync need
  async checkStartupSync() {
    console.log('[Startup Sync] Checking initial sync status...');
    
    // First sanity check: If DB doesn't say initial sync is complete, run initial sync
    const initialSyncStatus = await getInitialSyncStatus();
    if (initialSyncStatus.isComplete) {
      console.log(`[Startup Sync] Initial sync already completed to ${initialSyncStatus.completedDate} (${initialSyncStatus.recordsCount} records)`);
      console.log('[Startup Sync] Skipping further initial sync checks, proceeding with other tasks...');
      
      // Skip further initial sync checks, proceed with other tasks
      // Note: Recent data sync is now handled by daily sync logic
      return;
    }
    
    // Initial sync not complete - run full initial sync with chunk tracking
    console.log('[Startup Sync] Initial sync not complete, running full initial sync with chunk tracking...');
    
    try {
      const totalRecords = await this.runInitialSyncWithChunks();
      console.log(`[Startup Sync] Initial sync completed successfully: ${totalRecords} records`);
    } catch (error) {
      console.error('[Startup Sync] Error during initial sync:', error.message);
    }
  }

  // Run initial sync with chunk tracking
  async runInitialSyncWithChunks() {
    console.log('[Initial Sync] Starting chunked initial sync...');
    
    // Get last completed chunk to resume from there
    const lastChunk = await getLastCompletedChunk();
    let startDate = '2012-07-01';
    if (lastChunk && moment(lastChunk, 'YYYY-MM-DD', true).isValid()) {
      startDate = moment(lastChunk).add(1, 'day').format('YYYY-MM-DD');
    }
    const endDate = moment().add(2, 'days').format('YYYY-MM-DD');
    
    // Validate startDate and endDate
    if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
      console.error(`[Initial Sync] Invalid start or end date for chunking: startDate=${startDate}, endDate=${endDate}`);
      throw new Error('Invalid start or end date for chunked sync');
    }
    
    const chunks = this.splitToHalfYearChunks(startDate, endDate);
    
    console.log(`[Initial Sync] Processing ${chunks.length} chunks from ${startDate} to ${endDate}`);
    
    let totalRecords = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Validate chunk dates
      if (!chunk.start || !chunk.end || !moment(chunk.start, 'YYYY-MM-DD', true).isValid() || !moment(chunk.end, 'YYYY-MM-DD', true).isValid()) {
        console.error(`[Initial Sync] Invalid chunk dates: chunk ${i + 1}: start=${chunk.start}, end=${chunk.end}`);
        throw new Error('Invalid chunk date range');
      }
      console.log(`[Initial Sync] Processing chunk ${i + 1}/${chunks.length}: ${chunk.start} to ${chunk.end}`);
      
      try {
        const records = await this.syncAllCountriesHistorical(chunk.start, chunk.end);
        totalRecords += records;
        
        // Update chunk completion after each successful chunk
        await updateChunkCompletion(chunk.end, records);
        
        console.log(`[Initial Sync] Chunk ${i + 1} completed: ${records} records`);
        
        // Wait between chunks to avoid overwhelming the API
        if (i < chunks.length - 1) {
          console.log('[Initial Sync] Waiting 1 second before next chunk...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`[Initial Sync] Error in chunk ${i + 1}:`, error.message);
        throw error; // Stop the process if a chunk fails
      }
    }
    
    // Get the actual latest date from the database after all chunks are processed
    const actualLatestDate = await this.getActualLatestDataDate();
    const completionDate = actualLatestDate || (chunks.length > 0 ? chunks[chunks.length - 1].end : endDate);
    
    // Mark initial sync as complete with the actual latest date that has data
    await markInitialSyncComplete(completionDate, totalRecords);
    console.log(`[Initial Sync] All chunks completed. Total records: ${totalRecords}, completed to: ${completionDate}`);
    
    return totalRecords;
  }

  // Get the actual latest date with data from the database
  async getActualLatestDataDate() {
    try {
      const result = await pool.query(`
        SELECT MAX(timestamp) as latest_timestamp 
        FROM price_data
      `);
      
      if (result.rows[0] && result.rows[0].latest_timestamp) {
        const latestDate = moment.unix(result.rows[0].latest_timestamp).format('YYYY-MM-DD');
        console.log(`[Initial Sync] Actual latest data date from database: ${latestDate}`);
        return latestDate;
      }
      
      return null;
    } catch (error) {
      console.error('[Initial Sync] Error getting actual latest data date:', error.message);
      return null;
    }
  }

  // Check if a specific date is complete (has at least 22 records for all countries)
  async isDateComplete(date) {
    try {
      const startOfDay = moment(date).startOf('day').unix();
      const endOfDay = moment(date).endOf('day').unix();
      
      const result = await pool.query(`
        SELECT country, COUNT(*) as record_count
        FROM price_data 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY country
        ORDER BY country
      `, [startOfDay, endOfDay]);
      
      const countries = ['lt', 'ee', 'lv', 'fi'];
      const countryCounts = {};
      
      // Initialize counts for all countries
      countries.forEach(country => {
        countryCounts[country] = 0;
      });
      
      // Update with actual counts from database
      result.rows.forEach(row => {
        countryCounts[row.country] = parseInt(row.record_count, 10);
      });
      
      // Check if all countries have at least 22 records
      const isComplete = countries.every(country => countryCounts[country] >= 22);
      
      console.log(`[Date Complete Check] ${date}: ${JSON.stringify(countryCounts)} - Complete: ${isComplete}`);
      
      return {
        isComplete,
        countryCounts,
        date
      };
    } catch (error) {
      console.error(`[Date Complete Check] Error checking completeness for ${date}:`, error.message);
      return {
        isComplete: false,
        countryCounts: {},
        date,
        error: error.message
      };
    }
  }

  // Check if recent data needs syncing based on date completeness
  async checkRecentDataSyncByCompleteness() {
    console.log('[Recent Data Sync] Checking data completeness for recent dates...');
    
    const today = moment().format('YYYY-MM-DD');
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    
    // Check if yesterday is complete
    const yesterdayStatus = await this.isDateComplete(yesterday);
    
    if (!yesterdayStatus.isComplete) {
      console.log(`[Recent Data Sync] Yesterday (${yesterday}) is not complete. Running sync...`);
      try {
        await this.syncFromLastAvailable();
        console.log('[Recent Data Sync] Sync completed');
      } catch (error) {
        console.error('[Recent Data Sync] Error during sync:', error.message);
      }
    } else {
      console.log(`[Recent Data Sync] Yesterday (${yesterday}) is complete. No sync needed.`);
    }
    
    // Also check today's progress (for monitoring)
    const todayStatus = await this.isDateComplete(today);
    console.log(`[Recent Data Sync] Today (${today}) progress: ${JSON.stringify(todayStatus.countryCounts)}`);
  }

  // Simple sync from last available -1 day to today +2 days
  async syncFromLastAvailable() {
    // Use efficient sync for all countries
    return await this.syncAllCountriesEfficient();
  }

  // Sync price data for a specific date range with chunking for large ranges
  async syncPriceDataForRange(country, startDate, endDate) {
    try {
      const start = moment(startDate);
      const end = moment(endDate);
      const diffDays = end.diff(start, 'days');
      
      console.log(`Syncing ${country.toUpperCase()} data from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')} (${diffDays} days)`);
      
      // For large date ranges, use chunking strategy
      if (diffDays > 180) {
        console.log(`Large date range detected (${diffDays} days). Using half-year chunking...`);
        const chunks = this.splitToHalfYearChunks(startDate, endDate);
        let totalRecords = 0;
        
        for (const chunk of chunks) {
          console.log(`Processing chunk: ${chunk.start} to ${chunk.end}`);
          const records = await this.syncPriceDataChunk(country, chunk.start, chunk.end);
          totalRecords += records;
          
          // Add delay between chunks to avoid rate limits
          if (chunks.indexOf(chunk) < chunks.length - 1) {
            console.log('Waiting 1 second before next chunk...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log(`Chunked sync completed: ${totalRecords} total records for ${country.toUpperCase()}`);
        return totalRecords;
      } else {
        // For smaller ranges, sync directly
        return await this.syncPriceDataChunk(country, startDate, endDate);
      }
    } catch (error) {
      console.error(`Error syncing ${country.toUpperCase()}:`, error.message);
      throw error;
    }
  }

  // Sync a single chunk of price data
  async syncPriceDataChunk(country, startDate, endDate) {
    try {
      console.log(`Fetching ${country.toUpperCase()} data from ${moment(startDate).format('YYYY-MM-DD')} to ${moment(endDate).format('YYYY-MM-DD')}`);
      
      // Use fetchAllCountriesData to get data for all countries in one API call
      const allCountriesData = await this.api.fetchAllCountriesData(startDate, endDate);
      
      if (!allCountriesData || Object.keys(allCountriesData).length === 0) {
        console.log(`No data available for ${country.toUpperCase()} in this range`);
        return 0;
      }
      
      // Process data for the specific country
      const countryData = allCountriesData[country] || [];
      if (countryData.length === 0) {
        console.log(`No data available for ${country.toUpperCase()} in this range`);
        return 0;
      }
      
      const records = await this.insertPriceData(countryData, country);
      console.log(`Synced ${records} records for ${country.toUpperCase()}`);
      
      return records;
    } catch (error) {
      console.error(`Error syncing chunk for ${country.toUpperCase()}:`, error.message);
      throw error;
    }
  }

  // Trigger catch-up sync for health issues
  async triggerCatchUpSync() {
    if (this.isRunning) {
      console.log('[Catch-up Sync] Skipped - another sync is already running');
      return;
    }

    try {
      await this.logSync('catchup_sync', 'started', 0, 0, 0, 'Triggered by health check');
      await this.syncFromLastAvailable(); // Use simple sync logic
      await this.logSync('catchup_sync', 'completed', 0, 0, 0, 'Catch-up sync completed');
    } catch (error) {
      console.error('[Catch-up Sync] Failed:', error);
      await this.logSync('catchup_sync', 'error', 0, 0, 0, error.message);
    }
  }

  // Retry sync with exponential backoff
  async retrySync(daysBack, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Retry] Attempt ${attempt}/${maxRetries} for sync`);
        await this.syncFromLastAvailable(); // Use simple sync logic
        console.log(`[Retry] Sync completed successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        console.error(`[Retry] Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error(`[Retry] All ${maxRetries} attempts failed, giving up`);
          throw error;
        }
        
        // Exponential backoff: 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Retry] Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Get latest price timestamp for a country
  async getLatestPriceTimestamp(country) {
    return await getLatestTimestamp(country);
  }

  // Get last sync time from database
  async getLastSyncTime() {
    try {
      const result = await pool.query(
        'SELECT MAX(completed_at) as last_sync FROM sync_log WHERE status = $1',
        ['success']
      );
      return result.rows[0]?.last_sync || null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  // Schedule daily sync that runs every 5 minutes from 12:45 to 15:55 UTC
  scheduleDailySync() {
    // 12:45, 12:50, 12:55
    const cron1 = '45,50,55 12 * * *';
    // Every 5 minutes from 13:00 to 15:55
    const cron2 = '*/5 13-15 * * *';

    this.dailySyncJobs = [];

    // First job: 12:45, 12:50, 12:55
    this.dailySyncJobs.push(cron.schedule(cron1, async () => {
      console.log('[Daily Sync] (12:45-12:55) Running daily sync check...');
      try {
        await this.checkRecentDataSyncByCompleteness();
      } catch (error) {
        console.error('[Daily Sync] Error during daily sync:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    }));

    // Second job: every 5 minutes from 13:00 to 15:55
    this.dailySyncJobs.push(cron.schedule(cron2, async () => {
      console.log('[Daily Sync] (13:00-15:55) Running daily sync check...');
      try {
        await this.checkRecentDataSyncByCompleteness();
      } catch (error) {
        console.error('[Daily Sync] Error during daily sync:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    }));

    // Start both jobs
    this.dailySyncJobs.forEach(job => job.start());
    console.log(`[Daily Sync] Scheduled daily sync: 12:45,12:50,12:55 and every 5 min 13:00-15:55 UTC`);

    // Check for missed jobs on startup and run if needed
    this.checkForMissedDailySync();
  }

  // Check for missed daily sync jobs on container restart
  async checkForMissedDailySync() {
    try {
      const now = moment().tz('UTC');
      const today = now.format('YYYY-MM-DD');
      
      // Only check if we're in the active period (12:45-16:00 UTC)
      const activeStart = moment().tz('UTC').set({ hour: 12, minute: 45, second: 0, millisecond: 0 });
      const activeEnd = moment().tz('UTC').set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
      
      if (now.isBetween(activeStart, activeEnd)) {
        console.log('[Daily Sync] Container started during active period, checking for missed sync...');
        
        // Check if yesterday is complete
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        const yesterdayStatus = await this.isDateComplete(yesterday);
        
        if (!yesterdayStatus.isComplete) {
          console.log(`[Daily Sync] Yesterday (${yesterday}) is not complete. Running missed sync...`);
          await this.syncFromLastAvailable();
        } else {
          console.log(`[Daily Sync] Yesterday (${yesterday}) is complete. No missed sync needed.`);
        }
      } else {
        // Outside active period - just check once if we need to sync
        console.log('[Daily Sync] Outside active period, checking once if sync needed...');
        await this.checkOnceOutsideActivePeriod();
      }
    } catch (error) {
      console.error('[Daily Sync] Error checking for missed sync:', error.message);
    }
  }

  // Check once outside active period if sync is needed
  async checkOnceOutsideActivePeriod() {
    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      const yesterdayStatus = await this.isDateComplete(yesterday);
      
      if (!yesterdayStatus.isComplete) {
        console.log(`[Daily Sync] Yesterday (${yesterday}) is not complete. Running sync...`);
        await this.syncFromLastAvailable();
      } else {
        console.log(`[Daily Sync] Yesterday (${yesterday}) is complete. No sync needed.`);
      }
    } catch (error) {
      console.error('[Daily Sync] Error in outside period check:', error.message);
    }
  }

  // Schedule weekly full sync
  scheduleWeeklySync(cronExpression, description) {
    this.weeklySyncJob = cron.schedule(cronExpression, async () => {
      console.log(`[Weekly Sync] Running ${description}...`);
      
      try {
        await this.runWeeklySync(description);
      } catch (error) {
        console.error(`[Weekly Sync] Error during ${description}:`, error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Vilnius'
    });
    
    this.weeklySyncJob.start();
    console.log(`[Weekly Sync] Scheduled: ${cronExpression} (CET)`);
  }

  // Schedule next day sync
  scheduleNextDaySync(cronExpression, description) {
    this.nextDaySyncJob = cron.schedule(cronExpression, async () => {
      console.log(`[Next Day Sync] Running ${description}...`);
      
      try {
        await this.runNextDaySync(description);
      } catch (error) {
        console.error(`[Next Day Sync] Error during ${description}:`, error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Vilnius'
    });
    
    this.nextDaySyncJob.start();
    console.log(`[Next Day Sync] Scheduled: ${cronExpression} (CET)`);
  }

  // Run weekly sync
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
      
      await this.syncFromLastAvailable(); // Use simple sync logic
      
      const duration = Date.now() - startTime;
      console.log(`${description} completed in ${duration}ms`);
      
      // Log successful sync
      await this.logSync('weekly_sync', 'success', 0, 0, 0, null, duration);
      
    } catch (error) {
      console.error(`${description} failed:`, error.message);
      const duration = Date.now() - startTime;
      await this.logSync('weekly_sync', 'error', 0, 0, 0, error.message, duration);
    } finally {
      this.isRunning = false;
    }
  }

  // Run next day sync
  async runNextDaySync(description) {
    if (this.isRunning) {
      console.log(`${description} skipped - another sync is already running`);
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n=== Starting ${description} ===`);
      console.log(`Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      
      // Check if we need to sync next day data
      const needsNextDaySync = await this.checkNextDaySyncNeeded();
      
      if (needsNextDaySync) {
        await this.syncFromLastAvailable(); // Use simple sync logic
        console.log(`${description} completed - next day data synced`);
        await this.logSync('nextday_sync', 'success', 0, 0, 0, 'Next day data synced', Date.now() - startTime);
      } else {
        console.log(`${description} skipped - next day data already available`);
        await this.logSync('nextday_sync', 'skipped', 0, 0, 0, 'Next day data already available');
      }
      
    } catch (error) {
      console.error(`${description} failed:`, error.message);
      await this.logSync('nextday_sync', 'error', 0, 0, 0, error.message, Date.now() - startTime);
    } finally {
      this.isRunning = false;
    }
  }

  // Check if next day sync is needed
  async checkNextDaySyncNeeded() {
    try {
      const countries = ['lt', 'ee', 'lv', 'fi'];
      const now = moment().tz('Europe/Vilnius');
      const tomorrow = now.clone().add(1, 'day').startOf('day');
      const tomorrowLastHour = tomorrow.clone().add(23, 'hours');

      for (const country of countries) {
        const latestTimestamp = await this.getLatestPriceTimestamp(country);
        if (!latestTimestamp) {
          return true; // No data at all
        }

        const latestDate = moment.unix(latestTimestamp).tz('Europe/Vilnius');
        
        // Check if we have tomorrow's data up to the last hour
        if (latestDate.isBefore(tomorrowLastHour)) {
          return true; // Missing tomorrow's data
        }
      }
      
      return false; // All countries have complete tomorrow data
    } catch (error) {
      console.error('Error checking next day sync need:', error);
      return true; // Default to sync if check fails
    }
  }

  // Get next sync times
  getNextNordPoolSyncTime() {
    if (this.nordPoolJobs['all'] && this.nordPoolJobs['all'].nextDate) {
      return this.nordPoolJobs['all'].nextDate().toISOString();
    }
    return null;
  }

  getNextWeeklySyncTime() {
    if (this.weeklySyncJob && this.weeklySyncJob.nextDate) {
      return this.weeklySyncJob.nextDate().toISOString();
    }
    return null;
  }

  getNextNextDaySyncTime() {
    if (this.nextDaySyncJob && this.nextDaySyncJob.nextDate) {
      return this.nextDaySyncJob.nextDate().toISOString();
    }
    return null;
  }

  getEarliestTime(times) {
    const validTimes = times.filter(t => t !== null).map(t => moment(t));
    if (validTimes.length === 0) return null;
    return validTimes.reduce((earliest, current) => 
      current.isBefore(earliest) ? current : earliest
    ).toISOString();
  }

  // Sync all countries
  async syncAllCountries(daysBack = 1) {
    const countries = ['lt', 'ee', 'lv', 'fi'];
    let totalRecords = 0;
    
    for (const country of countries) {
      const records = await this.syncPriceData(country, daysBack);
      totalRecords += records;
    }
    
    return totalRecords;
  }

  // Sync price data for a specific country
  async syncPriceData(country, daysBack = 1) {
    try {
      const endDate = moment();
      const startDate = moment().subtract(daysBack, 'days');
      
      console.log(`Syncing ${country.toUpperCase()} data from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);
      
      // Use the proper Elering API client
      const priceData = await this.api.fetchPricesForRange(startDate.toDate(), endDate.toDate(), country);
      
      if (!priceData || priceData.length === 0) {
        console.log(`No data available for ${country.toUpperCase()}`);
        return 0;
      }
      
      const records = await this.insertPriceData(priceData, country);
      console.log(`Synced ${records} records for ${country.toUpperCase()}`);
      
      return records;
    } catch (error) {
      console.error(`Error syncing ${country.toUpperCase()}:`, error.message);
      
      // If it's a rate limit or temporary error, we might want to retry
      if (error.message.includes('429') || error.message.includes('503') || error.message.includes('502')) {
        console.log(`[DEBUG] Rate limit or temporary error detected, will retry later`);
      }
      
      throw error;
    }
  }

  // Insert price data into database
  async insertPriceData(priceData, country) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertQuery = `
        INSERT INTO price_data (timestamp, price, country, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (timestamp, country) DO UPDATE SET
          price = EXCLUDED.price,
          date = EXCLUDED.date,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      let insertedCount = 0;
      for (const data of priceData) {
        // Calculate UTC date from timestamp
        const date = new Date(data.timestamp * 1000).toISOString().slice(0, 10);
        await client.query(insertQuery, [data.timestamp, data.price, country, date]);
        insertedCount++;
      }
      
      await client.query('COMMIT');
      return insertedCount;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error inserting price data:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // Log sync operation
  async logSync(syncType, status, recordsProcessed = 0, recordsCreated = 0, recordsUpdated = 0, errorMessage = null, durationMs = null) {
    await logSync(syncType, status, recordsProcessed, recordsCreated, recordsUpdated, errorMessage, durationMs);
  }

  // Stop the worker
  stop() {
    console.log('Stopping Electricity Prices Sync Worker...');
    
    // Stop weekly sync job
    if (this.weeklySyncJob && this.weeklySyncJob.stop) {
      this.weeklySyncJob.stop();
      console.log('Stopped weekly sync job');
    }
    
    // Stop next day sync job
    if (this.nextDaySyncJob && this.nextDaySyncJob.stop) {
      this.nextDaySyncJob.stop();
      console.log('Stopped next day sync job');
    }
    
    // Stop daily sync jobs
    if (this.dailySyncJobs && this.dailySyncJobs.length > 0) {
      this.dailySyncJobs.forEach(job => job.stop());
      console.log('Stopped daily sync jobs');
    }
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('Stopped health monitoring');
    }
    
    this.isRunning = false;
    console.log('Sync worker stopped');
  }

  // Get scheduled job information
  getScheduledJobs() {
    const jobs = [];
    
    // Daily sync jobs
    if (this.dailySyncJobs && this.dailySyncJobs.length > 0) {
      jobs.push({
        name: 'Daily Sync',
        cron: '45,50,55 12 * * *; */5 13-15 * * *',
        timezone: 'UTC',
        description: 'Every 5 minutes from 12:45 to 15:55 UTC',
        running: this.dailySyncJobs.some(job => job.running),
        nextRun: this.dailySyncJobs.map(job => job.nextDate ? job.nextDate().toISOString() : null).filter(Boolean).sort()[0] || null
      });
    }
    
    // Weekly sync job
    if (this.weeklySyncJob) {
      jobs.push({
        name: 'Weekly Sync',
        cron: '0 2 * * 0',
        timezone: 'Europe/Vilnius',
        description: 'Every Sunday at 2 AM CET',
        running: this.weeklySyncJob.running,
        nextRun: this.weeklySyncJob.nextDate ? this.weeklySyncJob.nextDate().toISOString() : null
      });
    }
    
    // Next day sync job
    if (this.nextDaySyncJob) {
      jobs.push({
        name: 'Next Day Sync',
        cron: '30 13 * * *',
        timezone: 'Europe/Vilnius',
        description: 'Every day at 13:30 CET',
        running: this.nextDaySyncJob.running,
        nextRun: this.nextDaySyncJob.nextDate ? this.nextDaySyncJob.nextDate().toISOString() : null
      });
    }
    
    return jobs;
  }

  // Get sync worker status
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      lastHealthCheck: this.lastHealthCheck,
      scheduledJobs: this.getScheduledJobs(),
      currentSync: this.currentSync,
      syncInProgress: this.syncInProgress
    };
  }

  // Trigger manual sync
  async triggerManualSync(country = 'lt', daysBack = 1) {
    console.log(`Manual sync triggered for ${country}, ${daysBack} days back`);
    return await this.syncPriceData(country, daysBack);
  }

  // Enhanced historical data sync (for initial setup or data recovery)
  async syncHistoricalData(startDate, endDate, country = 'lt') {
    const startTime = Date.now();
    const start = moment(startDate);
    const end = moment(endDate);
    const diffDays = end.diff(start, 'days');
    
    try {
      console.log(`\n=== Historical sync for ${country.toUpperCase()} ===`);
      console.log(`Date range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')} (${diffDays} days)`);
      
      if (diffDays > 180) {
        console.log(`Large date range detected (${diffDays} days). Using half-year chunking...`);
        const chunks = this.splitToHalfYearChunks(startDate, endDate);
        let totalCreated = 0;
        
        for (const chunk of chunks) {
          console.log(`Processing chunk: ${chunk.start} to ${chunk.end}`);
          totalCreated += await this.syncHistoricalChunk(chunk.start, chunk.end, country);
          
          // Add delay between chunks to avoid rate limits
          if (chunks.indexOf(chunk) < chunks.length - 1) {
            console.log('Waiting 1 second before next chunk...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const duration = Date.now() - startTime;
        console.log(`Historical sync completed: ${totalCreated} records in ${duration}ms`);
        await this.logSync('historical_data', 'success', 0, totalCreated, 0, null, duration);
        return totalCreated;
      } else {
        return await this.syncHistoricalChunk(startDate, endDate, country);
      }
    } catch (error) {
      console.error('Historical sync failed:', error);
      const duration = Date.now() - startTime;
      await this.logSync('historical_data', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Enhanced historical sync for all countries in parallel
  async syncAllCountriesHistorical(startDate, endDate) {
    const startTime = Date.now();
    const start = moment(startDate);
    const end = moment(endDate);
    const diffDays = end.diff(start, 'days');
    const countries = ['lt', 'ee', 'lv', 'fi'];
    
    try {
      console.log(`\n=== Historical sync for ALL countries ===`);
      console.log(`Date range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')} (${diffDays} days)`);
      
      if (diffDays > 180) {
        console.log(`Large date range detected (${diffDays} days). Using half-year chunking...`);
        const chunks = this.splitToHalfYearChunks(startDate, endDate);
        let totalCreated = 0;
        
        for (const chunk of chunks) {
          console.log(`Processing chunk: ${chunk.start} to ${chunk.end}`);
          const chunkCreated = await this.syncHistoricalChunkAllCountries(chunk.start, chunk.end);
          totalCreated += chunkCreated;
          
          // Add delay between chunks to avoid rate limits
          if (chunks.indexOf(chunk) < chunks.length - 1) {
            console.log('Waiting 1 second before next chunk...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const duration = Date.now() - startTime;
        console.log(`Historical sync completed: ${totalCreated} records in ${duration}ms`);
        await this.logSync('historical_data_all', 'success', 0, totalCreated, 0, null, duration);
        return totalCreated;
      } else {
        return await this.syncHistoricalChunkAllCountries(startDate, endDate);
      }
    } catch (error) {
      console.error('Historical sync failed:', error);
      const duration = Date.now() - startTime;
      await this.logSync('historical_data_all', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Process a single historical chunk for all countries
  async syncHistoricalChunkAllCountries(startDate, endDate) {
    const startTime = Date.now();
    try {
      console.log(`Starting historical chunk sync for ALL countries from ${startDate} to ${endDate}`);
      
      // Use fetchAllCountriesData to get data for all countries in one API call
      const allCountriesData = await this.api.fetchAllCountriesData(startDate, endDate);
      
      if (!allCountriesData || Object.keys(allCountriesData).length === 0) {
        console.log('No historical data found for this chunk');
        return 0;
      }
      
      let totalRecords = 0;
      
      // Process data for all countries
      for (const country of Object.keys(allCountriesData)) {
        const countryData = allCountriesData[country];
        if (countryData && countryData.length > 0) {
          console.log(`Processing ${country.toUpperCase()}: ${countryData.length} records`);
          const recordsCreated = await this.insertPriceData(countryData, country);
          totalRecords += recordsCreated;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`Historical chunk sync completed: ${totalRecords} total records in ${duration}ms`);
      
      await this.logSync('historical_chunk_all', 'success', 0, totalRecords, 0, null, duration);
      return totalRecords;
    } catch (error) {
      console.error('Historical chunk sync failed:', error);
      const duration = Date.now() - startTime;
      await this.logSync('historical_chunk_all', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Process a single historical chunk
  async syncHistoricalChunk(startDate, endDate, country = 'lt') {
    const startTime = Date.now();
    try {
      console.log(`Starting historical chunk sync for ${country.toUpperCase()} from ${startDate} to ${endDate}`);
      
      // Use fetchAllCountriesData to get data for all countries in one API call
      const allCountriesData = await this.api.fetchAllCountriesData(startDate, endDate);
      
      if (!allCountriesData || Object.keys(allCountriesData).length === 0) {
        console.log('No historical data found for this chunk');
        return 0;
      }
      
      // Process data for the specific country
      const countryData = allCountriesData[country] || [];
      if (countryData.length === 0) {
        console.log(`No data available for ${country.toUpperCase()} in this range`);
        return 0;
      }
      
      const recordsCreated = await this.insertPriceData(countryData, country);
      const duration = Date.now() - startTime;
      console.log(`Historical chunk sync completed: ${recordsCreated} records in ${duration}ms`);
      
      await this.logSync('historical_chunk', 'success', countryData.length, recordsCreated, 0, null, duration);
      return recordsCreated;
    } catch (error) {
      console.error('Historical chunk sync failed:', error);
      const duration = Date.now() - startTime;
      await this.logSync('historical_chunk', 'error', 0, 0, 0, error.message, duration);
      throw error;
    }
  }

  // Sync data for a specific year
  async syncYearData(year, country = 'lt') {
    const startDate = moment.utc(year, 0, 1).format('YYYY-MM-DD');
    const endDate = moment.utc(year, 11, 31).format('YYYY-MM-DD');
    
    console.log(`\n=== Syncing data for year ${year} (${country.toUpperCase()}) ===`);
    return await this.syncHistoricalData(startDate, endDate, country);
  }

  // Sync all historical data from 2012-07-01
  async syncAllHistoricalData(country = 'lt') {
    const startDate = '2012-07-01';
    const endDate = moment().format('YYYY-MM-DD');
    
    console.log(`\n=== Syncing ALL historical data for ${country.toUpperCase()} ===`);
    console.log(`Date range: ${startDate} to ${endDate}`);
    console.log('This will take a significant amount of time...');
    
    return await this.syncHistoricalData(startDate, endDate, country);
  }

  // Sync multiple years
  async syncYearRange(startYear, endYear, country = 'lt') {
    console.log(`\n=== Syncing data for years ${startYear} to ${endYear} (${country.toUpperCase()}) ===`);
    
    let totalRecords = 0;
    
    for (let year = startYear; year <= endYear; year++) {
      try {
        console.log(`\n--- Syncing year ${year} ---`);
        const records = await this.syncYearData(year, country);
        totalRecords += records;
        
        // Add delay between years
        if (year < endYear) {
          console.log('Waiting 1 second before next year...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to sync year ${year}:`, error.message);
      }
    }
    
    console.log(`\nYear range sync completed: ${totalRecords} total records`);
    return totalRecords;
  }

  // Helper: split a date range into half-year chunks (Jan 1-Jun 30, Jul 1-Dec 31)
  splitToHalfYearChunks(startDate, endDate) {
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

  // Efficient sync for multiple countries (single API call if possible)
  async syncAllCountriesEfficient() {
    const countries = ['lt', 'ee', 'lv', 'fi'];
    const now = moment().tz('Europe/Vilnius');
    const targetEndDate = now.clone().add(2, 'days');
    const dataStart = moment('2012-07-01');
    
    console.log(`\n=== Efficient sync for all countries ===`);
    console.log(`Target range: ${dataStart.format('YYYY-MM-DD')} to ${targetEndDate.format('YYYY-MM-DD')}`);
    
    let totalRecords = 0;
    
    // Get the date range that needs syncing for all countries
    const syncRanges = {};
    
    for (const country of countries) {
      const latestTimestamp = await this.getLatestPriceTimestamp(country);
      let startDate;
      
      if (!latestTimestamp) {
        // No data, start from 2012-07-01
        startDate = dataStart.clone();
        console.log(`[Efficient Sync] ${country.toUpperCase()}: No data - starting from ${startDate.format('YYYY-MM-DD')}`);
      } else {
        // Start from last available -1 day
        const latestDate = moment.unix(latestTimestamp).tz('Europe/Vilnius');
        startDate = latestDate.clone().subtract(1, 'day').startOf('day');
        console.log(`[Efficient Sync] ${country.toUpperCase()}: Last data at ${latestDate.format('YYYY-MM-DD HH:mm')} - syncing from ${startDate.format('YYYY-MM-DD')}`);
      }
      
      syncRanges[country] = {
        start: startDate.toDate(),
        end: targetEndDate.toDate()
      };
    }
    
    // Find the earliest start date and latest end date to cover all countries
    const allStartDates = Object.values(syncRanges).map(range => moment(range.start));
    const allEndDates = Object.values(syncRanges).map(range => moment(range.end));
    
    const globalStartDate = moment.min(allStartDates);
    const globalEndDate = moment.max(allEndDates);
    const diffDays = globalEndDate.diff(globalStartDate, 'days');
    
    console.log(`[Efficient Sync] Global sync range: ${globalStartDate.format('YYYY-MM-DD')} to ${globalEndDate.format('YYYY-MM-DD')} (${diffDays} days)`);
    
    // Check if we need to use chunking (API limit is 1 year = 365 days)
    if (diffDays > 365) {
      console.log(`[Efficient Sync] Large date range detected (${diffDays} days). Using chunking to respect API 1-year limit...`);
      return await this.syncAllCountriesHistorical(globalStartDate.format('YYYY-MM-DD'), globalEndDate.format('YYYY-MM-DD'));
    }
    
    // Make a single API call to get data for the entire range (if under 1 year)
    try {
      const allCountriesData = await this.api.fetchAllCountriesData(globalStartDate.toDate(), globalEndDate.toDate());
      
      if (!allCountriesData || Object.keys(allCountriesData).length === 0) {
        console.log('[Efficient Sync] No data received from API');
        return 0;
      }
      
      // Store all countries' data from the single API response
      for (const country of Object.keys(allCountriesData)) {
        const countryData = allCountriesData[country];
        if (countryData && countryData.length > 0) {
          console.log(`[Efficient Sync] Storing ${country.toUpperCase()}: ${countryData.length} records`);
          const recordsCreated = await this.insertPriceData(countryData, country);
          totalRecords += recordsCreated;
        }
      }
      
      console.log(`[Efficient Sync] Completed: ${totalRecords} total records across all countries`);
      return totalRecords;
      
    } catch (error) {
      console.error(`[Efficient Sync] Error syncing all countries:`, error.message);
      throw error;
    }
  }

  // Check historical data coverage
  async checkHistoricalDataCoverage() {
    const expectedStart = moment('2012-07-01');
    const countries = ['lt', 'ee', 'lv', 'fi'];
    const earliestTimestamps = await getAllEarliestTimestamps();
    const countryEarliest = Object.fromEntries(countries.map(c => [c, null]));
    for (const row of earliestTimestamps) {
      countryEarliest[row.country] = row.earliest_timestamp ? moment.unix(row.earliest_timestamp) : null;
    }
    for (const country of countries) {
      const earliest = countryEarliest[country];
      if (!earliest || earliest.isAfter(expectedStart)) {
        console.warn(`[Startup Historical Check] ${country.toUpperCase()} missing historical data. Earliest: ${earliest ? earliest.format('YYYY-MM-DD') : 'none'}`);
        // Optionally trigger historical sync for missing range
        const startDate = expectedStart.format('YYYY-MM-DD');
        const endDate = earliest ? earliest.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
        console.log(`[Startup Historical Check] Triggering historical sync for ${country.toUpperCase()} from ${startDate} to ${endDate}`);
        await this.syncHistoricalData(startDate, endDate, country);
      } else {
        console.log(`[Startup Historical Check] ${country.toUpperCase()} has historical data from ${earliest.format('YYYY-MM-DD')}`);
      }
    }
  }

  // Enhanced startup sync: check for presence of initial day (2012-07-01) in DB and Elering API
  async checkHistoricalDataPresence() {
    const countries = ['lt', 'ee', 'lv', 'fi'];
    const initialDate = '2012-07-01';
    let allPresent = true;

    // Check DB for initial day for all countries
    const dbResults = await pool.query(
      'SELECT country, COUNT(*) as count FROM price_data WHERE date = $1 GROUP BY country',
      [initialDate]
    );
    const dbCounts = {};
    dbResults.rows.forEach(row => {
      dbCounts[row.country] = parseInt(row.count, 10);
    });

    // Check Elering API for initial day - single call for all countries
    let apiData = {};
    try {
      const response = await this.api.fetchAllCountriesData(initialDate, initialDate);
      if (response && typeof response === 'object') {
        // API returns data for all countries in one response
        Object.keys(response).forEach(country => {
          apiData[country] = Array.isArray(response[country]) ? response[country].length : 0;
        });
      }
    } catch (err) {
      console.error(`[Startup Sync] Error fetching initial day from Elering API:`, err.message);
    }

    // Compare DB vs API for each country
    for (const country of countries) {
      const dbCount = dbCounts[country] || 0;
      const apiCount = apiData[country] || 0;

      if (dbCount === 0 && apiCount > 0) {
        allPresent = false;
        console.warn(`[Startup Sync] Historical data missing for ${country.toUpperCase()} on ${initialDate}. Elering API has ${apiCount} records, but DB has ${dbCount}.`);
        // Don't trigger sync here - just log warning
      } else if (dbCount === 0 && apiCount === 0) {
        console.warn(`[Startup Sync] No historical data for ${country.toUpperCase()} on ${initialDate} in either DB or Elering API.`);
      } else {
        console.log(`[Startup Sync] Historical data present for ${country.toUpperCase()} on ${initialDate} (DB: ${dbCount}, API: ${apiCount})`);
      }
    }
    return allPresent;
  }
}

// Create singleton instance
const syncWorker = new SyncWorker();

// Export functions
export const startSyncWorker = () => syncWorker.start();
export const stopSyncWorker = () => syncWorker.stop();
export const getSyncStatus = () => syncWorker.getStatus();

// Export the worker instance for direct access
export default syncWorker; 