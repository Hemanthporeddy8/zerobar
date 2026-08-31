import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This just warns during local dev — it does not stop the app from loading,
  // so screens will render but every Supabase call will fail until you set
  // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
  console.warn(
    'Zerobar: Supabase env vars are missing. Copy .env.example to .env.local and fill them in.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
