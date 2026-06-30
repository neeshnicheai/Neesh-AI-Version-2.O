-- Fix blog column types: change from VARCHAR to TEXT to support base64 images and large JSON
-- These will run after Hibernate creates/updates the tables
ALTER TABLE IF EXISTS blogs ALTER COLUMN cover_image_url TYPE TEXT;
ALTER TABLE IF EXISTS blogs ALTER COLUMN custom_fields TYPE TEXT;
ALTER TABLE IF EXISTS blogs ALTER COLUMN introduction TYPE TEXT;
ALTER TABLE IF EXISTS blogs ALTER COLUMN content TYPE TEXT;
ALTER TABLE IF EXISTS blogs ALTER COLUMN heading TYPE TEXT;
