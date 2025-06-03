#!/usr/bin/env node
/**
 * Complete Production Data Sync Script
 * This script completes the data sync by:
 * 1. Importing remaining songs for all artists
 * 2. Creating setlists for all shows
 */

import { createClient } from '@supabase/supabase-js';
import * as spotifyService from '../services/spotify';
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

/**
 * Import songs for an artist
 */
async function importSongsForArtist(artist: any): Promise<number> {
  try {
    // Check if artist already has songs
    const { count: existingSongs } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artist.id);
    
    if (existingSongs && existingSongs > 0) {
      console.log(`✅ Artist ${artist.name} already has ${existingSongs} songs`);
      return existingSongs;
    }
    
    console.log(`🎵 Importing songs for ${artist.name}...`);
    const tracks = await spotifyService.getArtistTopTracks(artist.spotify_id);
    
    if (tracks.length > 0) {
      const songsToInsert = tracks.map(track => ({
        name: track.name,
        title: track.name,
        artist_id: artist.id,
        spotify_id: track.id,
        album: track.album?.name || 'Unknown Album',
        duration_ms: track.duration_ms || 0,
        popularity: track.popularity || 0,
        spotify_url: track.external_urls?.spotify || ''
      }));
      
      const { error } = await supabase
        .from('songs')
        .upsert(songsToInsert, { onConflict: 'spotify_id' });
      
      if (error) {
        console.error(`❌ Error inserting songs:`, error);
        return 0;
      } else {
        console.log(`✅ Imported ${songsToInsert.length} songs`);
        return songsToInsert.length;
      }
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error importing songs for ${artist.name}:`, error);
    return 0;
  }
}

/**
 * Create setlist for a show
 */
async function createSetlistForShow(show: any): Promise<boolean> {
  try {
    // Check if show already has a setlist
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', show.id)
      .maybeSingle();
    
    if (existingSetlist) {
      return true;
    }
    
    // Get 5 random songs from artist
    const { data: songs } = await supabase
      .from('songs')
      .select('id, name')
      .eq('artist_id', show.artist_id)
      .order('popularity', { ascending: false })
      .limit(20);
    
    if (!songs || songs.length === 0) {
      return false;
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
        show_id: show.id,
        name: 'Main Set',
        order_index: 0,
        total_votes: 0
      })
      .select()
      .single();
    
    if (setlistError || !setlist) {
      console.error(`❌ Error creating setlist:`, setlistError);
      return false;
    }
    
    // Add songs to setlist
    const setlistSongs = selectedSongs.map((song, index) => ({
      setlist_id: setlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0,
      is_encore: false
    }));
    
    const { error: songsError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);
    
    if (songsError) {
      console.error(`❌ Error adding songs to setlist:`, songsError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating setlist for show:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Completing TheSet Production Data Sync');
  console.log('📋 Tasks:');
  console.log('   - Import songs for all artists');
  console.log('   - Create setlists for all shows\n');
  
  try {
    // Get all artists
    const { data: artists } = await supabase
      .from('artists')
      .select('*')
      .order('name');
    
    if (!artists || artists.length === 0) {
      console.log('❌ No artists found');
      return;
    }
    
    console.log(`📊 Found ${artists.length} artists\n`);
    
    // Import songs for each artist
    let totalSongs = 0;
    for (const artist of artists) {
      const songsImported = await importSongsForArtist(artist);
      totalSongs += songsImported;
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Total songs in database: ${totalSongs}\n`);
    
    // Get all shows that have artists with songs
    const { data: shows } = await supabase
      .from('shows')
      .select('id, name, artist_id')
      .in('artist_id', artists.filter(a => a.spotify_id).map(a => a.id));
    
    if (!shows || shows.length === 0) {
      console.log('❌ No shows found');
      return;
    }
    
    console.log(`📊 Found ${shows.length} shows to process\n`);
    
    // Create setlists for each show
    let setlistsCreated = 0;
    for (const show of shows) {
      console.log(`🎵 Creating setlist for show: ${show.name}`);
      const created = await createSetlistForShow(show);
      if (created) setlistsCreated++;
    }
    
    console.log(`\n✅ Created ${setlistsCreated} setlists`);
    
    // Get final statistics
    const stats = await Promise.all([
      supabase.from('artists').select('*', { count: 'exact', head: true }),
      supabase.from('shows').select('*', { count: 'exact', head: true }),
      supabase.from('songs').select('*', { count: 'exact', head: true }),
      supabase.from('venues').select('*', { count: 'exact', head: true }),
      supabase.from('setlists').select('*', { count: 'exact', head: true }),
      supabase.from('setlist_songs').select('*', { count: 'exact', head: true })
    ]);
    
    console.log('\n📊 Final Database Statistics:');
    console.log(`   Artists: ${stats[0].count || 0}`);
    console.log(`   Shows: ${stats[1].count || 0}`);
    console.log(`   Songs: ${stats[2].count || 0}`);
    console.log(`   Venues: ${stats[3].count || 0}`);
    console.log(`   Setlists: ${stats[4].count || 0}`);
    console.log(`   Setlist Songs: ${stats[5].count || 0}`);
    
    console.log('\n✅ Production data sync complete!');
    console.log('🎉 TheSet is now fully populated with real data!');
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
main();