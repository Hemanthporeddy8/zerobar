import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client;
if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  client = mockSupabase;
}

export const supabase = client;


