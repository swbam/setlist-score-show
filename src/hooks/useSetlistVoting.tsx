
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as setlistService from "@/services/setlist";

export function useSetlistVoting(setlistId: string | null) {
  const [setlist, setSetlist] = useState<setlistService.Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  
  useEffect(() => {
    if (!setlistId) {
      setSetlist(null);
      setLoading(false);
      return;
    }
    
    // Fetch setlist data initially
    fetchSetlist();
    
    // Subscribe to real-time updates for votes
    const channel = supabase
      .channel(`setlist:${setlistId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'setlist_songs', filter: `setlist_id=eq.${setlistId}` },
        (payload) => {
          // Update the setlist song that changed
          setSetlist(prev => {
            if (!prev || !prev.songs) return prev;
            
            const updatedSongs = prev.songs.map(song => 
              song.id === payload.new.id ? { ...song, ...payload.new } : song
            );
            
            // Sort by votes (descending)
            updatedSongs.sort((a, b) => b.votes - a.votes);
            
            return {
              ...prev,
              songs: updatedSongs
            };
          });
        }
      )
      .subscribe();
      
    // Cleanup subscription when component unmounts
    return () => {
      console.log("Cleaning up real-time subscription");
      channel.unsubscribe().then(
        status => console.log("Real-time subscription status:", status),
        err => console.error("Error unsubscribing:", err)
      );
    };
  }, [setlistId]);
  
  async function fetchSetlist() {
    if (!setlistId) return;
    
    try {
      setLoading(true);
      const data = await setlistService.getSetlistWithSongs(setlistId);
      setSetlist(data);
    } catch (error) {
      console.error("Error fetching setlist:", error);
      toast.error("Failed to load setlist data");
    } finally {
      setLoading(false);
    }
  }
  
  async function voteForSong(setlistSongId: string) {
    if (voting) return;
    
    try {
      setVoting(true);
      
      // Optimistically update the UI
      setSetlist(prev => {
        if (!prev || !prev.songs) return prev;
        
        const updatedSongs = prev.songs.map(song => 
          song.id === setlistSongId ? { ...song, votes: song.votes + 1 } : song
        );
        
        // Sort by votes (descending)
        updatedSongs.sort((a, b) => b.votes - a.votes);
        
        return {
          ...prev,
          songs: updatedSongs
        };
      });
      
      // Call the vote function
      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });
      
      if (error) {
        // Rollback optimistic update on error
        setSetlist(prev => {
          if (!prev || !prev.songs) return prev;
          
          const updatedSongs = prev.songs.map(song => 
            song.id === setlistSongId ? { ...song, votes: Math.max(0, song.votes - 1) } : song
          );
          
          updatedSongs.sort((a, b) => b.votes - a.votes);
          
          return {
            ...prev,
            songs: updatedSongs
          };
        });
        
        if (error.message.includes("Already voted")) {
          toast.info("You already voted for this song");
        } else {
          console.error("Error voting:", error);
          toast.error("Failed to vote for this song");
        }
      } else if (data && !data.success) {
        toast.info(data.message || "Could not vote for this song");
      }
    } finally {
      setVoting(false);
    }
  }
  
  async function addSongToSetlist(songId: string): Promise<boolean> {
    if (!setlistId) return false;
    
    try {
      const success = await setlistService.addSongToSetlist(setlistId, songId);
      
      if (success) {
        // Refresh the setlist to include the newly added song
        await fetchSetlist();
      }
      
      return success;
    } catch (error) {
      console.error("Error adding song to setlist:", error);
      return false;
    }
  }
  
  return {
    setlist,
    loading,
    voting,
    voteForSong,
    addSongToSetlist,
    refreshSetlist: fetchSetlist
  };
}
