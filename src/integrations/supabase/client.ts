import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Use environment variables with fallback to ensure compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mppyzuwukxwnllgmfwto.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcHl6dXd1a3h3bmxsZ21md3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzA3MDMsImV4cCI6MjA2MzcwNjcwM30.6JtEAaoBzxME54kHh9tqi4FN6FiWR8gxcHE7BQ26sr0';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
