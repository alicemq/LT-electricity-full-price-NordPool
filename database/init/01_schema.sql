-- Electricity Prices Database Schema
-- Initialize tables for storing Elering API data and application settings

-- Price data table
CREATE TABLE IF NOT EXISTS price_data (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL, -- Unix timestamp from Elering API
    price DECIMAL(10,6) NOT NULL, -- Price in EUR/MWh
    country VARCHAR(10) NOT NULL, -- Country code (lt, ee, lv, fi)
    date DATE NOT NULL, -- Date (UTC) for efficient querying
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timestamp, country) -- Ensure no duplicate timestamps per country
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_data_country ON price_data(country);
CREATE INDEX IF NOT EXISTS idx_price_data_date ON price_data(date);
-- Note: Do not use to_timestamp in index expressions (not IMMUTABLE in PostgreSQL)

-- Settings table for user configurations
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data sync log table
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'price_data', 'settings', etc.
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER
);

-- Historical price configurations (moved from JS config)
CREATE TABLE IF NOT EXISTS price_configurations (
    id SERIAL PRIMARY KEY,
    effective_date DATE NOT NULL,
    zone_name VARCHAR(50) NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    time_period VARCHAR(20) NOT NULL, -- 'morning', 'day', 'evening', 'night'
    price DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(effective_date, zone_name, plan_name, time_period)
);

-- System charges table
CREATE TABLE IF NOT EXISTS system_charges (
    id SERIAL PRIMARY KEY,
    effective_date DATE NOT NULL,
    charge_type VARCHAR(50) NOT NULL, -- 'VIAP', 'distributionplus', etc.
    amount DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(effective_date, charge_type)
);

-- Create indexes for configuration tables
CREATE INDEX IF NOT EXISTS idx_price_config_date ON price_configurations(effective_date);
CREATE INDEX IF NOT EXISTS idx_price_config_zone ON price_configurations(zone_name);
CREATE INDEX IF NOT EXISTS idx_system_charges_date ON system_charges(effective_date);

-- Insert default settings
INSERT INTO user_settings (setting_key, setting_value, description) VALUES
('default_zone', 'Four zones', 'Default time zone configuration'),
('default_plan', 'Smart', 'Default electricity plan'),
('default_vendor_margin', '0.02003', 'Default vendor margin in EUR'),
('default_vat_included', 'true', 'Whether VAT is included by default'),
('cheap_threshold', '20', 'Cheap price threshold in ct/kWh'),
('expensive_threshold', '50', 'Expensive price threshold in ct/kWh'),
('cheap_range_percent', '15', 'Cheap range percentage from average'),
('expensive_range_percent', '15', 'Expensive range percentage from average')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert initial price configurations (from current JS config)
INSERT INTO price_configurations (effective_date, zone_name, plan_name, time_period, price) VALUES
-- 2023-01-01 configurations
('2023-01-01', 'Four zones', 'Smart', 'morning', 0.06534),
('2023-01-01', 'Four zones', 'Smart', 'day', 0.07986),
('2023-01-01', 'Four zones', 'Smart', 'evening', 0.10648),
('2023-01-01', 'Four zones', 'Smart', 'night', 0.05203),
-- 2024-01-01 configurations
('2024-01-01', 'Four zones', 'Smart', 'morning', 0.07502),
('2024-01-01', 'Four zones', 'Smart', 'day', 0.09438),
('2024-01-01', 'Four zones', 'Smart', 'evening', 0.12826),
('2024-01-01', 'Four zones', 'Smart', 'night', 0.05929),
-- 2025-01-01 configurations
('2025-01-01', 'Four zones', 'Smart', 'morning', 0.07381),
('2025-01-01', 'Four zones', 'Smart', 'day', 0.09317),
('2025-01-01', 'Four zones', 'Smart', 'evening', 0.12947),
('2025-01-01', 'Four zones', 'Smart', 'night', 0.05566)
ON CONFLICT (effective_date, zone_name, plan_name, time_period) DO NOTHING;

-- Insert initial system charges
INSERT INTO system_charges (effective_date, charge_type, amount) VALUES
('2024-01-01', 'VIAP', 0.00),
('2024-01-01', 'distributionplus', 0.00045),
('2025-01-01', 'VIAP', -0.00039),
('2025-01-01', 'distributionplus', 0.000893)
ON CONFLICT (effective_date, charge_type) DO NOTHING; 