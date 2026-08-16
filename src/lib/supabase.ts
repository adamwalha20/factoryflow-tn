import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables. Please check .env file.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost:54321', 
  supabaseAnonKey || 'setup-your-anon-key'
);
