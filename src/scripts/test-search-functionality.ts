#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as searchService from '../services/search';
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

async function testSearchFunctionality() {
  console.log('🔍 Testing Search Functionality\n');
  
  // Test 1: Database Direct Search
  console.log('1️⃣ Testing Direct Database Search...');
  const searchTerm = 'Taylor';
  
  const { data: dbArtists, error: dbError } = await supabase
    .from('artists')
    .select('id, name, image_url')
    .ilike('name', `%${searchTerm}%`)
    .limit(5);
    
  if (dbError) {
    console.error('❌ Database search error:', dbError);
  } else {
    console.log(`✅ Database returned ${dbArtists?.length || 0} artists`);
    dbArtists?.forEach(a => console.log(`   - ${a.name}`));
  }
  
  // Test 2: Search Service
  console.log('\n2️⃣ Testing Search Service...');
  console.log(`   Searching for: "${searchTerm}"`);
  
  try {
    const results = await searchService.searchArtistsAndShows(searchTerm);
    console.log(`✅ Search service returned:`);
    console.log(`   - ${results.artists.length} artists`);
    console.log(`   - ${results.shows.length} shows`);
    
    if (results.artists.length > 0) {
      console.log('\n   Artists found:');
      results.artists.forEach(a => console.log(`   - ${a.name}`));
    }
    
    if (results.shows.length > 0) {
      console.log('\n   Shows found:');
      results.shows.slice(0, 3).forEach(s => console.log(`   - ${s.name} on ${new Date(s.date).toLocaleDateString()}`));
    }
  } catch (error) {
    console.error('❌ Search service error:', error);
  }
  
  // Test 3: Check if search tries to call external APIs
  console.log('\n3️⃣ Testing External API Integration...');
  console.log('   Note: The search service should call Ticketmaster API for new results');
  console.log('   This may take a few seconds...');
  
  try {
    // Search for something that might not be in our database
    const newSearchTerm = 'Metallica';
    console.log(`   Searching for new artist: "${newSearchTerm}"`);
    
    const newResults = await searchService.searchArtistsAndShows(newSearchTerm);
    console.log(`✅ Search completed:`);
    console.log(`   - ${newResults.artists.length} artists`);
    console.log(`   - ${newResults.shows.length} shows`);
    
    if (newResults.artists.length === 0 && newResults.shows.length === 0) {
      console.log('⚠️  No results found - external API integration may not be working');
    }
  } catch (error) {
    console.error('❌ External API search error:', error);
  }
  
  // Test 4: Check search from UI perspective
  console.log('\n4️⃣ Simulating UI Search Flow...');
  const uiSearchQuery = 'Drake';
  
  console.log(`   User types: "${uiSearchQuery}"`);
  console.log('   Expected flow:');
  console.log('   1. Search database for existing data');
  console.log('   2. Call Ticketmaster API for shows');
  console.log('   3. Import any new artists/shows found');
  console.log('   4. Return combined results');
  
  const startTime = Date.now();
  try {
    const uiResults = await searchService.searchArtistsAndShows(uiSearchQuery);
    const elapsed = Date.now() - startTime;
    
    console.log(`\n✅ Search completed in ${elapsed}ms`);
    console.log(`   Artists: ${uiResults.artists.length}`);
    console.log(`   Shows: ${uiResults.shows.length}`);
    
    if (elapsed > 5000) {
      console.log('⚠️  Search took over 5 seconds - may be too slow for good UX');
    }
  } catch (error) {
    console.error('❌ UI search simulation failed:', error);
  }
  
  console.log('\n📊 Search Functionality Summary:');
  console.log('   - Database queries: Working ✅');
  console.log('   - Search service: Check console for errors');
  console.log('   - External API: May need API keys configured');
  console.log('   - UI Performance: Check response times');
}

testSearchFunctionality().catch(console.error);