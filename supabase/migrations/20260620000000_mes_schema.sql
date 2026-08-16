-- Add department and assigned_tablet_id to machines
ALTER TABLE machines ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS assigned_tablet_id uuid;

-- Employees / Users (Mapping to Supabase auth is complex in raw SQL without auth.users, so we'll create an employees table)
CREATE TABLE IF NOT EXISTS employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- Reference to auth.users if needed
  first_name text,
  last_name text,
  role text, -- Administrator, Production Manager, Machine Operator, Quality Controller, Warehouse Operator
  pin_code text, -- For quick tablet login
  created_at timestamptz default now()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id uuid primary key default gen_random_uuid(),
  reference text unique,
  designation text,
  category text, -- Adhesive Tape, Stretch Film, Carton, Mandrin, Raw Material
  width numeric,
  length numeric,
  unit text,
  weight numeric,
  barcode text,
  created_at timestamptz default now()
);

-- Manufacturing Orders (OF)
CREATE TABLE IF NOT EXISTS manufacturing_orders (
  id uuid primary key default gen_random_uuid(),
  of_number text unique,
  customer text,
  article_id uuid references articles(id),
  quantity_planned numeric,
  status text default 'Draft', -- Draft, Planned, In Production, Completed, Closed
  due_date date,
  created_at timestamptz default now()
);

-- Production Entries
CREATE TABLE IF NOT EXISTS production_entries (
  id uuid primary key default gen_random_uuid(),
  of_id uuid references manufacturing_orders(id),
  machine_id uuid references machines(id),
  operator_id uuid references employees(id),
  good_quantity numeric default 0,
  scrap_quantity numeric default 0,
  jumbo_roll_quantity numeric default 0,
  comments text,
  created_at timestamptz default now()
);

-- Cartons
CREATE TABLE IF NOT EXISTS cartons (
  id uuid primary key default gen_random_uuid(),
  carton_number text unique,
  of_id uuid references manufacturing_orders(id),
  article_id uuid references articles(id),
  quantity numeric,
  operator_id uuid references employees(id),
  qr_payload jsonb,
  status text default 'Produced', -- Produced, QC_Passed, QC_Rejected, In_Warehouse
  created_at timestamptz default now()
);

-- Raw Materials & Consumption
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid primary key default gen_random_uuid(),
  reference text,
  designation text,
  category text, -- Jumbo Roll, Mandrin, Carton, Film
  quantity_in_stock numeric,
  unit text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS material_consumptions (
  id uuid primary key default gen_random_uuid(),
  production_entry_id uuid references production_entries(id),
  raw_material_id uuid references raw_materials(id),
  consumed_quantity numeric,
  remaining_quantity numeric,
  yield_percentage numeric,
  waste_percentage numeric,
  created_at timestamptz default now()
);

-- Machine Events (History)
CREATE TABLE IF NOT EXISTS machine_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references machines(id),
  status text, -- Running, Stopped, Maintenance
  event_time timestamptz default now(),
  operator_id uuid references employees(id)
);

-- Warehouse Movements
CREATE TABLE IF NOT EXISTS warehouse_movements (
  id uuid primary key default gen_random_uuid(),
  carton_id uuid references cartons(id),
  from_location text,
  to_location text,
  movement_type text, -- Inbound, Outbound, Transfer
  operator_id uuid references employees(id),
  created_at timestamptz default now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  employee_id uuid references employees(id),
  created_at timestamptz default now()
);

-- Enable Realtime for key tables
-- (Note: In Supabase, you often need to alter publications to enable realtime)
-- ALTER PUBLICATION supabase_realtime ADD TABLE manufacturing_orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE production_entries;
-- ALTER PUBLICATION supabase_realtime ADD TABLE cartons;
-- ALTER PUBLICATION supabase_realtime ADD TABLE machines;
-- ALTER PUBLICATION supabase_realtime ADD TABLE machine_events;
