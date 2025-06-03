import { createClient } from '@supabase/supabase-js';

// Database audit script for Supabase
// This script requires service role key for full access to system tables

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Please run: export SUPABASE_SERVICE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  constraint_type?: string;
  constraint_name?: string;
}

interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface FunctionInfo {
  function_name: string;
  function_schema: string;
  return_type: string;
  function_definition: string;
  argument_data_types: string;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

interface TriggerInfo {
  trigger_name: string;
  event_manipulation: string;
  event_object_table: string;
  action_statement: string;
}

async function auditTables() {
  console.log('\n🔍 AUDITING TABLES AND COLUMNS\n');
  
  // Query to get all tables with their columns and constraints
  const { data: tables, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        tc.constraint_name
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
      LEFT JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `
  });

  if (error) {
    console.error('Error fetching table info:', error);
    return;
  }

  // Group by table
  const tableMap = new Map<string, TableInfo[]>();
  tables?.forEach((row: TableInfo) => {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, []);
    }
    tableMap.get(row.table_name)?.push(row);
  });

  // Expected tables based on migrations
  const expectedTables = [
    'artists', 'venues', 'shows', 'songs', 'setlists', 
    'setlist_songs', 'votes', 'vote_limits', 'user_vote_stats'
  ];

  // Check for missing tables
  const actualTables = Array.from(tableMap.keys());
  const missingTables = expectedTables.filter(t => !actualTables.includes(t));
  const extraTables = actualTables.filter(t => !expectedTables.includes(t));

  if (missingTables.length > 0) {
    console.log('❌ Missing tables:', missingTables.join(', '));
  }
  if (extraTables.length > 0) {
    console.log('⚠️  Extra tables:', extraTables.join(', '));
  }

  // Display table structure
  tableMap.forEach((columns, tableName) => {
    console.log(`\n📋 Table: ${tableName}`);
    console.log('─'.repeat(60));
    
    const uniqueColumns = new Map<string, TableInfo>();
    columns.forEach(col => {
      if (!uniqueColumns.has(col.column_name)) {
        uniqueColumns.set(col.column_name, col);
      }
    });

    uniqueColumns.forEach(col => {
      const constraints = columns
        .filter(c => c.column_name === col.column_name && c.constraint_type)
        .map(c => c.constraint_type)
        .join(', ');
      
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${constraints ? `[${constraints}]` : ''}`);
      if (col.column_default) {
        console.log(`    Default: ${col.column_default}`);
      }
    });
  });
}

async function auditFunctions() {
  console.log('\n\n🔧 AUDITING FUNCTIONS/RPC\n');
  
  const { data: functions, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        p.proname as function_name,
        n.nspname as function_schema,
        pg_catalog.pg_get_function_result(p.oid) as return_type,
        pg_catalog.pg_get_function_arguments(p.oid) as argument_data_types,
        pg_catalog.pg_get_functiondef(p.oid) as function_definition
      FROM pg_catalog.pg_proc p
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `
  });

  if (error) {
    console.error('Error fetching functions:', error);
    return;
  }

  // Expected functions based on migrations
  const expectedFunctions = [
    'update_updated_at_column',
    'vote_for_song',
    'increment_show_views',
    'match_song_similarity',
    'get_user_vote_stats',
    'refresh_trending_shows',
    'get_trending_shows_enhanced',
    'get_trending_artists_enhanced',
    'get_trending_songs_enhanced',
    'calculate_trending_scores',
    'get_user_voting_stats'
  ];

  const actualFunctions = functions?.map((f: FunctionInfo) => f.function_name) || [];
  const missingFunctions = expectedFunctions.filter(f => !actualFunctions.includes(f));
  const extraFunctions = actualFunctions.filter((f: string) => !expectedFunctions.includes(f));

  if (missingFunctions.length > 0) {
    console.log('❌ Missing functions:', missingFunctions.join(', '));
  }
  if (extraFunctions.length > 0) {
    console.log('⚠️  Extra functions:', extraFunctions.join(', '));
  }

  console.log('\nFunctions found:');
  functions?.forEach((func: FunctionInfo) => {
    console.log(`\n📌 ${func.function_name}(${func.argument_data_types})`);
    console.log(`   Returns: ${func.return_type}`);
  });
}

async function auditIndexes() {
  console.log('\n\n📊 AUDITING INDEXES\n');
  
  const { data: indexes, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `
  });

  if (error) {
    console.error('Error fetching indexes:', error);
    return;
  }

  // Group indexes by table
  const indexMap = new Map<string, IndexInfo[]>();
  indexes?.forEach((idx: IndexInfo) => {
    if (!indexMap.has(idx.tablename)) {
      indexMap.set(idx.tablename, []);
    }
    indexMap.get(idx.tablename)?.push(idx);
  });

  indexMap.forEach((indexes, tableName) => {
    console.log(`\n📋 Table: ${tableName}`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });
  });
}

async function auditPolicies() {
  console.log('\n\n🔒 AUDITING RLS POLICIES\n');
  
  const { data: policies, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.error('Error fetching policies:', error);
    return;
  }

  // Group policies by table
  const policyMap = new Map<string, PolicyInfo[]>();
  policies?.forEach((policy: PolicyInfo) => {
    if (!policyMap.has(policy.tablename)) {
      policyMap.set(policy.tablename, []);
    }
    policyMap.get(policy.tablename)?.push(policy);
  });

  policyMap.forEach((policies, tableName) => {
    console.log(`\n📋 Table: ${tableName}`);
    policies.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd})`);
      console.log(`    Roles: ${policy.roles.join(', ')}`);
      if (policy.qual) console.log(`    Using: ${policy.qual}`);
      if (policy.with_check) console.log(`    With Check: ${policy.with_check}`);
    });
  });

  // Check for tables without RLS
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('sql', {
    query: `
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
  });

  if (!rlsError && rlsStatus) {
    console.log('\n\n🔓 RLS Status by Table:');
    rlsStatus.forEach((table: any) => {
      console.log(`  ${table.tablename}: RLS ${table.rowsecurity ? 'ENABLED ✅' : 'DISABLED ❌'}`);
    });
  }
}

async function auditTriggers() {
  console.log('\n\n⚡ AUDITING TRIGGERS\n');
  
  const { data: triggers, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `
  });

  if (error) {
    console.error('Error fetching triggers:', error);
    return;
  }

  // Group triggers by table
  const triggerMap = new Map<string, TriggerInfo[]>();
  triggers?.forEach((trigger: TriggerInfo) => {
    if (!triggerMap.has(trigger.event_object_table)) {
      triggerMap.set(trigger.event_object_table, []);
    }
    triggerMap.get(trigger.event_object_table)?.push(trigger);
  });

  triggerMap.forEach((triggers, tableName) => {
    console.log(`\n📋 Table: ${tableName}`);
    triggers.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name} (${trigger.event_manipulation})`);
      console.log(`    Action: ${trigger.action_statement}`);
    });
  });
}

async function auditMaterializedViews() {
  console.log('\n\n📊 AUDITING MATERIALIZED VIEWS\n');
  
  const { data: views, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        schemaname,
        matviewname,
        definition
      FROM pg_matviews
      WHERE schemaname = 'public'
      ORDER BY matviewname;
    `
  });

  if (error) {
    console.error('Error fetching materialized views:', error);
    return;
  }

  if (!views || views.length === 0) {
    console.log('No materialized views found');
  } else {
    views.forEach((view: any) => {
      console.log(`\n📌 ${view.matviewname}`);
      console.log(`Definition: ${view.definition.substring(0, 200)}...`);
    });
  }
}

async function checkDataIntegrity() {
  console.log('\n\n✅ CHECKING DATA INTEGRITY\n');
  
  // Check for orphaned records
  const integrityChecks = [
    {
      name: 'Orphaned shows (no artist)',
      query: `SELECT COUNT(*) as count FROM shows WHERE artist_id NOT IN (SELECT id FROM artists)`
    },
    {
      name: 'Orphaned songs (no artist)',
      query: `SELECT COUNT(*) as count FROM songs WHERE artist_id NOT IN (SELECT id FROM artists)`
    },
    {
      name: 'Orphaned setlists (no show)',
      query: `SELECT COUNT(*) as count FROM setlists WHERE show_id NOT IN (SELECT id FROM shows)`
    },
    {
      name: 'Orphaned setlist_songs (no setlist)',
      query: `SELECT COUNT(*) as count FROM setlist_songs WHERE setlist_id NOT IN (SELECT id FROM setlists)`
    },
    {
      name: 'Orphaned setlist_songs (no song)',
      query: `SELECT COUNT(*) as count FROM setlist_songs WHERE song_id NOT IN (SELECT id FROM songs)`
    },
    {
      name: 'Orphaned votes (no setlist_song)',
      query: `SELECT COUNT(*) as count FROM votes WHERE setlist_song_id NOT IN (SELECT id FROM setlist_songs)`
    }
  ];

  for (const check of integrityChecks) {
    const { data, error } = await supabase.rpc('sql', { query: check.query });
    if (error) {
      console.log(`❌ ${check.name}: Error - ${error.message}`);
    } else {
      const count = data?.[0]?.count || 0;
      if (count > 0) {
        console.log(`⚠️  ${check.name}: ${count} orphaned records found`);
      } else {
        console.log(`✅ ${check.name}: No orphaned records`);
      }
    }
  }
}

async function checkCronJobs() {
  console.log('\n\n⏰ CHECKING CRON JOBS\n');
  
  const { data: jobs, error } = await supabase.rpc('sql', {
    query: `
      SELECT 
        jobname,
        schedule,
        command,
        nodename,
        nodeport,
        database,
        username,
        active
      FROM cron.job
      ORDER BY jobname;
    `
  }).catch(() => ({ data: null, error: 'cron extension not installed' }));

  if (error || !jobs) {
    console.log('No cron jobs found (cron extension may not be installed)');
  } else {
    jobs.forEach((job: any) => {
      console.log(`\n📌 ${job.jobname}`);
      console.log(`  Schedule: ${job.schedule}`);
      console.log(`  Command: ${job.command}`);
      console.log(`  Active: ${job.active ? 'Yes' : 'No'}`);
    });
  }
}

async function generateSummary() {
  console.log('\n\n📝 SUMMARY AND RECOMMENDATIONS\n');
  
  const { data: tableCount } = await supabase.rpc('sql', {
    query: `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  });
  
  const { data: functionCount } = await supabase.rpc('sql', {
    query: `SELECT COUNT(*) as count FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'`
  });
  
  const { data: indexCount } = await supabase.rpc('sql', {
    query: `SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'`
  });

  console.log(`Tables: ${tableCount?.[0]?.count || 0}`);
  console.log(`Functions: ${functionCount?.[0]?.count || 0}`);
  console.log(`Indexes: ${indexCount?.[0]?.count || 0}`);
  
  console.log('\n🔍 Recommendations:');
  console.log('1. Ensure all empty migration files are either populated or removed');
  console.log('2. Consider adding indexes for foreign key columns if not already present');
  console.log('3. Review RLS policies to ensure proper access control');
  console.log('4. Set up cron jobs for regular maintenance tasks (trending calculation, etc.)');
  console.log('5. Consider partitioning large tables (votes, shows) by date for better performance');
}

// Main execution
async function runAudit() {
  console.log('🚀 Starting Supabase Database Audit');
  console.log('=' .repeat(80));
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('=' .repeat(80));

  try {
    await auditTables();
    await auditFunctions();
    await auditIndexes();
    await auditPolicies();
    await auditTriggers();
    await auditMaterializedViews();
    await checkDataIntegrity();
    await checkCronJobs();
    await generateSummary();
    
    console.log('\n\n✅ Audit complete!');
  } catch (error) {
    console.error('\n\n❌ Audit failed:', error);
  }
}

// Note about SQL RPC function
console.log('\n⚠️  NOTE: This audit script requires the sql RPC function to be available.');
console.log('If not available, you can create it with:');
console.log(`
CREATE OR REPLACE FUNCTION sql(query text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT array_to_json(array_agg(row_to_json(t))) FROM (' || query || ') t' INTO result;
  RETURN result;
END;
$$;
`);

runAudit();