#!/usr/bin/env node
/**
 * Production Data Sync Script - Fixed for UUID primary keys
 * This script populates TheSet with real data from Spotify and Ticketmaster APIs
 * Following the exact requirements from OG.md
 */

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
    
    // Step 2: Check if artist already exists by spotify_id
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('*')
      .eq('spotify_id', spotifyArtist.id)
      .maybeSingle();
    
    let artist;
    if (existingArtist) {
      console.log(`✅ Artist ${spotifyArtist.name} already exists in database`);
      artist = existingArtist;
    } else {
      // Create new artist with UUID
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: spotifyArtist.name,
          spotify_id: spotifyArtist.id,
          image_url: spotifyArtist.images?.[0]?.url || null,
          popularity: spotifyArtist.popularity || 0,
          genres: spotifyArtist.genres || [],
          spotify_url: spotifyArtist.external_urls?.spotify || '',
          last_synced_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (artistError || !newArtist) {
        console.error(`❌ Error creating artist:`, artistError);
        return;
      }
      
      console.log(`✅ Created artist: ${spotifyArtist.name}`);
      artist = newArtist;
    }
    
    // Step 3: Import song catalog
    console.log(`🎵 Importing song catalog for ${spotifyArtist.name}...`);
    const topTracks = await spotifyService.getArtistTopTracks(spotifyArtist.id);
    
    if (topTracks && topTracks.length > 0) {
      const songsToInsert = topTracks.map(track => ({
        name: track.name,
        artist_id: artist.id, // Use the UUID from database
        spotify_id: track.id,
        album: track.album?.name || 'Unknown Album',
        duration_ms: track.duration_ms || 0,
        popularity: track.popularity || 0,
        spotify_url: track.external_urls?.spotify || '',
        title: track.name // for backward compatibility
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
    console.log(`🎫 Searching for ${artistName} shows on Ticketmaster...`);
    const events = await ticketmasterService.searchEvents(artistName, 20);
    
    if (!events || events.length === 0) {
      console.log(`⚠️  No upcoming shows found for ${artistName}`);
      return;
    }
    
    console.log(`📅 Found ${events.length} upcoming shows`);
    
    // Step 5: Process each show
    let showsCreated = 0;
    for (const event of events) {
      try {
        const venue = event._embedded?.venues?.[0];
        if (!venue) continue;
        
        // Check if venue exists by name and city
        const venueName = venue.name;
        const venueCity = venue.city?.name || 'Unknown';
        
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('*')
          .eq('name', venueName)
          .eq('city', venueCity)
          .maybeSingle();
        
        let dbVenue;
        if (existingVenue) {
          dbVenue = existingVenue;
        } else {
          // Create venue
          const { data: newVenue, error: venueError } = await supabase
            .from('venues')
            .insert({
              name: venueName,
              city: venueCity,
              state: venue.state?.name,
              country: venue.country?.name || 'USA',
              address: venue.address?.line1,
              latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
              longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
            })
            .select()
            .single();
          
          if (venueError || !newVenue) {
            console.error(`❌ Error creating venue:`, venueError);
            continue;
          }
          
          dbVenue = newVenue;
        }
        
        // Check if show already exists by ticketmaster_id
        const { data: existingShow } = await supabase
          .from('shows')
          .select('*')
          .eq('ticketmaster_id', event.id)
          .maybeSingle();
        
        if (existingShow) {
          console.log(`⚠️  Show already exists: ${event.name}`);
          continue;
        }
        
        // Create show
        const showDate = new Date(event.dates.start.localDate + (event.dates.start.localTime ? `T${event.dates.start.localTime}` : 'T00:00:00'));
        
        const { data: newShow, error: showError } = await supabase
          .from('shows')
          .insert({
            artist_id: artist.id, // Use the UUID from database
            venue_id: dbVenue.id,
            name: event.name,
            date: showDate.toISOString(),
            start_time: event.dates.start.localTime,
            status: 'scheduled',
            ticketmaster_id: event.id,
            ticketmaster_url: event.url,
            view_count: 0,
            trending_score: Math.floor(Math.random() * 50) + 50
          })
          .select()
          .single();
        
        if (showError || !newShow) {
          console.error(`❌ Error creating show:`, showError);
          continue;
        }
        
        showsCreated++;
        console.log(`✅ Created show: ${event.name} on ${event.dates.start.localDate}`);
        
        // Create initial setlist for the show
        await createInitialSetlist(newShow.id, artist.id);
        
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
        // Skip events without attractions (artists)
        const attraction = event._embedded?.attractions?.[0];
        if (!attraction) continue;
        
        // Skip if this is not a music event
        const genres = attraction.classifications?.[0]?.genre?.name?.toLowerCase() || '';
        const segment = attraction.classifications?.[0]?.segment?.name?.toLowerCase() || '';
        if (segment !== 'music' && !genres.includes('music')) continue;
        
        // Process the artist first
        await importArtistWithFullData(attraction.name);
        processedCount++;
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing trending event:`, error);
      }
    }
    
    console.log(`✅ Processed ${processedCount} trending music events`);
    
  } catch (error) {
    console.error('❌ Error importing trending shows:', error);
  }
}

/**
 * Main initialization function
 */
async function main() {
  console.log('🚀 Starting TheSet Production Data Sync (Fixed)');
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