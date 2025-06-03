#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as ticketmasterService from '../services/ticketmaster';
import * as spotifyService from '../services/spotify';
import * as dataConsistency from '../services/dataConsistency';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

console.log('🚀 Starting manual data import...');

const popularArtists = [
  'Taylor Swift',
  'Drake',
  'Billie Eilish',
  'The Weeknd',
  'Bad Bunny',
  'Olivia Rodrigo',
  'Ed Sheeran',
  'Ariana Grande',
  'Post Malone',
  'Dua Lipa',
  'Harry Styles',
  'Bruno Mars',
  'Beyoncé',
  'Kendrick Lamar',
  'Travis Scott'
];

async function importArtistData(artistName: string) {
  try {
    console.log(`\n🎵 Processing artist: ${artistName}`);
    
    // Search for the artist on Spotify
    const spotifyResults = await spotifyService.searchArtists(artistName);
    if (!spotifyResults || spotifyResults.length === 0) {
      console.log(`⚠️  No Spotify results for ${artistName}`);
      return;
    }
    
    const spotifyArtist = spotifyResults[0];
    console.log(`✅ Found on Spotify: ${spotifyArtist.name} (ID: ${spotifyArtist.id})`);
    
    // Store artist in database - use spotify ID as primary key
    const { data: storedArtist, error: artistError } = await supabase
      .from('artists')
      .upsert({
        id: spotifyArtist.id, // Using Spotify ID as primary key
        name: spotifyArtist.name,
        spotify_id: spotifyArtist.id,
        image_url: spotifyArtist.images?.[0]?.url,
        popularity: spotifyArtist.popularity,
        genres: spotifyArtist.genres,
        spotify_url: spotifyArtist.external_urls.spotify,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (artistError) {
      console.error(`❌ Error storing artist ${artistName}:`, artistError);
      return;
    }
    
    console.log(`💾 Artist stored in database`);
    
    // Import artist's top songs
    console.log(`🎵 Importing top tracks...`);
    const topTracks = await spotifyService.getArtistTopTracks(spotifyArtist.id);
    
    if (topTracks && topTracks.length > 0) {
      const songsToInsert = topTracks.map(track => ({
        spotify_id: track.id,
        artist_id: spotifyArtist.id,
        title: track.name,
        name: track.name, // Add both for compatibility
        album: track.album.name,
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify
      }));
      
      const { error: songsError } = await supabase
        .from('songs')
        .upsert(songsToInsert);
      
      if (songsError) {
        console.error(`❌ Error storing songs:`, songsError);
      } else {
        console.log(`✅ Imported ${songsToInsert.length} songs`);
      }
    }
    
    // Search for shows on Ticketmaster
    console.log(`🎫 Searching for shows on Ticketmaster...`);
    const tmEvents = await ticketmasterService.searchEvents(artistName, 10);
    
    if (tmEvents && tmEvents.length > 0) {
      console.log(`📅 Found ${tmEvents.length} upcoming shows`);
      
      for (const event of tmEvents) {
        try {
          await dataConsistency.processTicketmasterEvent(event);
          console.log(`✅ Processed show: ${event.name} - ${event.dates.start.localDate}`);
        } catch (error) {
          console.error(`❌ Error processing show ${event.id}:`, error);
        }
      }
    } else {
      console.log(`⚠️  No upcoming shows found for ${artistName}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error(`❌ Error processing ${artistName}:`, error);
  }
}

async function main() {
  try {
    // Process each artist
    for (const artist of popularArtists) {
      await importArtistData(artist);
    }
    
    // Check final counts
    const { count: artistCount } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true });
    
    const { count: showCount } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true });
    
    const { count: songCount } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 Import Summary:');
    console.log(`   Artists: ${artistCount || 0}`);
    console.log(`   Shows: ${showCount || 0}`);
    console.log(`   Songs: ${songCount || 0}`);
    
    console.log('\n✅ Data import completed!');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
main();