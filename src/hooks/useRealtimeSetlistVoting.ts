
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SetlistSong } from '@/pages/ShowVoting/types';
import { toast } from '@/components/ui/sonner';

interface UseRealtimeSetlistVotingProps {
  setlistId: string | null;
  initialSongs: SetlistSong[];
  userId?: string;
}

export function useRealtimeSetlistVoting({ 
  setlistId, 
  initialSongs, 
  userId 
}: UseRealtimeSetlistVotingProps) {
  const [songs, setSongs] = useState<SetlistSong[]>(initialSongs);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  // Load user's existing votes
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!userId || !setlistId) return;

      try {
        const { data: votes } = await supabase
          .from('votes')
          .select('setlist_song_id')
          .eq('user_id', userId);

        if (votes) {
          const voteIds = new Set(votes.map(v => v.setlist_song_id));
          setUserVotes(voteIds);
          
          // Update songs with user vote status
          setSongs(prev => prev.map(song => ({
            ...song,
            userVoted: voteIds.has(song.id)
          })));
        }
      } catch (error) {
        console.error('Error loading user votes:', error);
      }
    };

    loadUserVotes();
  }, [userId, setlistId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!setlistId) return;

    const channel = supabase
      .channel(`setlist-${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          setSongs(currentSongs => {
            const updatedSongs = currentSongs.map(song => 
              song.id === payload.new.id 
                ? { ...song, votes: payload.new.votes, position: payload.new.position }
                : song
            );
            
            // Sort by votes (descending)
            return updatedSongs.sort((a, b) => b.votes - a.votes);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          // Update user vote tracking if it's this user's vote
          if (payload.new.user_id === userId) {
            setUserVotes(prev => new Set([...prev, payload.new.setlist_song_id]));
            setSongs(prev => prev.map(song => 
              song.id === payload.new.setlist_song_id 
                ? { ...song, userVoted: true }
                : song
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId, userId]);

  const vote = async (setlistSongId: string): Promise<boolean> => {
    if (!userId) {
      toast.error("Please log in to vote");
      return false;
    }

    if (userVotes.has(setlistSongId)) {
      toast.info("You've already voted for this song");
      return false;
    }

    setSubmitting(setlistSongId);

    try {
      // Optimistically update UI
      setSongs(prev => prev.map(song =>
        song.id === setlistSongId 
          ? { ...song, votes: song.votes + 1, userVoted: true } 
          : song
      ).sort((a, b) => b.votes - a.votes));

      setUserVotes(prev => new Set([...prev, setlistSongId]));

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        // Revert optimistic update
        setSongs(prev => prev.map(song =>
          song.id === setlistSongId 
            ? { ...song, votes: song.votes - 1, userVoted: false } 
            : song
        ).sort((a, b) => b.votes - a.votes));

        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(setlistSongId);
          return newSet;
        });

        toast.error(error.message || "Failed to vote");
        return false;
      }

      toast.success("Vote recorded!");
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("An unexpected error occurred");
      return false;
    } finally {
      setSubmitting(null);
    }
  };

  return {
    songs,
    submitting,
    vote,
    userVotes
  };
}
