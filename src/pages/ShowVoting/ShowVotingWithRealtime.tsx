
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { incrementShowViews } from '@/services/trending';
import { getOrCreateSetlistWithSongs } from '@/services/setlistCreation';
import { useRealtimeVoting } from '@/hooks/useRealtimeVoting';
import ShowHeader from './ShowHeader';
import VotingSection from './VotingSection';
import Sidebar from './Sidebar';
import { Show, SetlistSong } from './types';

const ShowVotingWithRealtime = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<Show | null>(null);
  const [initialSongs, setInitialSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [usedVotesCount, setUsedVotesCount] = useState(0);
  const [setlistId, setSetlistId] = useState<string | null>(null);
  const maxFreeVotes = 10;

  // Use realtime voting hook
  const { songs: setlistSongs, setSongs: setSetlistSongs } = useRealtimeVoting({
    setlistId,
    initialSongs
  });

  useEffect(() => {
    if (showId) {
      fetchShowData();
      
      // Get current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });
    }
  }, [showId]);

  const fetchShowData = async () => {
    if (!showId) return;

    try {
      setLoading(true);
      console.log("Fetching show data for ID:", showId);

      // Increment view count
      await incrementShowViews(showId);

      // Fetch show details with explicit relationship names
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select(`
          *,
          artists!fk_shows_artist_id (
            id,
            name,
            image_url
          ),
          venues!fk_shows_venue_id (
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('id', showId)
        .single();

      if (showError || !showData) {
        console.error("Error fetching show:", showError);
        toast("Failed to load show details");
        return;
      }

      // Transform show data
      const transformedShow: Show = {
        id: showData.id,
        name: showData.name,
        date: showData.date,
        start_time: showData.start_time,
        status: showData.status,
        ticketmaster_url: showData.ticketmaster_url,
        view_count: showData.view_count,
        artist: {
          id: showData.artists?.id || '',
          name: showData.artists?.name || 'Unknown Artist',
          image_url: showData.artists?.image_url
        },
        venue: {
          id: showData.venues?.id || '',
          name: showData.venues?.name || 'Unknown Venue',
          city: showData.venues?.city || '',
          state: showData.venues?.state,
          country: showData.venues?.country || ''
        }
      };

      setShow(transformedShow);

      // Create setlist with 5 random songs if needed
      const setlistResult = await getOrCreateSetlistWithSongs(showId);
      
      if (!setlistResult.success || !setlistResult.setlist_id) {
        console.error("Failed to create or get setlist");
        toast("Failed to load voting data");
        return;
      }

      setSetlistId(setlistResult.setlist_id);

      // Fetch setlist songs with explicit relationship name
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlist_songs')
        .select(`
          id,
          setlist_id,
          song_id,
          position,
          votes,
          songs!fk_setlist_songs_song_id (
            id,
            name,
            album,
            artist_id,
            spotify_url
          )
        `)
        .eq('setlist_id', setlistResult.setlist_id)
        .order('votes', { ascending: false })
        .order('position', { ascending: true });

      if (setlistError) {
        console.error("Error fetching setlist songs:", setlistError);
        toast("Failed to load setlist");
        return;
      }

      if (setlistData && setlistData.length > 0) {
        const transformedSetlist: SetlistSong[] = setlistData.map(item => ({
          id: item.id,
          setlist_id: item.setlist_id,
          song_id: item.song_id,
          position: item.position,
          votes: item.votes,
          song: {
            id: item.songs?.id || '',
            name: item.songs?.name || 'Unknown Song',
            album: item.songs?.album || 'Unknown Album',
            artist_id: item.songs?.artist_id || '',
            spotify_url: item.songs?.spotify_url || ''
          }
        }));
        
        setInitialSongs(transformedSetlist);
      }

      // Fetch user's vote count if logged in
      if (user) {
        const { data: voteCount } = await supabase
          .from('votes')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        
        setUsedVotesCount(voteCount?.length || 0);
      }

    } catch (error) {
      console.error("Error in fetchShowData:", error);
      toast("Failed to load show data");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (setlistSongId: string): Promise<boolean> => {
    if (!user) {
      toast("Please log in to vote");
      return false;
    }

    if (usedVotesCount >= maxFreeVotes) {
      toast("You've reached your vote limit");
      return false;
    }

    try {
      setSubmitting(setlistSongId);

      // Optimistically update UI
      setSetlistSongs(prevSongs => 
        prevSongs.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes + 1 } 
            : song
        ).sort((a, b) => b.votes - a.votes)
      );

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        // Revert optimistic update
        setSetlistSongs(prevSongs => 
          prevSongs.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: Math.max(0, song.votes - 1) } 
              : song
          )
        );
        
        if (error.message.includes("Already voted")) {
          toast("You already voted for this song");
        } else {
          console.error("Vote error:", error);
          toast("Failed to vote. Please try again.");
        }
        return false;
      }

      const voteResponse = data as any;
      if (voteResponse && voteResponse.success) {
        setUsedVotesCount(prev => prev + 1);
        toast("Your vote has been counted!");
        return true;
      } else {
        toast(voteResponse?.message || "Failed to vote");
        return false;
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast("Failed to vote. Please try again.");
      return false;
    } finally {
      setSubmitting(null);
    }
  };

  const handleSongAdded = async () => {
    // Refresh setlist after song is added
    await fetchShowData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading show...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <button 
              onClick={() => navigate('/')} 
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
        {/* Show Header */}
        <ShowHeader show={show} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Voting Section */}
          <div className="lg:col-span-2">
            <VotingSection
              songs={setlistSongs}
              onVote={handleVote}
              submitting={submitting}
              onAddSong={handleSongAdded}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              show={show} 
              totalVotes={setlistSongs.reduce((sum, song) => sum + song.votes, 0)}
              totalSongs={setlistSongs.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVotingWithRealtime;
