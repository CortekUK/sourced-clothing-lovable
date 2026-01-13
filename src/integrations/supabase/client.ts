import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables and provide helpful error message
const missingVars: string[] = [];
if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
if (!SUPABASE_PUBLISHABLE_KEY) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');

if (missingVars.length > 0) {
  const errorMsg = `Missing required Supabase environment variables: ${missingVars.join(', ')}. ` +
    'Please configure these in your environment or .env file.';
  console.error(errorMsg);
  // In development, show a more visible warning
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.warn('%c⚠️ Supabase not configured', 'color: orange; font-size: 16px; font-weight: bold');
    console.warn(errorMsg);
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);