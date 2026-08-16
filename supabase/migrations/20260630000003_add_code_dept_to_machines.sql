-- Add code and department columns to machines table
ALTER TABLE public.machines
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS department text;
