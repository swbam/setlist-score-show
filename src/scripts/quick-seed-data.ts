// Quick script to seed some test data directly to Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🌱 Starting to seed data...');

  // Sample artists data - using real Spotify IDs
  const artists = [
    {
      id: '06HL4z0CvFAxyc27GXpf02',
      spotify_id: '06HL4z0CvFAxyc27GXpf02',
      name: 'Taylor Swift',
      image_url: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0',
      genres: ['pop', 'country'],
      popularity: 98,
      spotify_url: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02'
    },
    {
      id: '3TVXtAsR1Inumwj472S9r4',
      spotify_id: '3TVXtAsR1Inumwj472S9r4',
      name: 'Drake',
      image_url: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
      genres: ['hip hop', 'rap'],
      popularity: 95,
      spotify_url: 'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4'
    },
    {
      id: '6qqNVTkY8uBg9cP3Jd7DAH',
      spotify_id: '6qqNVTkY8uBg9cP3Jd7DAH',
      name: 'Billie Eilish',
      image_url: 'https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf',
      genres: ['pop', 'electropop'],
      popularity: 92,
      spotify_url: 'https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH'
    },
    {
      id: '1Xyo4u8uXC1ZmMpatF05PJ',
      spotify_id: '1Xyo4u8uXC1ZmMpatF05PJ',
      name: 'The Weeknd',
      image_url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
      genres: ['r&b', 'pop'],
      popularity: 94,
      spotify_url: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ'
    },
    {
      id: '4q3ewBCX7sLwd24euuV69X',
      spotify_id: '4q3ewBCX7sLwd24euuV69X',
      name: 'Bad Bunny',
      image_url: 'https://i.scdn.co/image/ab6761610000e5eb7303dd9b01918fdeb89ffa22',
      genres: ['reggaeton', 'latin'],
      popularity: 93,
      spotify_url: 'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X'
    }
  ];

  // Insert artists - let database generate IDs
  const artistsToInsert = artists.map(({ id, ...artist }) => artist);
  const { data: insertedArtists, error: artistsError } = await supabase
    .from('artists')
    .upsert(artistsToInsert, { onConflict: 'spotify_id' })
    .select();

  if (artistsError) {
    console.error('❌ Error inserting artists:', artistsError);
    return;
  }

  console.log('✅ Artists inserted successfully');

  // Sample venues
  const venues = [
    {
      id: '1',
      name: 'Madison Square Garden',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      latitude: 40.7505,
      longitude: -73.9934
    },
    {
      id: '2',
      name: 'The Forum',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      latitude: 33.9583,
      longitude: -118.3417
    },
    {
      id: '3',
      name: 'United Center',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      latitude: 41.8807,
      longitude: -87.6742
    }
  ];

  const { error: venuesError } = await supabase
    .from('venues')
    .upsert(venues, { onConflict: 'id' });

  if (venuesError) {
    console.error('❌ Error inserting venues:', venuesError);
    return;
  }

  console.log('✅ Venues inserted successfully');

  // Sample shows (upcoming dates)
  const shows = [
    {
      id: '1',
      artist_id: '1',
      venue_id: '1',
      title: 'Taylor Swift - The Eras Tour',
      name: 'Taylor Swift - The Eras Tour',
      date: '2025-02-15',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 12500,
      trending_score: 95
    },
    {
      id: '2',
      artist_id: '2',
      venue_id: '2',
      title: 'Drake - It\'s All A Blur Tour',
      name: 'Drake - It\'s All A Blur Tour',
      date: '2025-02-20',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 8900,
      trending_score: 88
    },
    {
      id: '3',
      artist_id: '3',
      venue_id: '3',
      title: 'Billie Eilish - Happier Than Ever Tour',
      name: 'Billie Eilish - Happier Than Ever Tour',
      date: '2025-03-01',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 9800,
      trending_score: 91
    },
    {
      id: '4',
      artist_id: '4',
      venue_id: '1',
      title: 'The Weeknd - After Hours Til Dawn Tour',
      name: 'The Weeknd - After Hours Til Dawn Tour',
      date: '2025-03-10',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 7600,
      trending_score: 85
    },
    {
      id: '5',
      artist_id: '5',
      venue_id: '2',
      title: 'Bad Bunny - Most Wanted Tour',
      name: 'Bad Bunny - Most Wanted Tour',
      date: '2025-03-15',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 11200,
      trending_score: 92
    },
    {
      id: '6',
      artist_id: '1',
      venue_id: '3',
      title: 'Taylor Swift - The Eras Tour',
      name: 'Taylor Swift - The Eras Tour',
      date: '2025-03-20',
      ticketmaster_url: 'https://ticketmaster.com',
      view_count: 13400,
      trending_score: 96
    }
  ];

  const { error: showsError } = await supabase
    .from('shows')
    .upsert(shows, { onConflict: 'id' });

  if (showsError) {
    console.error('❌ Error inserting shows:', showsError);
    return;
  }

  console.log('✅ Shows inserted successfully');

  // Sample songs for each artist
  const songs = [
    // Taylor Swift songs
    { spotify_id: 'ts1', artist_id: '1', title: 'Anti-Hero', name: 'Anti-Hero', album: 'Midnights', duration_ms: 200000, popularity: 95 },
    { spotify_id: 'ts2', artist_id: '1', title: 'Shake It Off', name: 'Shake It Off', album: '1989', duration_ms: 219000, popularity: 90 },
    { spotify_id: 'ts3', artist_id: '1', title: 'Blank Space', name: 'Blank Space', album: '1989', duration_ms: 231000, popularity: 88 },
    { spotify_id: 'ts4', artist_id: '1', title: 'Love Story', name: 'Love Story', album: 'Fearless', duration_ms: 236000, popularity: 85 },
    { spotify_id: 'ts5', artist_id: '1', title: 'You Belong With Me', name: 'You Belong With Me', album: 'Fearless', duration_ms: 232000, popularity: 83 },
    
    // Drake songs
    { spotify_id: 'd1', artist_id: '2', title: 'One Dance', name: 'One Dance', album: 'Views', duration_ms: 173000, popularity: 92 },
    { spotify_id: 'd2', artist_id: '2', title: 'God\'s Plan', name: 'God\'s Plan', album: 'Scorpion', duration_ms: 198000, popularity: 91 },
    { spotify_id: 'd3', artist_id: '2', title: 'Hotline Bling', name: 'Hotline Bling', album: 'Views', duration_ms: 267000, popularity: 89 },
    { spotify_id: 'd4', artist_id: '2', title: 'In My Feelings', name: 'In My Feelings', album: 'Scorpion', duration_ms: 217000, popularity: 87 },
    { spotify_id: 'd5', artist_id: '2', title: 'Started From the Bottom', name: 'Started From the Bottom', album: 'Nothing Was the Same', duration_ms: 174000, popularity: 85 },
    
    // Billie Eilish songs
    { spotify_id: 'be1', artist_id: '3', title: 'bad guy', name: 'bad guy', album: 'WHEN WE ALL FALL ASLEEP', duration_ms: 194000, popularity: 93 },
    { spotify_id: 'be2', artist_id: '3', title: 'Happier Than Ever', name: 'Happier Than Ever', album: 'Happier Than Ever', duration_ms: 298000, popularity: 90 },
    { spotify_id: 'be3', artist_id: '3', title: 'everything i wanted', name: 'everything i wanted', album: 'everything i wanted', duration_ms: 245000, popularity: 88 },
    { spotify_id: 'be4', artist_id: '3', title: 'lovely', name: 'lovely', album: 'lovely', duration_ms: 200000, popularity: 87 },
    { spotify_id: 'be5', artist_id: '3', title: 'ocean eyes', name: 'ocean eyes', album: 'ocean eyes', duration_ms: 200000, popularity: 85 },
    
    // The Weeknd songs
    { spotify_id: 'tw1', artist_id: '4', title: 'Blinding Lights', name: 'Blinding Lights', album: 'After Hours', duration_ms: 200000, popularity: 95 },
    { spotify_id: 'tw2', artist_id: '4', title: 'Starboy', name: 'Starboy', album: 'Starboy', duration_ms: 230000, popularity: 91 },
    { spotify_id: 'tw3', artist_id: '4', title: 'Save Your Tears', name: 'Save Your Tears', album: 'After Hours', duration_ms: 215000, popularity: 89 },
    { spotify_id: 'tw4', artist_id: '4', title: 'Can\'t Feel My Face', name: 'Can\'t Feel My Face', album: 'Beauty Behind the Madness', duration_ms: 213000, popularity: 88 },
    { spotify_id: 'tw5', artist_id: '4', title: 'The Hills', name: 'The Hills', album: 'Beauty Behind the Madness', duration_ms: 242000, popularity: 87 },
    
    // Bad Bunny songs
    { spotify_id: 'bb1', artist_id: '5', title: 'Me Porto Bonito', name: 'Me Porto Bonito', album: 'Un Verano Sin Ti', duration_ms: 178000, popularity: 92 },
    { spotify_id: 'bb2', artist_id: '5', title: 'Tití Me Preguntó', name: 'Tití Me Preguntó', album: 'Un Verano Sin Ti', duration_ms: 244000, popularity: 90 },
    { spotify_id: 'bb3', artist_id: '5', title: 'Moscow Mule', name: 'Moscow Mule', album: 'Un Verano Sin Ti', duration_ms: 245000, popularity: 88 },
    { spotify_id: 'bb4', artist_id: '5', title: 'Yonaguni', name: 'Yonaguni', album: 'El Último Tour Del Mundo', duration_ms: 206000, popularity: 86 },
    { spotify_id: 'bb5', artist_id: '5', title: 'Dakiti', name: 'Dakiti', album: 'El Último Tour Del Mundo', duration_ms: 205000, popularity: 85 },
  ];

  const { error: songsError } = await supabase
    .from('songs')
    .upsert(songs, { onConflict: 'spotify_id' });

  if (songsError) {
    console.error('❌ Error inserting songs:', songsError);
    return;
  }

  console.log('✅ Songs inserted successfully');
  console.log('🎉 Data seeding completed!');
}

// Run the seeding
seedData().catch(console.error);