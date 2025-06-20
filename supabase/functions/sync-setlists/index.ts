import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

interface SetlistFmSetlist {
  id: string;
  eventDate: string;
  artist: {
    name: string;
  };
  venue: {
    name: string;
    city: {
      name: string;
    };
  };
  sets: {
    set: Array<{
      song: Array<{
        name: string;
      }>;
    }>;
  };
}

serve(async (req) => {
  const startTime = Date.now();
  
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  const supabase = createServiceClient();

  try {
    console.log('📜 Starting MVP setlist sync job');
    
    // Log sync start
    const { data: syncRecord } = await supabase
      .from('sync_history')
      .insert({
        sync_type: 'setlistfm',
        entity_type: 'setlists',
        status: 'started'
      })
      .select('id')
      .single()
    
    const syncId = syncRecord?.id
    
    const setlistFmApiKey = Deno.env.get('SETLISTFM_API_KEY');
    
    if (!setlistFmApiKey) {
      throw new Error('SETLISTFM_API_KEY not configured');
    }

    // Get recent shows that don't have official setlists yet (MVP: last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artist:artists(id, name),
        venue:venues(name, city)
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .lte('date', new Date().toISOString().split('T')[0])
      .is('setlist_fm_id', null) // Only shows without setlist.fm data
      .limit(10); // MVP: limit to 10 shows per run

    if (showsError) {
      throw new Error(`Failed to fetch shows: ${showsError.message}`);
    }

    if (!shows || shows.length === 0) {
      // Update sync history
      if (syncId) {
        await supabase
          .from('sync_history')
          .update({
            status: 'completed',
            items_processed: 0,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncId)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No recent shows need setlist sync',
          duration: Date.now() - startTime
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Found ${shows.length} shows to check for setlists`);

    let processed = 0;
    let imported = 0;
    const errors: string[] = [];

    // Process each show
    for (const show of shows) {
      try {
        if (!show.artist?.name) {
          console.log(`⚠️ Skipping show ${show.id} - no artist name`);
          continue;
        }

        console.log(`🎤 Checking setlist for: ${show.artist.name} on ${show.date}`);
        
        // Search setlist.fm for this specific show
        const response = await fetch(
          `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(show.artist.name)}&date=${show.date}&p=1`,
          {
            headers: {
              'Accept': 'application/json',
              'x-api-key': setlistFmApiKey,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Rate limit hit, waiting...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          if (response.status === 404) {
            console.log(`No setlist found for ${show.artist.name} on ${show.date}`);
            processed++;
            continue;
          }
          throw new Error(`Setlist.fm API error: ${response.status}`);
        }

        const data = await response.json();
        const setlists = data.setlist || [];

        // Find matching setlist by date and venue
        const matchingSetlist = setlists.find((setlist: SetlistFmSetlist) => 
          setlist.eventDate === show.date &&
          setlist.venue?.name?.toLowerCase().includes(show.venue?.name?.toLowerCase() || '')
        );

        if (matchingSetlist) {
          console.log(`✅ Found matching setlist for ${show.artist.name}`);
          
          // Extract songs from setlist
          const songs: string[] = [];
          if (matchingSetlist.sets?.set) {
            for (const set of matchingSetlist.sets.set) {
              if (set.song) {
                for (const song of set.song) {
                  if (song.name) {
                    songs.push(song.name);
                  }
                }
              }
            }
          }

          // Update show with setlist.fm ID
          await supabase
            .from('shows')
            .update({ setlist_fm_id: matchingSetlist.id })
            .eq('id', show.id);

          if (songs.length > 0) {
            // Create or update the official setlist
            const { data: existingSetlist } = await supabase
              .from('setlists')
              .select('id')
              .eq('show_id', show.id)
              .eq('is_official', true)
              .single();

            let setlistId: string;
            
            if (existingSetlist) {
              setlistId = existingSetlist.id;
              // Clear existing songs
              await supabase
                .from('setlist_songs')
                .delete()
                .eq('setlist_id', setlistId);
            } else {
              // Create new official setlist
              const { data: newSetlist } = await supabase
                .from('setlists')
                .insert({
                  show_id: show.id,
                  name: 'Official Setlist',
                  is_official: true,
                  order_index: 0
                })
                .select('id')
                .single();
              
              setlistId = newSetlist?.id;
            }

            if (setlistId) {
              // Find or create songs in our database
              const songRows = [];
              for (let i = 0; i < songs.length; i++) {
                const songName = songs[i];
                
                // Try to find existing song
                const { data: existingSong } = await supabase
                  .from('songs')
                  .select('id')
                  .eq('artist_id', show.artist.id)
                  .eq('title', songName)
                  .single();

                let songId: string;
                
                if (existingSong) {
                  songId = existingSong.id;
                } else {
                  // Create new song
                  const { data: newSong } = await supabase
                    .from('songs')
                    .insert({
                      artist_id: show.artist.id,
                      title: songName,
                      popularity: 50 // Default popularity
                    })
                    .select('id')
                    .single();
                  
                  songId = newSong?.id;
                }

                if (songId) {
                  songRows.push({
                    setlist_id: setlistId,
                    song_id: songId,
                    position: i + 1,
                    vote_count: 0
                  });
                }
              }

              // Insert all songs at once
              if (songRows.length > 0) {
                await supabase
                  .from('setlist_songs')
                  .insert(songRows);
              }

              console.log(`🎵 Imported ${songs.length} songs for ${show.artist.name}`);
              imported++;
            }
          }
        } else {
          console.log(`No matching setlist found for ${show.artist.name} on ${show.date}`);
        }

        processed++;

      } catch (error) {
        console.error(`❌ Error processing show ${show.id}:`, error.message);
        errors.push(`Show ${show.id}: ${error.message}`);
        processed++;
      }

      // Rate limiting between requests
      if (processed < shows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update sync history
    if (syncId) {
      await supabase
        .from('sync_history')
        .update({
          status: 'completed',
          items_processed: processed,
          completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join('; ') : null
        })
        .eq('id', syncId)
    }

    const duration = Date.now() - startTime;
    console.log(`📜 Setlist sync completed: ${imported}/${processed} shows imported, ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        imported,
        errors: errors.length > 0 ? errors : undefined,
        duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Setlist sync failed:', error);
    
    // Log error to sync history
    await supabase
      .from('sync_history')
      .insert({
        sync_type: 'setlistfm',
        entity_type: 'setlists',
        status: 'failed',
        error_message: error.message
      })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});