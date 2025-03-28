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

-- Create the database if it doesn't exist
CREATE DATABASE stockdb WITH OWNER postgres;

-- Connect to the stockdb database
\c stockdb;

-- Create users table if it doesn't exist
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

-- Function to create admin user
DO $$
BEGIN
    -- Check if admin user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com') THEN
        -- Create admin user with bcrypt hashed password 'admin123'
        INSERT INTO users (name, email, password, role)
        VALUES (
            'Admin User',
            'admin@example.com',
            '$2a$12$K8HFqzBvgf7ORoiNrIcqU.NDziKL5/hcXWP/N9qYUvPXwxqhGbaXy',
            'admin'
        );
        RAISE NOTICE 'Admin user created';
    END IF;
END $$; 