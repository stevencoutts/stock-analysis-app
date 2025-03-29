-- Create the postgres user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'postgres') THEN

      CREATE ROLE postgres LOGIN PASSWORD 'mysecretpassword' SUPERUSER;
   END IF;
END
$do$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create system_settings table with nullable updated_by
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by INTEGER NULL REFERENCES users(id)
);

-- Create initial admin user
INSERT INTO users (name, email, password, role)
VALUES (
    'Admin User',
    'admin@example.com',
    '$2a$12$K8HFqzBvgf7ORoiNrIcqU.NDziKL5/hcXWP/N9qYUvPXwxqhGbaXy',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default settings
INSERT INTO system_settings (key, value, description, updated_by)
VALUES (
    'ALPHA_VANTAGE_API_KEY',
    'CHANGEME',
    'API key for Alpha Vantage stock data service',
    NULL
) ON CONFLICT (key) DO NOTHING; 