
import { createClient } from '@supabase/supabase-js';

// These should be set in the environment where the app is deployed
const supabaseUrl = (process.env.SUPABASE_URL || 'https://pzscejeregeiprieaehe.supabase.co') as string;
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || 'sb_publishable_GfxRo84MgSx6aKmYbr06FA_x1mYI2W7') as string;

/**
 * Supabase client instance.
 * Note: If the environment variables are not yet provided, this will still initialize
 * but operations will fail until valid credentials are used.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
