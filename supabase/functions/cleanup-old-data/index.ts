import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Verify authentication
  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  try {
    console.log('🧹 Starting data cleanup job');
    
    const supabase = createServiceClient();
    const stats = {
      oldShows: 0,
      oldVotes: 0,
      orphanedSetlists: 0,
      orphanedSongs: 0,
      duplicateSongs: 0,
    };

    // 1. Clean up old shows (more than 6 months past)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    console.log('🗑️ Cleaning up old shows...');
    const { count: oldShowsCount, error: oldShowsError } = await supabase
      .from('shows')
      .delete()
      .lt('date', sixMonthsAgo.toISOString())
      .select('*', { count: 'exact', head: true });

    if (oldShowsError) {
      console.error('Error deleting old shows:', oldShowsError);
    } else {
      stats.oldShows = oldShowsCount || 0;
      console.log(`✅ Deleted ${stats.oldShows} old shows`);
    }

    // 2. Clean up votes for deleted shows/setlists
    console.log('🗑️ Cleaning up orphaned votes...');
    const { count: orphanedVotesCount, error: orphanedVotesError } = await supabase
      .from('votes')
      .delete()
      .is('setlist_id', null)
      .select('*', { count: 'exact', head: true });

    if (orphanedVotesError) {
      console.error('Error deleting orphaned votes:', orphanedVotesError);
    } else {
      stats.oldVotes = orphanedVotesCount || 0;
      console.log(`✅ Deleted ${stats.oldVotes} orphaned votes`);
    }

    // 3. Clean up orphaned setlists (no associated show)
    console.log('🗑️ Cleaning up orphaned setlists...');
    const { data: orphanedSetlists, error: orphanedSetlistsError } = await supabase
      .from('setlists')
      .select('id')
      .is('show_id', null);

    if (!orphanedSetlistsError && orphanedSetlists) {
      for (const setlist of orphanedSetlists) {
        await supabase
          .from('setlists')
          .delete()
          .eq('id', setlist.id);
        stats.orphanedSetlists++;
      }
      console.log(`✅ Deleted ${stats.orphanedSetlists} orphaned setlists`);
    }

    // 4. Clean up setlist songs for deleted setlists
    console.log('🗑️ Cleaning up orphaned setlist songs...');
    const { count: orphanedSongsCount, error: orphanedSongsError } = await supabase
      .from('setlist_songs')
      .delete()
      .is('setlist_id', null)
      .select('*', { count: 'exact', head: true });

    if (orphanedSongsError) {
      console.error('Error deleting orphaned setlist songs:', orphanedSongsError);
    } else {
      stats.orphanedSongs = orphanedSongsCount || 0;
      console.log(`✅ Deleted ${stats.orphanedSongs} orphaned setlist songs`);
    }

    // 5. Clean up duplicate songs (keep the one with highest popularity)
    console.log('🗑️ Cleaning up duplicate songs...');
    const { data: artists } = await supabase
      .from('artists')
      .select('id')
      .limit(100);

    if (artists) {
      for (const artist of artists) {
        // Find duplicates for this artist
        const { data: songs } = await supabase
          .from('songs')
          .select('id, title, popularity')
          .eq('artist_id', artist.id)
          .order('title')
          .order('popularity', { ascending: false });

        if (songs && songs.length > 1) {
          const seen = new Map<string, string>();
          const toDelete: string[] = [];

          for (const song of songs) {
            const normalizedTitle = song.title.toLowerCase().trim();
            if (seen.has(normalizedTitle)) {
              // This is a duplicate, mark for deletion
              toDelete.push(song.id);
              stats.duplicateSongs++;
            } else {
              seen.set(normalizedTitle, song.id);
            }
          }

          // Delete duplicates in batches
          if (toDelete.length > 0) {
            for (let i = 0; i < toDelete.length; i += 50) {
              const batch = toDelete.slice(i, i + 50);
              await supabase
                .from('songs')
                .delete()
                .in('id', batch);
            }
          }
        }
      }
      console.log(`✅ Deleted ${stats.duplicateSongs} duplicate songs`);
    }

    // 6. Update materialized view statistics (if needed)
    console.log('📊 Updating statistics...');
    
    // Vacuum the database to reclaim space (only works with proper permissions)
    try {
      await supabase.rpc('vacuum_database');
      console.log('✅ Database vacuumed');
    } catch (error) {
      console.log('ℹ️ Could not vacuum database (requires elevated permissions)');
    }

    const duration = Date.now() - startTime;
    const totalCleaned = Object.values(stats).reduce((sum, val) => sum + val, 0);
    
    const response = {
      success: true,
      message: `Cleaned up ${totalCleaned} total records`,
      stats,
      duration,
    };

    console.log(`🎉 Cleanup completed in ${duration}ms:`, stats);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in cleanup job:', error);
    
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