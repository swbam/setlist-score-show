import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

interface SetlistFmApiShow {
  id: string;
  date: string;
  artist: {
    mbid?: string;
    name: string;
  };
  venue: {
    id: string;
    name: string;
    city: {
      name: string;
      state?: string;
      stateCode?: string;
      country: {
        code: string;
        name: string;
      };
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
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify authentication
    const { isAuthorized } = await verifyAuth(req);
    
    if (!isAuthorized) {
      console.error('Unauthorized setlist sync request');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎭 Starting setlist sync job');
    
    const supabase = createServiceClient();
    const setlistFmApiKey = Deno.env.get('SETLISTFM_API_KEY');
    
    if (!setlistFmApiKey) {
      throw new Error('SETLISTFM_API_KEY not configured');
    }

    // Get artists to check for setlists
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(50);

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    if (!artists || artists.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No artists to sync',
          duration: Date.now() - startTime
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let imported = 0;
    const errors: string[] = [];

    // Process each artist
    for (const artist of artists) {
      try {
        console.log(`🎤 Checking setlists for: ${artist.name}`);
        
        // Search for recent setlists (last 7 days)
        const response = await fetch(
          `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist.name)}&p=1`,
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
          throw new Error(`Setlist.fm API error: ${response.status}`);
        }

        const data = await response.json();
        const setlists = data.setlist || [];

        // Filter for recent shows (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (const setlist of setlists) {
          if (!setlist.date || new Date(setlist.date) < sevenDaysAgo) {
            continue;
          }

          try {
            // Check if show already exists
            const { data: existingShow } = await supabase
              .from('shows')
              .select('id')
              .eq('artist_id', artist.id)
              .eq('date', setlist.date)
              .single();

            if (existingShow) {
              console.log(`ℹ️ Show already exists for ${artist.name} on ${setlist.date}`);
              continue;
            }

            // Create or get venue
            let venueId: string;
            const { data: existingVenue } = await supabase
              .from('venues')
              .select('id')
              .eq('name', setlist.venue.name)
              .eq('city', setlist.venue.city.name)
              .single();

            if (existingVenue) {
              venueId = existingVenue.id;
            } else {
              const { data: newVenue, error: venueError } = await supabase
                .from('venues')
                .insert({
                  name: setlist.venue.name,
                  city: setlist.venue.city.name,
                  state: setlist.venue.city.state || setlist.venue.city.stateCode,
                  country: setlist.venue.city.country.name,
                  latitude: 0,
                  longitude: 0,
                })
                .select('id')
                .single();

              if (venueError) throw venueError;
              venueId = newVenue.id;
            }

            // Create show
            const { data: newShow, error: showError } = await supabase
              .from('shows')
              .insert({
                artist_id: artist.id,
                venue_id: venueId,
                date: setlist.date,
                name: `${artist.name} at ${setlist.venue.name}`,
                setlist_fm_id: setlist.id,
              })
              .select('id')
              .single();

            if (showError) throw showError;

            // Import setlist songs if available
            const songs: string[] = [];
            if (setlist.sets && setlist.sets.set) {
              for (const set of setlist.sets.set) {
                if (set.song) {
                  for (const song of set.song) {
                    if (song.name) {
                      songs.push(song.name);
                    }
                  }
                }
              }
            }

            if (songs.length > 0 && newShow) {
              // Create a setlist for this show
              const { data: newSetlist, error: setlistError } = await supabase
                .from('setlists')
                .insert({
                  show_id: newShow.id,
                  name: 'Actual Setlist',
                  is_official: true,
                })
                .select('id')
                .single();

              if (!setlistError && newSetlist) {
                // Add songs to setlist
                const setlistSongs = songs.map((songName, index) => ({
                  setlist_id: newSetlist.id,
                  song_name: songName,
                  position: index + 1,
                  votes: 0,
                }));

                await supabase
                  .from('setlist_songs')
                  .insert(setlistSongs);
              }
            }

            imported++;
            console.log(`✅ Imported setlist for ${artist.name} on ${setlist.date}`);

          } catch (error) {
            console.error(`Error importing setlist: ${error}`);
            errors.push(`${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        processed++;
        const errorMsg = `${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`💥 Error processing ${artist.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${processed} artists, imported ${imported} setlists`,
      stats: {
        processed,
        imported,
        failed: processed - imported,
        errors: errors.slice(0, 3),
      },
      duration,
    };

    console.log(`🎉 Setlist sync completed: ${imported}/${processed} successful in ${duration}ms`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in setlist sync:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});