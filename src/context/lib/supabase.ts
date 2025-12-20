import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!', {
    url: supabaseUrl ? '✓' : '✗',
    key: supabaseAnonKey ? '✓' : '✗',
  });
  
  // Show user-friendly error instead of crashing
  throw new Error('Application configuration error. Please contact support.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);