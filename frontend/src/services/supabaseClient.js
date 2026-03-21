/**
 * Supabase Client Configuration
 * Initializes the Supabase client for authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Missing Supabase credentials! Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env (or Render environment variables)'
  );
  // Mock client so the app renders (login page) instead of crashing to white screen
  const noOp = async () => ({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } });
  supabase = {
    auth: {
      getSession: noOp,
      getUser: noOp,
      signInWithPassword: noOp,
      signUp: noOp,
      signOut: noOp,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export default supabase;
