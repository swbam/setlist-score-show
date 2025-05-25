import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import ShowHeader from "./ShowHeader";
import VotingSection from "./VotingSection";
import Sidebar from "./Sidebar";
import { ShowData, SetlistSong } from "./types";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [setlistId, setSetlistId] = useState<string>("");
  
  // Use real-time votes hook
  const voteUpdates = useRealtimeVotes(setlistId);

  // Apply real-time vote updates to setlist songs
  useEffect(() => {
    if (voteUpdates.length > 0) {
      setSetlistSongs(prev => 
        prev.map(song => {
          const update = voteUpdates.find(v => v.id === song.id);
          return update ? { ...song, votes: update.votes } : song;
        })
      );
    }
  }, [voteUpdates]);

  const fetchShowData = async () => {
    if (!showId) return;

    try {
      setLoading(true);

      // Fetch show details
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(id, name, image_url),
          venue:venues(id, name, city, state, country)
        `)
        .eq('id', showId)
        .single();

      if (showError) {
        console.error('Error fetching show:', showError);
        toast.error('Failed to load show data');
        return;
      }

      if (!show) {
        toast.error('Show not found');
        return;
      }

      setShowData(show);

      // Fetch setlist ID
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (setlistError) {
        console.error('Error fetching setlist ID:', setlistError);
        toast.error('Failed to load setlist');
        return;
      }

      if (!setlistData) {
        toast.error('Setlist not found');
        return;
      }

      setSetlistId(setlistData.id);

      // Fetch setlist songs
      await fetchSetlistSongs(setlistData.id);

      // Increment view count
      await supabase
        .from('shows')
        .update({ view_count: (show.view_count || 0) + 1 })
        .eq('id', showId);

    } catch (error) {
      console.error('Error fetching show data:', error);
      toast.error('Failed to load show data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetlistSongs = async (setlistId: string) => {
    try {
      const { data: songs, error } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          song:songs(id, name, artist_id, album, spotify_url)
        `)
        .eq('setlist_id', setlistId)
        .order('votes', { ascending: false });

      if (error) {
        console.error('Error fetching setlist songs:', error);
        toast.error('Failed to load setlist');
        return;
      }

      setSetlistSongs(songs || []);
    } catch (error) {
      console.error('Error fetching setlist songs:', error);
      toast.error('Failed to load setlist');
    }
  };

  const handleVote = async (setlistSongId: string) => {
    try {
      // Optimistic update
      setSetlistSongs(prev => 
        prev.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes + 1 }
            : song
        )
      );

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        // Revert optimistic update on error
        setSetlistSongs(prev => 
          prev.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: song.votes - 1 }
              : song
          )
        );
        
        if (error.message.includes('Already voted')) {
          toast.error("You've already voted for this song!");
        } else {
          toast.error("Failed to vote. Please try again.");
        }
        return;
      }

      if (data?.success) {
        toast.success("Vote recorded!");
        // Real-time update will handle the final vote count
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      setSetlistSongs(prev => 
        prev.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes - 1 }
            : song
        )
      );
      toast.error("Failed to vote. Please try again.");
    }
  };

  useEffect(() => {
    if (showId) {
      fetchShowData();
    }
  }, [showId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!showData) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <button 
              onClick={() => navigate('/')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
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
      <AppHeader />
      
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
        <ShowHeader showData={showData} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          <div className="lg:col-span-3">
            <VotingSection 
              setlistSongs={setlistSongs}
              onVote={handleVote}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Sidebar 
              showData={showData}
              totalVotes={setlistSongs.reduce((sum, song) => sum + song.votes, 0)}
              totalSongs={setlistSongs.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
