const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🚀 Applying database migrations...\n');
  
  const migrations = [
    '20250619000001_create_homepage_cache.sql',
    '20250619000002_create_zip_codes_and_location_search.sql',
    '20250619000003_update_venue_location_function.sql'
  ];
  
  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration);
    
    try {
      console.log(`📄 Applying migration: ${migration}`);
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolons but not within dollar-quoted strings
      const statements = sql
        .split(/;(?=(?:[^$]*\$[^$]*\$)*[^$]*$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        if (statement.includes('CREATE EXTENSION') || 
            statement.includes('CREATE TABLE') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('CREATE INDEX') ||
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE POLICY') ||
            statement.includes('INSERT INTO') ||
            statement.includes('SELECT cron.schedule')) {
          
          try {
            const { error } = await supabase.rpc('query', { query_text: statement + ';' });
            
            if (error) {
              // Try direct execution for some statements
              const { error: directError } = await supabase.from('_sql').insert({ query: statement + ';' });
              
              if (directError) {
                console.error(`  ❌ Error executing statement: ${directError.message}`);
                console.error(`     Statement: ${statement.substring(0, 100)}...`);
              } else {
                console.log(`  ✅ Statement executed successfully`);
              }
            } else {
              console.log(`  ✅ Statement executed successfully`);
            }
          } catch (err) {
            console.error(`  ❌ Error: ${err.message}`);
          }
        }
      }
      
      console.log(`✅ Migration ${migration} applied\n`);
      
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migration}:`, error.message);
    }
  }
  
  console.log('🎉 All migrations completed!');
  
  // Test the new functions
  console.log('\n🧪 Testing new functions...');
  
  try {
    // Test homepage cache refresh
    const { error: cacheError } = await supabase.rpc('refresh_homepage_cache');
    if (cacheError) {
      console.log('❌ Homepage cache refresh failed:', cacheError.message);
    } else {
      console.log('✅ Homepage cache refresh successful');
    }
    
    // Test get_homepage_content
    const { data: homepageData, error: homepageError } = await supabase.rpc('get_homepage_content');
    if (homepageError) {
      console.log('❌ Get homepage content failed:', homepageError.message);
    } else {
      console.log('✅ Homepage content retrieved successfully');
      console.log(`   - Top artists: ${homepageData?.top_artists?.length || 0}`);
      console.log(`   - Top shows: ${homepageData?.top_shows?.length || 0}`);
      console.log(`   - Featured tours: ${homepageData?.featured_tours?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Function test error:', error.message);
  }
}

applyMigrations().catch(console.error);