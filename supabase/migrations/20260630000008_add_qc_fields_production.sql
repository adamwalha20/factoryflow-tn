-- Add new fields to production_entries to match the Contrôle en cours physical form
ALTER TABLE production_entries 
ADD COLUMN IF NOT EXISTS axes_quantity INTEGER,
ADD COLUMN IF NOT EXISTS cartons_quantity INTEGER,
ADD COLUMN IF NOT EXISTS qc_metrage NUMERIC,
ADD COLUMN IF NOT EXISTS qc_poids NUMERIC,
ADD COLUMN IF NOT EXISTS is_conforme BOOLEAN DEFAULT true;
