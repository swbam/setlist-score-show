import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SETLISTFM_API_KEY = process.env.VITE_SETLISTFM_API_KEY;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Verify cron secret
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting setlist sync...');
    
    // Get shows from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentShows, error } = await supabase
      .from('shows')
      .select('id, date, artist:artists(id, name)')
      .gte('date', sevenDaysAgo.toISOString())
      .lte('date', new Date().toISOString())
      .eq('status', 'scheduled');
    
    if (error) throw error;
    
    let processedCount = 0;
    let importedCount = 0;
    
    for (const show of recentShows || []) {
      if (!show.artist) continue;
      
      // Check if we already have a played setlist for this show
      const { data: existingSetlist } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', show.id)
        .maybeSingle();
      
      if (existingSetlist) continue;
      
      // Format date for setlist.fm API
      const showDate = new Date(show.date);
      const dateStr = `${showDate.getDate().toString().padStart(2, '0')}-${(showDate.getMonth() + 1).toString().padStart(2, '0')}-${showDate.getFullYear()}`;
      
      // Search for setlist
      const searchUrl = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(show.artist.name)}&date=${dateStr}`;
      
      const setlistResponse = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': SETLISTFM_API_KEY!
        }
      });
      
      if (!setlistResponse.ok) continue;
      
      const data = await setlistResponse.json();
      const setlists = data.setlist || [];
      
      if (setlists.length === 0) continue;
      
      // Use the first matching setlist
      const setlist = setlists[0];
      
      // Create played setlist record
      const { data: playedSetlist, error: insertError } = await supabase
        .from('played_setlists')
        .insert({
          show_id: show.id,
          setlist_fm_id: setlist.id,
          played_date: show.date
        })
        .select()
        .single();
      
      if (insertError || !playedSetlist) continue;
      
      // Process songs
      let position = 0;
      if (setlist.sets?.set) {
        for (const set of setlist.sets.set) {
          if (set.song) {
            for (const song of set.song) {
              position++;
              
              // Try to match song in database
              const { data: matchedSongs } = await supabase
                .from('songs')
                .select('id')
                .eq('artist_id', show.artist.id)
                .ilike('name', song.name)
                .limit(1);
              
              if (matchedSongs && matchedSongs.length > 0) {
                await supabase
                  .from('played_setlist_songs')
                  .insert({
                    played_setlist_id: playedSetlist.id,
                    song_id: matchedSongs[0].id,
                    position: position
                  });
              }
            }
          }
        }
      }
      
      importedCount++;
      processedCount++;
    }
    
    console.log(`Processed ${processedCount} shows, imported ${importedCount} setlists`);
    
    return response.status(200).json({ 
      success: true,
      showsProcessed: processedCount,
      setlistsImported: importedCount
    });
  } catch (error) {
    console.error('Error in setlist sync:', error);
    return response.status(500).json({ error: error.message });
  }
}