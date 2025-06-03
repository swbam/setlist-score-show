#!/usr/bin/env node
/**
 * Production Data Sync Script
 * This script populates TheSet with real data from Spotify and Ticketmaster APIs
 * Following the exact requirements from OG.md
 */

import { createClient } from '@supabase/supabase-js';
import * as spotifyService from '../services/spotify';
import * as ticketmasterService from '../services/ticketmaster';
import * as dataConsistency from '../services/dataConsistency';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Popular artists to start with (from trending charts)
const INITIAL_ARTISTS = [
  'Taylor Swift',
  'Drake',
  'The Weeknd',
  'Bad Bunny',
  'SZA',
  'Travis Scott',
  'Olivia Rodrigo',
  'Dua Lipa',
  'Morgan Wallen',
  'Doja Cat',
  'Post Malone',
  'Billie Eilish',
  'Harry Styles',
  'Ed Sheeran',
  'Ariana Grande'
];

/**
 * Create initial setlist for a show with 5 random songs from artist's catalog
 * Per OG.md: "Initial setlist 5 songs vote count set to 0"
 */
async function createInitialSetlist(showId: string, artistId: string): Promise<void> {
  try {
    console.log(`🎵 Creating initial setlist for show ${showId}`);
    
    // Get 5 random songs from artist's catalog
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, name')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(20); // Get top 20 to randomly pick from
    
    if (songsError || !songs || songs.length === 0) {
      console.error('❌ No songs found for artist:', artistId);
      return;
    }
    
    // Randomly select 5 songs
    const selectedSongs = [];
    const songsCopy = [...songs];
    for (let i = 0; i < Math.min(5, songsCopy.length); i++) {
      const randomIndex = Math.floor(Math.random() * songsCopy.length);
      selectedSongs.push(songsCopy.splice(randomIndex, 1)[0]);
    }
    
    // Create setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        name: 'Main Set',
        order_index: 0,
        total_votes: 0
      })
      .select()
      .single();
    
    if (setlistError || !setlist) {
      console.error('❌ Error creating setlist:', setlistError);
      return;
    }
    
    // Add songs to setlist with 0 votes
    const setlistSongs = selectedSongs.map((song, index) => ({
      setlist_id: setlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0, // Initial vote count is 0 as per spec
      is_encore: false
    }));
    
    const { error: songsInsertError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);
    
    if (songsInsertError) {
      console.error('❌ Error adding songs to setlist:', songsInsertError);
    } else {
      console.log(`✅ Created setlist with ${selectedSongs.length} songs (0 initial votes each)`);
    }
    
  } catch (error) {
    console.error('❌ Error creating initial setlist:', error);
  }
}

/**
 * Import artist with full catalog and shows
 */
async function importArtistWithFullData(artistName: string): Promise<void> {
  try {
    console.log(`\n🎤 Processing artist: ${artistName}`);
    
    // Step 1: Search for artist on Spotify
    const spotifyResults = await spotifyService.searchArtists(artistName);
    if (!spotifyResults || spotifyResults.length === 0) {
      console.log(`⚠️  No Spotify results for ${artistName}`);
      return;
    }
    
    const spotifyArtist = spotifyResults[0];
    console.log(`✅ Found on Spotify: ${spotifyArtist.name} (${spotifyArtist.id})`);
    
    // Step 2: Ensure artist exists with full data
    const artist = await dataConsistency.ensureArtistExists({
      id: spotifyArtist.id,
      name: spotifyArtist.name
    });
    
    if (!artist) {
      console.error(`❌ Failed to ensure artist exists: ${artistName}`);
      return;
    }
    
    // Step 3: Search for shows on Ticketmaster
    console.log(`🎫 Searching for ${artistName} shows on Ticketmaster...`);
    const events = await ticketmasterService.searchEvents(artistName, 20);
    
    if (!events || events.length === 0) {
      console.log(`⚠️  No upcoming shows found for ${artistName}`);
      return;
    }
    
    console.log(`📅 Found ${events.length} upcoming shows`);
    
    // Step 4: Process each show
    let showsCreated = 0;
    for (const event of events) {
      try {
        // Process the complete Ticketmaster event
        const processed = await dataConsistency.processTicketmasterEvent(event);
        
        if (processed && processed.show) {
          showsCreated++;
          // Create initial setlist for the show
          await createInitialSetlist(processed.show.id, artist.id);
        }
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error);
      }
    }
    
    console.log(`✅ Created ${showsCreated} shows for ${artistName}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${artistName}:`, error);
  }
}

/**
 * Import trending shows from Ticketmaster
 * Per OG.md: "Trending and most popular shows on the homepage that auto import to Supabase every 6 hours"
 */
async function importTrendingShows(): Promise<void> {
  console.log('\n🔥 Importing trending shows from Ticketmaster...');
  
  try {
    // Get events by different criteria for trending
    const popularEvents = await ticketmasterService.searchEvents('', 50); // General popular events
    
    if (!popularEvents || popularEvents.length === 0) {
      console.log('⚠️  No trending events found');
      return;
    }
    
    console.log(`📊 Processing ${popularEvents.length} trending events`);
    
    let processedCount = 0;
    for (const event of popularEvents) {
      try {
        const processed = await dataConsistency.processTicketmasterEvent(event);
        
        if (processed && processed.show && processed.artist) {
          processedCount++;
          // Create initial setlist
          await createInitialSetlist(processed.show.id, processed.artist.id);
          
          // Update trending score based on ticket sales/popularity
          const trendingScore = Math.floor(Math.random() * 50) + 50; // Would use real metrics in production
          await supabase
            .from('shows')
            .update({ trending_score: trendingScore })
            .eq('id', processed.show.id);
        }
      } catch (error) {
        console.error(`❌ Error processing trending event:`, error);
      }
    }
    
    console.log(`✅ Processed ${processedCount} trending shows`);
    
  } catch (error) {
    console.error('❌ Error importing trending shows:', error);
  }
}

/**
 * Main initialization function
 */
async function main() {
  console.log('🚀 Starting TheSet Production Data Sync');
  console.log('📋 Following requirements from OG.md:');
  console.log('   - Import artists from Spotify API');
  console.log('   - Import shows from Ticketmaster API');
  console.log('   - Import full song catalogs for each artist');
  console.log('   - Create initial setlists with 5 random songs (0 votes)');
  console.log('   - Import trending shows for homepage\n');
  
  try {
    // Process initial artists
    console.log('🎵 Importing initial artists and their shows...');
    for (const artist of INITIAL_ARTISTS) {
      await importArtistWithFullData(artist);
      // Rate limit between artists
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Import trending shows
    await importTrendingShows();
    
    // Get final statistics
    const stats = await Promise.all([
      supabase.from('artists').select('*', { count: 'exact', head: true }),
      supabase.from('shows').select('*', { count: 'exact', head: true }),
      supabase.from('songs').select('*', { count: 'exact', head: true }),
      supabase.from('venues').select('*', { count: 'exact', head: true }),
      supabase.from('setlists').select('*', { count: 'exact', head: true })
    ]);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Artists: ${stats[0].count || 0}`);
    console.log(`   Shows: ${stats[1].count || 0}`);
    console.log(`   Songs: ${stats[2].count || 0}`);
    console.log(`   Venues: ${stats[3].count || 0}`);
    console.log(`   Setlists: ${stats[4].count || 0}`);
    
    console.log('\n✅ Production data sync complete!');
    console.log('🎉 TheSet is now populated with real data from Spotify and Ticketmaster');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}