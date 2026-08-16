-- Migration: Create bons_de_commande table

CREATE TABLE IF NOT EXISTS public.bons_de_commande (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bc_number TEXT NOT NULL UNIQUE,
    customer TEXT NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bons_de_commande ENABLE ROW LEVEL SECURITY;

-- Policies for bons_de_commande
CREATE POLICY "Enable read access for all users"
    ON public.bons_de_commande FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all"
    ON public.bons_de_commande FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all"
    ON public.bons_de_commande FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for all"
    ON public.bons_de_commande FOR DELETE
    USING (true);

-- Attach trigger for audit logs
DROP TRIGGER IF EXISTS audit_bons_de_commande ON public.bons_de_commande;
CREATE TRIGGER audit_bons_de_commande AFTER INSERT OR UPDATE OR DELETE ON public.bons_de_commande FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
