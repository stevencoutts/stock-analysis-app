-- Update the system_settings table to allow null in updated_by
ALTER TABLE system_settings ALTER COLUMN updated_by DROP NOT NULL; 