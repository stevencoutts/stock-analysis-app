-- Stock data tables
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(12,4),
    change_percent DECIMAL(6,2),
    volume BIGINT,
    fetch_time TIMESTAMP NOT NULL DEFAULT NOW(),
    is_real_data BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stock_history (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(12,4) NOT NULL,
    volume BIGINT,
    fetch_time TIMESTAMP NOT NULL DEFAULT NOW(),
    is_real_data BOOLEAN DEFAULT TRUE,
    UNIQUE(symbol, date)
);

CREATE TABLE IF NOT EXISTS api_calls (
    id SERIAL PRIMARY KEY,
    call_date DATE NOT NULL DEFAULT CURRENT_DATE,
    call_count INTEGER DEFAULT 0,
    last_call TIMESTAMP DEFAULT NOW(),
    UNIQUE(call_date)
);

-- Index for faster queries
CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX idx_stock_history_symbol_date ON stock_history(symbol, date); 