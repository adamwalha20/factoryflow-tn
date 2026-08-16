-- Drop roll_number from raw_materials
ALTER TABLE raw_materials DROP COLUMN IF EXISTS roll_number;

-- Add roll_number to production_entries
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS roll_number TEXT;
