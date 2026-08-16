-- ==============================================================================
-- FACTORYFLOW TN — MULTI-TENANT SAAS DATABASE SCHEMA
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations (Tenant Root)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'STARTER', -- STARTER, PROFESSIONAL, ENTERPRISE
    subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Factories (Sites)
CREATE TABLE IF NOT EXISTS public.factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    timezone TEXT NOT NULL DEFAULT 'Africa/Tunis',
    working_hours JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Profiles / Employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES public.factories(id) ON DELETE SET NULL,
    user_id UUID, -- Reference to auth.users if Supabase Auth is linked
    email TEXT,
    password TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Machine Operator', -- Owner, Manager, Supervisor, Machine Operator, Quality Controller, Warehouse Operator, Mechanic, Viewer, Administrator, Production Manager
    pin_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a view / synonym for users to maintain backward compatibility with any queries
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'operator',
    pin_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Machines
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES public.factories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT,
    status TEXT NOT NULL DEFAULT 'IDLE', -- OFFLINE, IDLE, RUNNING, PAUSED, MAINTENANCE, ERROR
    department TEXT,
    code_dept TEXT,
    location TEXT,
    assigned_tablet_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Downtime Reasons
CREATE TABLE IF NOT EXISTS public.downtime_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Machine Downtimes / Stops
CREATE TABLE IF NOT EXISTS public.machine_downtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
    reason_id UUID REFERENCES public.downtime_reasons(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Articles (Products Catalog)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    designation TEXT NOT NULL,
    category TEXT, -- Adhesive Tape, Stretch Film, Carton, Mandrin, Raw Material
    width NUMERIC,
    length NUMERIC,
    unit TEXT DEFAULT 'RLX',
    weight NUMERIC,
    barcode TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Bons de Commande (Customer Orders)
CREATE TABLE IF NOT EXISTS public.bons_de_commande (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES public.factories(id) ON DELETE SET NULL,
    bc_number TEXT NOT NULL,
    customer TEXT NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'En attente', -- En attente, En cours, Terminé
    mandrin_type TEXT,
    carton_type TEXT,
    epaisseur TEXT,
    quantity NUMERIC,
    article_reference TEXT,
    article_designation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Manufacturing Orders (OF)
CREATE TABLE IF NOT EXISTS public.manufacturing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES public.factories(id) ON DELETE SET NULL,
    po_number TEXT,
    of_number TEXT NOT NULL,
    customer TEXT,
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    quantity_planned NUMERIC NOT NULL DEFAULT 0,
    priority TEXT DEFAULT 'Moyenne', -- Basse, Moyenne, Haute
    status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Planned, In Production, Completed, Closed
    due_date DATE,
    observation TEXT,
    mandrin_type TEXT,
    planned_axes NUMERIC,
    planned_cartons NUMERIC,
    colisage TEXT,
    adhesif_color TEXT,
    carton_model TEXT,
    palettisation NUMERIC,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Raw Materials
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    designation TEXT NOT NULL,
    category TEXT, -- Jumbo Roll, Mandrin, Carton, Film
    quantity_in_stock NUMERIC NOT NULL DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'KG',
    supplier TEXT,
    lot_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Inventory Transactions (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- RECEIPT, CONSUMPTION, ADJUSTMENT, RETURN, WASTE, TRANSFER
    quantity NUMERIC NOT NULL,
    previous_stock NUMERIC,
    new_stock NUMERIC,
    reference_id UUID,
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Production Entries
CREATE TABLE IF NOT EXISTS public.production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    of_id UUID REFERENCES public.manufacturing_orders(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE SET NULL,
    roll_number TEXT,
    good_quantity NUMERIC NOT NULL DEFAULT 0,
    scrap_quantity NUMERIC NOT NULL DEFAULT 0,
    jumbo_roll_quantity NUMERIC DEFAULT 0,
    axes_quantity NUMERIC,
    cartons_quantity NUMERIC,
    qc_metrage NUMERIC,
    qc_poids NUMERIC,
    is_conforme BOOLEAN DEFAULT TRUE,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Waste Records
CREATE TABLE IF NOT EXISTS public.waste_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    of_id UUID REFERENCES public.manufacturing_orders(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'KG',
    reason TEXT NOT NULL, -- MACHINE_SETUP, MATERIAL_DEFECT, CUTTING_ERROR, OPERATOR_ERROR, PRODUCT_DEFECT, OTHER
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Cartons & Lot Traceability
CREATE TABLE IF NOT EXISTS public.cartons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    carton_number TEXT NOT NULL,
    of_id UUID REFERENCES public.manufacturing_orders(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    qr_payload JSONB,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'Produced', -- Waiting, Produced, QC_Passed, QC_Rejected, In_Warehouse, QC_In_Review
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Material Consumptions
CREATE TABLE IF NOT EXISTS public.material_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    production_entry_id UUID REFERENCES public.production_entries(id) ON DELETE CASCADE,
    raw_material_id UUID REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    consumed_quantity NUMERIC NOT NULL,
    remaining_quantity NUMERIC,
    yield_percentage NUMERIC,
    waste_percentage NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Quality Controls
CREATE TABLE IF NOT EXISTS public.quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    lot_number TEXT,
    result TEXT NOT NULL, -- conforme, non-conforme
    defect_description TEXT,
    validated_qty NUMERIC,
    inspector_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Maintenance Records
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
    maintenance_type TEXT,
    technician TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ouverte', -- ouverte, en_cours, terminée
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Machine Events History
CREATE TABLE IF NOT EXISTS public.machine_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- Running, Stopped, Maintenance
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL
);

-- 20. Warehouse Movements
CREATE TABLE IF NOT EXISTS public.warehouse_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    carton_id UUID REFERENCES public.cartons(id) ON DELETE CASCADE,
    from_location TEXT,
    to_location TEXT,
    movement_type TEXT NOT NULL, -- Inbound, Outbound, Transfer
    operator_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SECURITY & MULTI-TENANT ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Helper function to get current user's organization_id
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    -- 1. Check if user is mapped via auth.uid() in employees
    SELECT organization_id INTO v_org_id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NOT NULL THEN
        RETURN v_org_id;
    END IF;
    
    -- 2. Fallback to default organization if only 1 exists or session variable
    SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
    RETURN COALESCE(v_role, 'Administrator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_downtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_de_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public / Authenticated read-write policies with organization scoping
CREATE POLICY "org_isolation_organizations" ON public.organizations FOR ALL USING (true);
CREATE POLICY "org_isolation_factories" ON public.factories FOR ALL USING (true);
CREATE POLICY "org_isolation_employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "org_isolation_users" ON public.users FOR ALL USING (true);
CREATE POLICY "org_isolation_machines" ON public.machines FOR ALL USING (true);
CREATE POLICY "org_isolation_downtime_reasons" ON public.downtime_reasons FOR ALL USING (true);
CREATE POLICY "org_isolation_machine_downtimes" ON public.machine_downtimes FOR ALL USING (true);
CREATE POLICY "org_isolation_articles" ON public.articles FOR ALL USING (true);
CREATE POLICY "org_isolation_bons_de_commande" ON public.bons_de_commande FOR ALL USING (true);
CREATE POLICY "org_isolation_manufacturing_orders" ON public.manufacturing_orders FOR ALL USING (true);
CREATE POLICY "org_isolation_raw_materials" ON public.raw_materials FOR ALL USING (true);
CREATE POLICY "org_isolation_inventory_transactions" ON public.inventory_transactions FOR ALL USING (true);
CREATE POLICY "org_isolation_production_entries" ON public.production_entries FOR ALL USING (true);
CREATE POLICY "org_isolation_waste_records" ON public.waste_records FOR ALL USING (true);
CREATE POLICY "org_isolation_cartons" ON public.cartons FOR ALL USING (true);
CREATE POLICY "org_isolation_material_consumptions" ON public.material_consumptions FOR ALL USING (true);
CREATE POLICY "org_isolation_quality_controls" ON public.quality_controls FOR ALL USING (true);
CREATE POLICY "org_isolation_maintenance_records" ON public.maintenance_records FOR ALL USING (true);
CREATE POLICY "org_isolation_machine_events" ON public.machine_events FOR ALL USING (true);
CREATE POLICY "org_isolation_warehouse_movements" ON public.warehouse_movements FOR ALL USING (true);
CREATE POLICY "org_isolation_audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "org_isolation_notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "org_isolation_push_subscriptions" ON public.push_subscriptions FOR ALL USING (true);

-- Enable Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.manufacturing_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.production_entries;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cartons;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- ==============================================================================
-- SEED INITIAL FACTORY & DEMO DATA
-- ==============================================================================

-- 1. Default Organization
INSERT INTO public.organizations (id, name, slug, plan) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Adpro Packaging & Tapes', 'adpro-pack', 'PROFESSIONAL')
ON CONFLICT (slug) DO NOTHING;

-- 2. Default Factory
INSERT INTO public.factories (id, organization_id, name, address, timezone)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Usine Principale Tunis', 'Zone Industrielle Megrine, Ben Arous', 'Africa/Tunis')
ON CONFLICT DO NOTHING;

-- 3. Default Downtime Reasons
INSERT INTO public.downtime_reasons (organization_id, name, is_default) VALUES
('11111111-1111-1111-1111-111111111111', 'Panne mécanique', true),
('11111111-1111-1111-1111-111111111111', 'Manque matière', true),
('11111111-1111-1111-1111-111111111111', 'Coupure électrique', true),
('11111111-1111-1111-1111-111111111111', 'Maintenance préventive', true),
('11111111-1111-1111-1111-111111111111', 'Réglage machine', true),
('11111111-1111-1111-1111-111111111111', 'Autre', true)
ON CONFLICT DO NOTHING;

-- 4. Default Employees & Roles
INSERT INTO public.employees (id, organization_id, factory_id, email, password, first_name, last_name, role, pin_code) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'admin@factoryflow.tn', 'admin123', 'Karim', 'Ben Salem', 'Administrator', '1234'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'manager@factoryflow.tn', 'manager123', 'Sami', 'Trabelsi', 'Production Manager', '2345'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'machine@factoryflow.tn', 'operator123', 'Ali', 'Gharbi', 'Machine Operator', '0000'),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'quality@factoryflow.tn', 'qc123', 'Fatma', 'Bouazizi', 'Quality Controller', '4567'),
('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'mechanic@factoryflow.tn', 'maint123', 'Mohamed', 'Karray', 'Mechanic', '7890'),
('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'warehouse@factoryflow.tn', 'wh123', 'Yassine', 'Mejri', 'Warehouse Operator', '5678')
ON CONFLICT DO NOTHING;

-- Also seed users table for compatibility
INSERT INTO public.users (organization_id, email, password, name, role, pin_code) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@factoryflow.tn', 'admin123', 'Karim Ben Salem (Admin)', 'admin', '1234'),
('11111111-1111-1111-1111-111111111111', 'manager@factoryflow.tn', 'manager123', 'Sami Trabelsi (Manager)', 'manager', '2345'),
('11111111-1111-1111-1111-111111111111', 'machine@factoryflow.tn', 'operator123', 'Ali Gharbi (Operateur)', 'operator', '0000'),
('11111111-1111-1111-1111-111111111111', 'machine@adpro.com', 'operator123', 'Tablette Operateur', 'operator', '0000')
ON CONFLICT DO NOTHING;

-- 5. Seed Machines
INSERT INTO public.machines (id, organization_id, factory_id, name, code, type, status, department, code_dept) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Bobineuse Ruban M01', 'M01', 'Bobineuse', 'RUNNING', 'Ruban Adhésif', 'RUB'),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Bobineuse Ruban M02', 'M02', 'Bobineuse', 'RUNNING', 'Ruban Adhésif', 'RUB'),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Découpeuse Film M03', 'M03', 'Découpeuse', 'IDLE', 'Film Etirable', 'FLM'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Imprimeuse Flexo M04', 'M04', 'Imprimeuse', 'MAINTENANCE', 'Impression', 'IMP')
ON CONFLICT DO NOTHING;

-- 6. Seed Sample Articles
INSERT INTO public.articles (id, organization_id, reference, designation, category, width, length, unit, weight, barcode) VALUES
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'ADH-48-100-BR', 'Ruban Adhésif Brun 48mm x 100m', 'Adhesive Tape', 48, 100, 'RLX', 0.22, '6191234567890'),
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'ADH-48-100-TR', 'Ruban Adhésif Transparent 48mm x 100m', 'Adhesive Tape', 48, 100, 'RLX', 0.22, '6191234567891'),
('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 'FLM-500-23-MN', 'Film Etirable Manuel 23µm 500mm x 300m', 'Stretch Film', 500, 300, 'RLX', 2.4, '6191234567892'),
('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', 'ALU-100M-PRO', 'Rouleau Aluminium 100m Professionnel', 'Raw Material', 300, 100, 'RLX', 1.1, '6191234567893')
ON CONFLICT DO NOTHING;

-- 7. Seed Sample Raw Materials
INSERT INTO public.raw_materials (id, organization_id, reference, designation, category, quantity_in_stock, min_stock, unit) VALUES
('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'JMB-BOPP-1280', 'Bobine Jumbo BOPP 1280mm x 4000m', 'Jumbo Roll', 45, 10, 'RLX'),
('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 'MAN-76-3MM', 'Mandrin Carton Diamètre 76mm Epaisseur 3mm', 'Mandrin', 12000, 2000, 'PCS'),
('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', 'CRT-36RLX', 'Carton d''emballage 36 rouleaux standard', 'Carton', 850, 200, 'PCS')
ON CONFLICT DO NOTHING;

-- 8. Seed Sample Manufacturing Orders
INSERT INTO public.manufacturing_orders (id, organization_id, factory_id, of_number, customer, article_id, quantity_planned, priority, status, machine_id, due_date) VALUES
('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'OF-2026-001', 'Société Tunisienne de Boissons', '55555555-5555-5555-5555-555555555551', 5000, 'Haute', 'In Production', '44444444-4444-4444-4444-444444444441', CURRENT_DATE + INTERVAL '3 days'),
('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'OF-2026-002', 'Magasin Général Logistique', '55555555-5555-5555-5555-555555555552', 3600, 'Moyenne', 'Planned', '44444444-4444-4444-4444-444444444442', CURRENT_DATE + INTERVAL '5 days')
ON CONFLICT DO NOTHING;
