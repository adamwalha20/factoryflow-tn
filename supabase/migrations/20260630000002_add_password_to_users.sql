-- Add password column to users table for lightweight local authentication
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password text;
