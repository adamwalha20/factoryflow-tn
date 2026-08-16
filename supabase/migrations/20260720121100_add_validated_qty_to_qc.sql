ALTER TABLE quality_inspections
ADD COLUMN IF NOT EXISTS validated_quantity integer;
