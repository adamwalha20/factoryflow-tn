-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (we can restrict to admins later via RLS policies if needed)
CREATE POLICY "Allow read access to audit_logs for authenticated users" 
ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Create a generic trigger function for auditing
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_id UUID;
    v_user_id UUID;
BEGIN
    -- Try to get the user ID from auth.uid() if available
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME::text, v_record_id, TG_OP, v_old_data, v_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME::text, v_record_id, TG_OP, v_old_data, v_new_data, v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME::text, v_record_id, TG_OP, v_new_data, v_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to tables
DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_articles ON public.articles;
CREATE TRIGGER audit_articles AFTER INSERT OR UPDATE OR DELETE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_machines ON public.machines;
CREATE TRIGGER audit_machines AFTER INSERT OR UPDATE OR DELETE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_cartons ON public.cartons;
CREATE TRIGGER audit_cartons AFTER INSERT OR UPDATE OR DELETE ON public.cartons FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_manufacturing_orders ON public.manufacturing_orders;
CREATE TRIGGER audit_manufacturing_orders AFTER INSERT OR UPDATE OR DELETE ON public.manufacturing_orders FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Realtime publication for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Stored Procedure to Revert Changes dynamically
CREATE OR REPLACE FUNCTION public.revert_audit_log(p_log_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_log RECORD;
    v_sql TEXT;
    v_key TEXT;
    v_val JSONB;
    v_cols TEXT;
    v_vals TEXT;
    v_sets TEXT;
BEGIN
    SELECT * INTO v_log FROM public.audit_logs WHERE id = p_log_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit log entry not found';
    END IF;

    -- If original action was INSERT, to revert we DELETE
    IF v_log.action = 'INSERT' THEN
        v_sql := format('DELETE FROM public.%I WHERE id = %L', v_log.table_name, v_log.record_id);
        EXECUTE v_sql;
        
    -- If original action was DELETE, to revert we INSERT (restore old data)
    ELSIF v_log.action = 'DELETE' THEN
        v_cols := '';
        v_vals := '';
        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_log.old_data)
        LOOP
            IF v_cols != '' THEN
                v_cols := v_cols || ', ';
                v_vals := v_vals || ', ';
            END IF;
            v_cols := v_cols || quote_ident(v_key);
            
            IF jsonb_typeof(v_val) = 'null' THEN
                v_vals := v_vals || 'NULL';
            ELSIF jsonb_typeof(v_val) = 'string' THEN
                v_vals := v_vals || quote_literal(v_val #>> '{}');
            ELSE
                v_vals := v_vals || quote_literal(v_val::text);
            END IF;
        END LOOP;
        
        v_sql := format('INSERT INTO public.%I (%s) VALUES (%s)', v_log.table_name, v_cols, v_vals);
        EXECUTE v_sql;

    -- If original action was UPDATE, to revert we UPDATE to old_data
    ELSIF v_log.action = 'UPDATE' THEN
        v_sets := '';
        FOR v_key, v_val IN SELECT * FROM jsonb_each(v_log.old_data)
        LOOP
            IF v_sets != '' THEN
                v_sets := v_sets || ', ';
            END IF;
            
            v_sets := v_sets || quote_ident(v_key) || ' = ';
            
            IF jsonb_typeof(v_val) = 'null' THEN
                v_sets := v_sets || 'NULL';
            ELSIF jsonb_typeof(v_val) = 'string' THEN
                v_sets := v_sets || quote_literal(v_val #>> '{}');
            ELSE
                v_sets := v_sets || quote_literal(v_val::text);
            END IF;
        END LOOP;

        v_sql := format('UPDATE public.%I SET %s WHERE id = %L', v_log.table_name, v_sets, v_log.record_id);
        EXECUTE v_sql;
    END IF;

    -- We do NOT automatically delete the audit log, instead we can let the process_audit_log create a new reversing audit log
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
