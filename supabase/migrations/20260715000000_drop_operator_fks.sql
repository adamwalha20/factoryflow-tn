-- Drop foreign key constraints from operator_id to allow hard deleting users without clearing their IDs
ALTER TABLE production_sessions DROP CONSTRAINT IF EXISTS production_sessions_operator_id_fkey;
ALTER TABLE production_entries DROP CONSTRAINT IF EXISTS production_entries_operator_id_fkey;
ALTER TABLE cartons DROP CONSTRAINT IF EXISTS cartons_operator_id_fkey;
ALTER TABLE machine_events DROP CONSTRAINT IF EXISTS machine_events_operator_id_fkey;
ALTER TABLE warehouse_movements DROP CONSTRAINT IF EXISTS warehouse_movements_operator_id_fkey;
