import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://hfngnstxfitukofbkapy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY not set in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
