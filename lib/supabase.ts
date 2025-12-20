import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  return fallback;
};

const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL', 
  'https://pzscejeregeiprieaehe.supabase.co'
);

const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c2NlamVyZWdlaXByaWVhZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MzAxNTcsImV4cCI6MjA1MDIwNjE1N30.q_2ywkqLGGvPjDQhBRSPnEDfp1fWC3PQSp3kWxLUL2A'
);

/**
 * Supabase client instance.
 * Connects to your Supabase project for authentication and database operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);