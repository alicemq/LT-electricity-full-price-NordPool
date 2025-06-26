import pg from 'pg';
import dotenv from 'dotenv';
import moment from 'moment-timezone';

dotenv.config();

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://electricity_user:electricity_password@localhost:5432/electricity_prices',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

// Get price data for a specific date range
export async function getPriceData(startDate, endDate, country = 'lt') {
  try {
    // Validate and convert UTC date strings to timestamps for database querying
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.error('Invalid date format:', { startDate, endDate });
      return [];
    }
    
    const startTimestamp = Math.floor(startDateObj.getTime() / 1000);
    const endTimestamp = Math.floor(endDateObj.getTime() / 1000);
    
    const result = await pool.query(
      'SELECT timestamp, price, country FROM price_data WHERE country = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp',
      [country, startTimestamp, endTimestamp]
    );
    
    return result.rows;
  } catch (err) {
    console.error('Error getting price data:', err);
    return [];
  }
}

// Get latest price for a specific country
export async function getLatestPrice(country = 'lt') {
  try {
    const result = await pool.query(
      'SELECT timestamp, price, country FROM price_data WHERE country = $1 ORDER BY timestamp DESC LIMIT 1',
      [country]
    );
    
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting latest price:', err);
    return null;
  }
}

// Get current price (latest available price) for a specific country
export async function getCurrentPrice(country = 'lt') {
  try {
    const result = await pool.query(
      'SELECT timestamp, price, country FROM price_data WHERE country = $1 ORDER BY timestamp DESC LIMIT 1',
      [country]
    );
    
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting current price:', err);
    return null;
  }
}

// Get current price (for the current hour in Europe/Vilnius) for a specific country
export async function getCurrentHourPrice(country = 'lt') {
  try {
    // Get the current time in Europe/Vilnius and round to the start of the current hour
    const nowVilnius = moment().tz('Europe/Vilnius');
    const currentHourStart = nowVilnius.clone().startOf('hour');
    
    // Convert to UTC timestamp for database query
    const currentHourTimestamp = currentHourStart.unix();
    
    console.log(`Current hour query: ${currentHourStart.format('YYYY-MM-DD HH:mm:ss')} (${currentHourTimestamp})`);
    
    // Query for the price at this hour
    const result = await pool.query(
      'SELECT timestamp, price, country FROM price_data WHERE country = $1 AND timestamp = $2 LIMIT 1',
      [country, currentHourTimestamp]
    );
    
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error getting current hour price:', err);
    return null;
  }
}

// Get available countries
export async function getAvailableCountries() {
  try {
    const result = await pool.query(
      'SELECT DISTINCT country FROM price_data ORDER BY country'
    );
    
    return result.rows.map(row => row.country);
  } catch (err) {
    console.error('Error getting available countries:', err);
    return ['lt', 'ee', 'lv', 'fi']; // Fallback to known countries
  }
}

// Get settings
export async function getSettings() {
  try {
    const result = await pool.query('SELECT setting_key, setting_value FROM user_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  } catch (err) {
    console.error('Error getting settings:', err);
    return {};
  }
}

// Update setting
export async function updateSetting(key, value) {
  try {
    await pool.query(
      'UPDATE user_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2',
      [value, key]
    );
  } catch (err) {
    console.error('Error updating setting:', err);
    throw err;
  }
}

// Get price configurations for a specific date
export async function getPriceConfigurations(date, zone, plan) {
  try {
    const result = await pool.query(
      `SELECT time_period, price 
       FROM price_configurations 
       WHERE effective_date <= $1 
       AND zone_name = $2 
       AND plan_name = $3
       ORDER BY effective_date DESC
       LIMIT 1`,
      [date, zone, plan]
    );
    
    return result.rows;
  } catch (err) {
    console.error('Error getting price configurations:', err);
    return [];
  }
}

// Get system charges for a specific date
export async function getSystemCharges(date) {
  try {
    const result = await pool.query(
      `SELECT charge_type, amount 
       FROM system_charges 
       WHERE effective_date <= $1
       ORDER BY effective_date DESC`,
      [date]
    );
    
    const charges = {};
    result.rows.forEach(row => {
      charges[row.charge_type] = row.amount;
    });
    
    return charges;
  } catch (err) {
    console.error('Error getting system charges:', err);
    return {};
  }
}

// Get latest price for all countries
export async function getLatestPriceAll() {
  try {
    const result = await pool.query(
      'SELECT DISTINCT ON (country) timestamp, price, country FROM price_data ORDER BY country, timestamp DESC'
    );
    
    return result.rows;
  } catch (err) {
    console.error('Error getting latest prices for all countries:', err);
    return [];
  }
}

// Get current hour price for all countries
export async function getCurrentHourPriceAll() {
  try {
    // Get the current time in Europe/Vilnius and round to the start of the current hour
    const nowVilnius = moment().tz('Europe/Vilnius');
    const currentHourStart = nowVilnius.clone().startOf('hour');
    
    // Convert to UTC timestamp for database query
    const currentHourTimestamp = currentHourStart.unix();
    
    console.log(`Current hour query for all countries: ${currentHourStart.format('YYYY-MM-DD HH:mm:ss')} (${currentHourTimestamp})`);
    
    const result = await pool.query(
      'SELECT timestamp, price, country FROM price_data WHERE timestamp = $1 ORDER BY country',
      [currentHourTimestamp]
    );
    
    return result.rows;
  } catch (err) {
    console.error('Error getting current hour prices for all countries:', err);
    return [];
  }
}

// Get latest timestamp from price_data table
export async function getLatestTimestamp(country = 'lt') {
  try {
    const result = await pool.query(
      'SELECT MAX(timestamp) as latest_timestamp FROM price_data WHERE country = $1',
      [country]
    );
    return result.rows[0]?.latest_timestamp || null;
  } catch (err) {
    console.error('Error getting latest timestamp:', err);
    return null;
  }
}

// Get earliest timestamp from price_data table for a country
export async function getEarliestTimestamp(country = 'lt') {
  try {
    const result = await pool.query(
      'SELECT MIN(timestamp) as earliest_timestamp FROM price_data WHERE country = $1',
      [country]
    );
    return result.rows[0]?.earliest_timestamp || null;
  } catch (err) {
    console.error('Error getting earliest timestamp:', err);
    return null;
  }
}

// Get earliest timestamps for all countries
export async function getAllEarliestTimestamps() {
  try {
    const result = await pool.query(
      'SELECT country, MIN(timestamp) as earliest_timestamp FROM price_data GROUP BY country'
    );
    return result.rows;
  } catch (err) {
    console.error('Error getting all earliest timestamps:', err);
    return [];
  }
}

// Log sync operation
export async function logSync(syncType, status, recordsProcessed = 0, recordsCreated = 0, recordsUpdated = 0, errorMessage = null, durationMs = null) {
  try {
    const query = `
      INSERT INTO sync_log (sync_type, status, records_processed, records_created, records_updated, error_message, completed_at, duration_ms)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
    `;
    
    await pool.query(query, [
      syncType,
      status,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      errorMessage,
      durationMs
    ]);
  } catch (err) {
    console.error('Error logging sync:', err);
  }
}

// Track initial sync completion
export async function setInitialSyncComplete(endDate, recordsCount) {
  try {
    const completionTime = new Date().toISOString();
    
    await pool.query(`
      INSERT INTO sync_log (sync_type, status, records_processed, records_created, records_updated, error_message, completed_at, duration_ms)
      VALUES ('initial_sync', 'completed', $1, $1, 0, 'Initial sync completed to ' || $2, CURRENT_TIMESTAMP, 0)
    `, [recordsCount, endDate]);
    
    // Store completion datetime instead of end date
    await pool.query(`
      INSERT INTO user_settings (setting_key, setting_value, created_at, updated_at)
      VALUES ('initial_sync_completed', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `, [completionTime]);
    
    console.log(`Initial sync completion recorded: ${recordsCount} records to ${endDate} at ${completionTime}`);
  } catch (err) {
    console.error('Error recording initial sync completion:', err);
  }
}

// Check if initial sync is complete
export async function isInitialSyncComplete() {
  try {
    const result = await pool.query(`
      SELECT setting_value FROM user_settings 
      WHERE setting_key = 'initial_sync_completed'
    `);
    
    if (result.rows.length > 0) {
      const completionTime = result.rows[0].setting_value;
      console.log(`Initial sync completed at: ${completionTime}`);
      return completionTime;
    }
    
    return null;
  } catch (err) {
    console.error('Error checking initial sync status:', err);
    return null;
  }
}

// Get initial sync status with details
export async function getInitialSyncStatus() {
  try {
    // Check settings table
    const settingsResult = await pool.query(`
      SELECT setting_value, updated_at FROM user_settings 
      WHERE setting_key = 'initial_sync_completed'
    `);
    
    // Check sync_log table for more details
    const logResult = await pool.query(`
      SELECT sync_type, status, records_created, completed_at, error_message
      FROM sync_log 
      WHERE sync_type = 'initial_sync' 
      ORDER BY completed_at DESC 
      LIMIT 1
    `);
    
    const status = {
      isComplete: false,
      completedDate: null,
      completedAt: null,
      recordsCount: 0,
      lastError: null
    };
    
    if (settingsResult.rows.length > 0) {
      status.isComplete = true;
      status.completedAt = settingsResult.rows[0].setting_value; // This is now the completion datetime
      status.completedDate = settingsResult.rows[0].updated_at; // Use updated_at as fallback
    }
    
    if (logResult.rows.length > 0) {
      const log = logResult.rows[0];
      status.recordsCount = log.records_created || 0;
      if (log.status === 'error') {
        status.lastError = log.error_message;
      }
    }
    
    return status;
  } catch (err) {
    console.error('Error getting initial sync status:', err);
    return { isComplete: false, completedDate: null, completedAt: null, recordsCount: 0, lastError: err.message };
  }
}

// Get database statistics
export async function getDatabaseStats() {
  try {
    const stats = {};
    
    // Total records per country
    const countryStats = await pool.query(`
      SELECT country, COUNT(*) as total_records,
             MIN(timestamp) as earliest_timestamp,
             MAX(timestamp) as latest_timestamp
      FROM price_data 
      GROUP BY country 
      ORDER BY country
    `);
    stats.countries = countryStats.rows;
    
    // Total records across all countries
    const totalRecords = await pool.query('SELECT COUNT(*) as total FROM price_data');
    stats.totalRecords = parseInt(totalRecords.rows[0].total);
    
    // Database size
    const dbSize = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database()) as size_bytes
    `);
    stats.databaseSize = dbSize.rows[0];
    
    // Table sizes
    const tableSizes = await pool.query(`
      SELECT schemaname, tablename, 
             pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
             pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    stats.tableSizes = tableSizes.rows;
    
    // Recent sync activity
    const recentSyncs = await pool.query(`
      SELECT sync_type, status, records_created, records_updated, 
             completed_at, duration_ms, error_message
      FROM sync_log 
      ORDER BY completed_at DESC 
      LIMIT 10
    `);
    stats.recentSyncs = recentSyncs.rows;
    
    // Sync statistics
    const syncStats = await pool.query(`
      SELECT sync_type, 
             COUNT(*) as total_runs,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_runs,
             COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_runs,
             AVG(records_created) as avg_records_created,
             MAX(completed_at) as last_run
      FROM sync_log 
      GROUP BY sync_type
      ORDER BY last_run DESC
    `);
    stats.syncStats = syncStats.rows;
    
    return stats;
  } catch (err) {
    console.error('Error getting database stats:', err);
    return { error: err.message };
  }
}

// Get system health information
export async function getSystemHealth() {
  try {
    const health = {
      database: {},
      sync: {},
      system: {}
    };
    
    // Database connection test
    health.database.connected = await testConnection();
    
    // Database uptime
    const uptime = await pool.query('SELECT NOW() - pg_postmaster_start_time() as uptime');
    health.database.uptime = uptime.rows[0].uptime;
    
    // Active connections
    const connections = await pool.query(`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    health.database.activeConnections = parseInt(connections.rows[0].active_connections);
    
    // Check if data is recent (within last 24 hours)
    const recentData = await pool.query(`
      SELECT country, MAX(timestamp) as latest_timestamp
      FROM price_data 
      GROUP BY country
    `);
    
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - (24 * 60 * 60);
    
    health.sync.dataFreshness = recentData.rows.map(row => ({
      country: row.country,
      latestTimestamp: row.latest_timestamp,
      isRecent: row.latest_timestamp > oneDayAgo,
      hoursOld: row.latest_timestamp ? Math.floor((now - row.latest_timestamp) / 3600) : null
    }));
    
    // Check initial sync status
    health.sync.initialSync = await getInitialSyncStatus();
    
    // Get latest sync log entry
    const latestSync = await pool.query(`
      SELECT sync_type, status, completed_at, error_message
      FROM sync_log 
      ORDER BY completed_at DESC 
      LIMIT 1
    `);
    health.sync.lastSync = latestSync.rows[0] || null;
    
    // System info
    health.system.nodeVersion = process.version;
    health.system.platform = process.platform;
    health.system.uptime = process.uptime();
    health.system.memoryUsage = process.memoryUsage();
    
    return health;
  } catch (err) {
    console.error('Error getting system health:', err);
    return { error: err.message };
  }
}

// Track chunk completion during initial sync
export async function updateChunkCompletion(endDate, recordsCount) {
  try {
    await pool.query(`
      INSERT INTO user_settings (setting_key, setting_value, created_at, updated_at)
      VALUES ('initial_sync_last_chunk', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `, [endDate]);
    
    // Also log the chunk completion
    await pool.query(`
      INSERT INTO sync_log (sync_type, status, records_processed, records_created, records_updated, error_message, completed_at, duration_ms)
      VALUES ('initial_sync_chunk', 'completed', $1, $1, 0, 'Chunk completed to ' || $2, CURRENT_TIMESTAMP, 0)
    `, [recordsCount, endDate]);
    
    console.log(`Chunk completion recorded: ${recordsCount} records to ${endDate}`);
  } catch (err) {
    console.error('Error recording chunk completion:', err);
  }
}

// Get last completed chunk
export async function getLastCompletedChunk() {
  try {
    const result = await pool.query(`
      SELECT setting_value FROM user_settings 
      WHERE setting_key = 'initial_sync_last_chunk'
    `);
    
    if (result.rows.length > 0) {
      return result.rows[0].setting_value;
    }
    
    return null;
  } catch (err) {
    console.error('Error getting last completed chunk:', err);
    return null;
  }
}

// Mark initial sync as complete (only when final chunk is done)
export async function markInitialSyncComplete(endDate, recordsCount) {
  try {
    const completionTime = new Date().toISOString();
    
    // Mark initial sync as complete with completion datetime
    await pool.query(`
      INSERT INTO user_settings (setting_key, setting_value, created_at, updated_at)
      VALUES ('initial_sync_completed', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `, [completionTime]);
    
    // Log final completion
    await pool.query(`
      INSERT INTO sync_log (sync_type, status, records_processed, records_created, records_updated, error_message, completed_at, duration_ms)
      VALUES ('initial_sync', 'completed', $1, $1, 0, 'Initial sync completed to ' || $2, CURRENT_TIMESTAMP, 0)
    `, [recordsCount, endDate]);
    
    console.log(`Initial sync completion recorded: ${recordsCount} records to ${endDate} at ${completionTime}`);
  } catch (err) {
    console.error('Error recording initial sync completion:', err);
  }
}

export default pool; 