-- Add changed_by column since the table already existed with employee_id
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Notify Supabase PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
