#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

async function testEndpoints() {
  console.log('🧪 Testing API endpoints...\n');
  
  // Test 1: Get trending shows
  console.log('1️⃣ Testing trending shows endpoint...');
  const { data: trendingShows, error: trendingError } = await supabase
    .from('shows')
    .select(`
      id,
      name,
      date,
      view_count,
      trending_score,
      venues!inner (name, city, state),
      artists!inner (id, name, image_url)
    `)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('trending_score', { ascending: false })
    .limit(5);
  
  if (trendingError) {
    console.error('❌ Error:', trendingError);
  } else {
    console.log(`✅ Found ${trendingShows?.length} trending shows`);
    trendingShows?.forEach((show, i) => {
      console.log(`   ${i + 1}. ${show.name} - ${show.artists?.name} (Score: ${show.trending_score})`);
    });
  }
  
  // Test 2: Search for artists
  console.log('\n2️⃣ Testing artist search...');
  const { data: artists, error: artistError } = await supabase
    .from('artists')
    .select('id, name, image_url, popularity')
    .ilike('name', '%taylor%')
    .limit(3);
  
  if (artistError) {
    console.error('❌ Error:', artistError);
  } else {
    console.log(`✅ Found ${artists?.length} artists matching 'taylor'`);
    artists?.forEach(artist => {
      console.log(`   - ${artist.name} (Popularity: ${artist.popularity})`);
    });
  }
  
  // Test 3: Get a show with setlist
  console.log('\n3️⃣ Testing show with setlist...');
  const { data: showWithSetlist } = await supabase
    .from('shows')
    .select(`
      id,
      name,
      date,
      setlists (
        id,
        name,
        setlist_songs (
          id,
          position,
          votes,
          songs (
            name,
            album
          )
        )
      )
    `)
    .limit(1)
    .single();
  
  if (showWithSetlist && showWithSetlist.setlists?.length > 0) {
    console.log(`✅ Show: ${showWithSetlist.name}`);
    const setlist = showWithSetlist.setlists[0];
    console.log(`   Setlist: ${setlist.name}`);
    console.log(`   Songs: ${setlist.setlist_songs?.length || 0}`);
  }
  
  // Test 4: Database statistics
  console.log('\n4️⃣ Database statistics:');
  const stats = await Promise.all([
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('shows').select('*', { count: 'exact', head: true }),
    supabase.from('songs').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase.from('setlists').select('*', { count: 'exact', head: true })
  ]);
  
  console.log(`   Artists: ${stats[0].count}`);
  console.log(`   Shows: ${stats[1].count}`);
  console.log(`   Songs: ${stats[2].count}`);
  console.log(`   Venues: ${stats[3].count}`);
  console.log(`   Setlists: ${stats[4].count}`);
  
  console.log('\n✅ API endpoint tests complete!');
}

testEndpoints().catch(console.error);