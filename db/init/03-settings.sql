-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Insert default API key setting
INSERT INTO system_settings (key, value, description)
VALUES (
    'ALPHA_VANTAGE_API_KEY',
    'CHANGEME',
    'API key for Alpha Vantage stock data service'
) ON CONFLICT (key) DO NOTHING; 