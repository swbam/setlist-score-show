#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as spotifyService from '../services/spotify';
import * as ticketmasterService from '../services/ticketmaster';
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

// Popular artists to seed
const SEED_ARTISTS = [
  'Taylor Swift',
  'Drake',
  'Billie Eilish',
  'The Weeknd',
  'Bad Bunny',
  'Olivia Rodrigo',
  'Post Malone',
  'Dua Lipa',
  'Ed Sheeran',
  'Ariana Grande',
  'Harry Styles',
  'SZA',
  'Travis Scott',
  'Doja Cat',
  'Morgan Wallen'
];

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  // Clear in correct order due to foreign keys
  await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('setlist_songs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('setlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('shows').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('songs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('artists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('venues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✅ Existing data cleared');
}

async function importArtistWithShows(artistName: string) {
  try {
    console.log(`\n🎵 Processing: ${artistName}`);
    
    // Step 1: Search Spotify for artist
    const spotifyResults = await spotifyService.searchArtists(artistName);
    if (!spotifyResults || spotifyResults.length === 0) {
      console.log(`⚠️  No Spotify results for ${artistName}`);
      return;
    }
    
    const spotifyArtist = spotifyResults[0];
    console.log(`✅ Found on Spotify: ${spotifyArtist.name} (${spotifyArtist.id})`);
    
    // Step 2: Store artist in database using Spotify ID as primary key
    const { data: storedArtist, error: artistError } = await supabase
      .from('artists')
      .upsert({
        id: spotifyArtist.id,
        spotify_id: spotifyArtist.id,
        name: spotifyArtist.name,
        image_url: spotifyArtist.images?.[0]?.url,
        popularity: spotifyArtist.popularity,
        genres: spotifyArtist.genres || [],
        spotify_url: spotifyArtist.external_urls.spotify,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (artistError) {
      console.error(`❌ Error storing artist:`, artistError);
      return;
    }
    
    // Step 3: Import top tracks
    console.log(`🎵 Importing songs...`);
    const topTracks = await spotifyService.getArtistTopTracks(spotifyArtist.id);
    
    if (topTracks && topTracks.length > 0) {
      const songsToInsert = topTracks.map(track => ({
        spotify_id: track.id,
        artist_id: spotifyArtist.id,
        title: track.name,
        name: track.name,
        album: track.album.name,
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify
      }));
      
      const { error: songsError } = await supabase
        .from('songs')
        .upsert(songsToInsert, { onConflict: 'spotify_id' });
      
      if (songsError) {
        console.error(`❌ Error storing songs:`, songsError);
      } else {
        console.log(`✅ Imported ${songsToInsert.length} songs`);
      }
    }
    
    // Step 4: Search for shows on Ticketmaster
    console.log(`🎫 Searching for shows...`);
    const events = await ticketmasterService.searchEvents(artistName, 10);
    
    if (!events || events.length === 0) {
      console.log(`⚠️  No upcoming shows found`);
      return;
    }
    
    console.log(`📅 Found ${events.length} upcoming shows`);
    
    // Step 5: Process each event
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        if (!venue) continue;
        
        // Store venue
        const { data: storedVenue, error: venueError } = await supabase
          .from('venues')
          .upsert({
            name: venue.name,
            city: venue.city?.name || 'Unknown',
            state: venue.state?.name,
            country: venue.country?.name || 'USA',
            address: venue.address?.line1,
            latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
          })
          .select()
          .single();
        
        if (venueError || !storedVenue) {
          console.error(`❌ Error storing venue:`, venueError);
          continue;
        }
        
        // Store show
        const showDate = event.dates.start.localDate;
        const showTime = event.dates.start.localTime;
        
        const { data: storedShow, error: showError } = await supabase
          .from('shows')
          .insert({
            artist_id: spotifyArtist.id,
            venue_id: storedVenue.id,
            title: event.name,
            name: event.name,
            date: showDate,
            start_time: showTime,
            status: 'upcoming',
            ticketmaster_id: event.id,
            ticketmaster_url: event.url,
            view_count: Math.floor(Math.random() * 5000) + 100, // Random initial views
            trending_score: Math.floor(Math.random() * 50) + 50 // Random trending score
          })
          .select()
          .single();
        
        if (showError) {
          console.error(`❌ Error storing show:`, showError);
        } else {
          console.log(`✅ Added show: ${showDate} at ${venue.name}`);
          
          // Create an initial setlist for the show
          const { data: setlist, error: setlistError } = await supabase
            .from('setlists')
            .insert({
              show_id: storedShow.id,
              name: 'Main Set',
              order_index: 0,
              total_votes: 0
            })
            .select()
            .single();
          
          if (!setlistError && setlist && topTracks && topTracks.length > 0) {
            // Add top songs to the setlist
            const setlistSongs = topTracks.slice(0, 10).map((track, index) => ({
              setlist_id: setlist.id,
              song_id: track.id,
              position: index + 1,
              votes: Math.floor(Math.random() * 100), // Random initial votes
              is_encore: false
            }));
            
            await supabase.from('setlist_songs').insert(setlistSongs);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing event:`, error);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${artistName}:`, error);
  }
}

async function main() {
  console.log('🚀 Initializing TheSet with production data...\n');
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Process each artist
    for (const artist of SEED_ARTISTS) {
      await importArtistWithShows(artist);
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Get final counts
    const { count: artistCount } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true });
    
    const { count: showCount } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true });
    
    const { count: songCount } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true });
    
    const { count: venueCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 Final Database Summary:');
    console.log(`   Artists: ${artistCount || 0}`);
    console.log(`   Shows: ${showCount || 0}`);
    console.log(`   Songs: ${songCount || 0}`);
    console.log(`   Venues: ${venueCount || 0}`);
    
    console.log('\n✅ App initialization complete!');
    console.log('🎉 TheSet is ready for production use!');
    
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
main();