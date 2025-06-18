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

async function refreshTrending() {
  try {
    console.log('🔄 Refreshing homepage cache (which includes trending shows)...');
    
    // Call the RPC function to refresh the homepage cache
    const { data, error } = await supabase.rpc('refresh_homepage_cache');
    
    if (error) {
      console.error('❌ Error refreshing homepage cache:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully refreshed homepage cache');
    
    // Now query the trending shows from the cache
    const { data: cachedShows, error: cacheError } = await supabase
      .from('homepage_cache')
      .select('data')
      .eq('cache_key', 'top_shows')
      .single();
      
    if (cacheError) {
      console.error('❌ Error fetching cached shows:', cacheError);
    } else {
      const shows = cachedShows?.data || [];
      console.log(`\n📊 Found ${shows.length} trending shows in cache`);
      if (shows.length > 0) {
        console.log('\nTop 5 trending shows:');
        shows.slice(0, 5).forEach((show: any, index: number) => {
          console.log(`${index + 1}. ${show.artist?.name || 'Unknown Artist'} - ${show.venue?.name || 'Unknown Venue'} (${new Date(show.date).toLocaleDateString()})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

refreshTrending();