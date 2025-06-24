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

export default pool; 