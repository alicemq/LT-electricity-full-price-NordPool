import pg from 'pg';
import dotenv from 'dotenv';

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
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
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

// Insert price data
export async function insertPriceData(priceData) {
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
    
    for (const data of priceData) {
      // Calculate UTC date from timestamp
      const date = new Date(data.timestamp * 1000).toISOString().slice(0, 10);
      await client.query(insertQuery, [data.timestamp, data.price, data.country, date]);
    }
    
    await client.query('COMMIT');
    return priceData.length;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting price data:', err);
    throw err;
  } finally {
    client.release();
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

// Get price data for a specific date range
export async function getPriceData(startDate, endDate, country = 'lt') {
  try {
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    
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

export default pool; 