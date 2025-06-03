#!/usr/bin/env node
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

async function testSongImport() {
  // Get Taylor Swift from database
  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .eq('name', 'Taylor Swift')
    .single();
  
  if (!artist) {
    console.error('Taylor Swift not found in database');
    return;
  }
  
  console.log('Found artist:', artist);
  
  // Get top tracks
  const tracks = await spotifyService.getArtistTopTracks(artist.spotify_id);
  console.log(`Found ${tracks.length} tracks`);
  
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
    
    console.log('Inserting songs:', songsToInsert.slice(0, 2));
    
    const { data, error } = await supabase
      .from('songs')
      .insert(songsToInsert)
      .select();
    
    if (error) {
      console.error('Error inserting songs:', error);
    } else {
      console.log(`Successfully inserted ${data?.length} songs`);
    }
  }
}

testSongImport().catch(console.error);