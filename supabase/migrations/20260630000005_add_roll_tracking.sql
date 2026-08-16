-- Add roll_number to raw_materials
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Add raw_material_id to production_entries
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS raw_material_id UUID;

-- Add foreign key constraint for raw_material_id in production_entries
ALTER TABLE production_entries
    ADD CONSTRAINT production_entries_raw_material_id_fkey
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE SET NULL;
