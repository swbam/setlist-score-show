// Quick database test script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  // Check if tables exist and have data
  const tables = ['artists', 'shows', 'venues', 'setlists'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.error(`Error querying ${table}:`, error);
      } else {
        console.log(`${table}: ${count} total records`);
        if (data && data.length > 0) {
          console.log(`Sample ${table} data:`, data[0]);
        }
      }
    } catch (err) {
      console.error(`Exception querying ${table}:`, err);
    }
  }
}

testDatabase().catch(console.error);
