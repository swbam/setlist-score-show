import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  try {
    console.log('🔍 Checking for database functions...\n');
    
    // Query for functions containing 'trending' in their name
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%trending%');
    
    if (error) {
      // Try a different approach - query the information schema
      const { data: routines, error: routineError } = await supabase.rpc('get_functions_list');
      
      if (routineError) {
        console.log('Could not query functions directly. Let me try listing all RPC functions...');
        
        // Try to list tables to see what we have access to
        const { data: tables, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .like('table_name', '%trending%');
          
        if (tableError) {
          console.error('Error querying tables:', tableError);
        } else {
          console.log('📊 Tables with "trending" in name:', tables || []);
        }
      } else {
        console.log('Functions:', routines);
      }
    } else {
      console.log('Functions with "trending" in name:', functions || []);
    }
    
    // Try to check if the materialized view exists
    console.log('\n🔍 Checking for materialized views...\n');
    
    const { data: views, error: viewError } = await supabase
      .from('pg_matviews')
      .select('matviewname')
      .like('matviewname', '%trending%');
      
    if (viewError) {
      console.log('Could not query materialized views');
    } else {
      console.log('Materialized views with "trending" in name:', views || []);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkFunctions();