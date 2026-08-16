-- RBAC and RLS Setup

-- Create a function to get the current user's role securely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all key tables
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartons ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_movements ENABLE ROW LEVEL SECURITY;

-- Fallback for development/simplicity: If you want to temporarily disable RLS blocking everything while testing
-- you can uncomment the following lines. But here we implement strict RLS.

-- 1. Employees
CREATE POLICY "Admins have full access to employees" ON employees FOR ALL USING (public.get_user_role() = 'Administrator');
CREATE POLICY "Users can view themselves" ON employees FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() IS NOT NULL);

-- 2. Machines
CREATE POLICY "Admins and Supervisors have full access to machines" ON machines FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Everyone can view machines" ON machines FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Production Entries
CREATE POLICY "Admins and Supervisors have full access to production_entries" ON production_entries FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Operators can manage production_entries" ON production_entries FOR ALL USING (public.get_user_role() = 'Machine Operator');

-- 4. Cartons
CREATE POLICY "Admins and Supervisors full access to cartons" ON cartons FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Operators can manage cartons" ON cartons FOR ALL USING (public.get_user_role() = 'Machine Operator');
CREATE POLICY "QC can manage cartons" ON cartons FOR ALL USING (public.get_user_role() = 'Quality Controller');
CREATE POLICY "Warehouse can manage cartons" ON cartons FOR ALL USING (public.get_user_role() = 'Warehouse Operator');

-- 5. Manufacturing Orders (OF)
CREATE POLICY "Admins and Supervisors full access to OF" ON manufacturing_orders FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Operators can view OF" ON manufacturing_orders FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. Articles & Raw Materials
CREATE POLICY "Admins and Supervisors full access to articles" ON articles FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Everyone can view articles" ON articles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Supervisors full access to raw materials" ON raw_materials FOR ALL USING (public.get_user_role() IN ('Administrator', 'Production Manager'));
CREATE POLICY "Everyone can view raw materials" ON raw_materials FOR SELECT USING (auth.uid() IS NOT NULL);

-- 7. General read access for other tables for authenticated users
CREATE POLICY "Authenticated users can read material_consumptions" ON material_consumptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Operators can insert material_consumptions" ON material_consumptions FOR INSERT WITH CHECK (public.get_user_role() = 'Machine Operator');

CREATE POLICY "Authenticated users can read machine_events" ON machine_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Operators can insert machine_events" ON machine_events FOR INSERT WITH CHECK (public.get_user_role() = 'Machine Operator');

CREATE POLICY "Authenticated users can read warehouse_movements" ON warehouse_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Warehouse can manage warehouse_movements" ON warehouse_movements FOR ALL USING (public.get_user_role() = 'Warehouse Operator');
