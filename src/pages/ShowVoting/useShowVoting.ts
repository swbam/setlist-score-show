import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as setlistService from "@/services/setlist";
import * as votingService from "@/services/voting";
import { Show, Setlist, SetlistSong } from "./types";

export function useShowVoting(user: any) {
  const { showId } = useParams<{ showId: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [voteSubmitting, setVoteSubmitting] = useState<string | null>(null);
  const [voteLimits, setVoteLimits] = useState<votingService.VoteLimits | null>(null);
  
  // Calculate voting stats
  const usedVotesCount = Object.keys(userVotes).length;
  const maxFreeVotes = voteLimits?.maxVotesPerShow || 3;
  const votesRemaining = voteLimits?.isUnlimited 
    ? 'unlimited' 
    : Math.max(0, maxFreeVotes - usedVotesCount);

  // Fetch user vote limits
  useEffect(() => {
    async function fetchVoteLimits() {
      const limits = await votingService.getUserVoteLimits(user?.id || null);
      setVoteLimits(limits);
    }
    
    fetchVoteLimits();
  }, [user]);

  // Fetch show data and create/get setlist
  useEffect(() => {
    async function fetchShowData() {
      if (!showId) return;
      
      try {
        setLoading(true);
        console.log("Fetching show data for ID:", showId);
        
        // Get show data
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            *,
            artist:artists(id, name, image_url),
            venue:venues(name, city, state, country, address)
          `)
          .eq('id', showId)
          .single();
          
        if (showError) {
          console.error("Error fetching show:", showError);
          toast.error("Failed to load show details");
          setLoading(false);
          return;
        }
        
        if (showData) {
          const typedShowData = {
            ...showData,
            status: showData.status as 'scheduled' | 'postponed' | 'canceled'
          };
          
          console.log("Show data loaded:", typedShowData);
          setShow(typedShowData);
          
          // Increment view count
          await supabase
            .from('shows')
            .update({ view_count: (typedShowData.view_count || 0) + 1 })
            .eq('id', showId);
          
          // Get or create setlist for this show
          console.log("Getting or creating setlist for show:", showId);
          const setlistId = await setlistService.getOrCreateSetlist(showId);
          
          if (setlistId) {
            console.log("Setlist found or created:", setlistId);
            
            // Get setlist with songs
            const setlistWithSongs = await setlistService.getSetlistWithSongs(setlistId);
            
            if (setlistWithSongs) {
              console.log("Setlist with songs loaded:", setlistWithSongs);
              
              // Make sure the songs array exists
              if (setlistWithSongs.songs) {
                // Check user votes if logged in
                if (user) {
                  const userVotesMap = await votingService.getUserVotesForSetlist(user.id, setlistId);
                  setUserVotes(userVotesMap);
                  
                  // Mark songs user has voted for and ensure song property is present
                  const updatedSongs = setlistWithSongs.songs.map(song => ({
                    ...song,
                    song: song.song || { id: '', artist_id: '', name: '', album: '', duration_ms: 0, popularity: 0, spotify_url: '' },
                    userVoted: userVotesMap[song.id] || false
                  })) as SetlistSong[];
                  
                  setSetlist({
                    ...setlistWithSongs,
                    songs: updatedSongs
                  } as Setlist);
                } else {
                  // Ensure song property is present
                  const updatedSongs = setlistWithSongs.songs.map(song => ({
                    ...song,
                    song: song.song || { id: '', artist_id: '', name: '', album: '', duration_ms: 0, popularity: 0, spotify_url: '' }
                  })) as SetlistSong[];
                  
                  setSetlist({
                    ...setlistWithSongs,
                    songs: updatedSongs
                  } as Setlist);
                }
              } else {
                // Create an empty array if songs is undefined
                setSetlist({
                  ...setlistWithSongs,
                  songs: []
                } as Setlist);
                
                console.warn("No songs found in setlist");
              }
            } else {
              console.error("Failed to load setlist with songs");
              toast.error("Failed to load setlist data");
            }
          } else {
            console.error("Failed to get or create setlist");
            toast.error("Failed to load setlist");
          }
        }
      } catch (error) {
        console.error("Error loading show data:", error);
        toast.error("An error occurred while loading the show");
      } finally {
        setLoading(false);
      }
    }
    
    fetchShowData();
  }, [showId, user]);

  // Set up realtime updates for votes
  useEffect(() => {
    if (!setlist) return;
    
    console.log("Setting up realtime subscriptions for setlist:", setlist.id);
    
    // Subscribe to setlist song changes
    const channel = supabase
      .channel('setlist-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlist.id}`
        },
        (payload) => {
          console.log("Received realtime update for setlist song:", payload.new);
          
          // Update the affected song's vote count
          setSetlist(prev => {
            if (!prev || !prev.songs) return prev;
            
            // Create a new array with updated vote counts
            const updatedSongs = prev.songs.map(song => 
              song.id === payload.new.id
                ? { ...song, votes: payload.new.votes }
                : song
            ).sort((a, b) => b.votes - a.votes); // Re-sort by votes
            
            return {
              ...prev,
              songs: updatedSongs
            };
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
      
    // Also subscribe to inserts
    const insertChannel = supabase
      .channel('setlist-inserts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlist.id}`
        },
        async () => {
          console.log("New song added to setlist, refreshing data");
          
          // Refresh setlist with songs
          if (setlist) {
            const refreshedSetlist = await setlistService.getSetlistWithSongs(setlist.id);
            if (refreshedSetlist) {
              // Convert to our local Setlist type with consistent song property
              const updatedSongs = refreshedSetlist.songs.map(song => ({
                ...song,
                song: song.song || { id: '', artist_id: '', name: '', album: '', duration_ms: 0, popularity: 0, spotify_url: '' },
                userVoted: userVotes[song.id] || false
              })) as SetlistSong[];
              
              setSetlist({
                ...refreshedSetlist,
                songs: updatedSongs
              } as Setlist);
            }
          }
        }
      )
      .subscribe();
      
    // Cleanup
    return () => {
      console.log("Cleaning up realtime subscriptions");
      supabase.removeChannel(channel);
      supabase.removeChannel(insertChannel);
    };
  }, [setlist, userVotes]);

  // Handle voting for a song
  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      setVotingError("Please sign in to vote");
      toast.error("Sign in to vote on setlists", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/login"
        },
      });
      return;
    }
    
    if (!setlist) {
      toast.error("Setlist not loaded");
      return;
    }
    
    // Check vote status first
    const voteStatus = await votingService.checkVoteStatus(user.id, setlist.id, setlistSongId);
    
    if (!voteStatus.canVote) {
      if (voteStatus.hasVoted) {
        toast.error("You've already voted for this song");
      } else {
        toast.error("You've reached your vote limit for this show", {
          description: `You can vote for ${voteLimits?.maxVotesPerShow} songs per show`,
        });
      }
      return;
    }
    
    // Track submitting state for this song
    setVoteSubmitting(setlistSongId);
    
    // Find the current song to update optimistically
    const currentSong = setlist.songs.find(s => s.id === setlistSongId);
    if (!currentSong) {
      toast.error("Song not found");
      setVoteSubmitting(null);
      return;
    }
    
    // Optimistically update UI
    setSetlist(prev => {
      if (!prev || !prev.songs) return prev;
      
      const updatedSongs = prev.songs.map(song => 
        song.id === setlistSongId
          ? { ...song, votes: song.votes + 1, userVoted: true }
          : song
      ).sort((a, b) => b.votes - a.votes); // Re-sort by votes
      
      return {
        ...prev,
        songs: updatedSongs
      };
    });
    
    setUserVotes(prev => ({ ...prev, [setlistSongId]: true }));
    
    try {
      console.log("Voting for song:", setlistSongId);
      
      // Use the voting service to submit the vote
      const result = await votingService.submitVote(user.id, setlistSongId, setlist.id);
      
      if (!result.success) {
        console.error("Vote failed:", result.error);
        
        // Revert optimistic update
        setSetlist(prev => {
          if (!prev || !prev.songs) return prev;
          
          const updatedSongs = prev.songs.map(song => 
            song.id === setlistSongId
              ? { ...song, votes: song.votes - 1, userVoted: false }
              : song
          ).sort((a, b) => b.votes - a.votes); // Re-sort by votes
        
          return {
            ...prev,
            songs: updatedSongs
          };
        });
        
        setUserVotes(prev => {
          const newState = { ...prev };
          delete newState[setlistSongId];
          return newState;
        });
        
        toast.error(result.error || "Failed to vote for song");
      } else {
        toast.success("Vote submitted successfully!");
      }
    } catch (error) {
      console.error("Error voting:", error);
      
      // Revert optimistic update
      setSetlist(prev => {
        if (!prev || !prev.songs) return prev;
        
        const updatedSongs = prev.songs.map(song => 
          song.id === setlistSongId
            ? { ...song, votes: song.votes - 1, userVoted: false }
            : song
        ).sort((a, b) => b.votes - a.votes); // Re-sort by votes
        
        return {
          ...prev,
          songs: updatedSongs
        };
      });
      
      setUserVotes(prev => {
        const newState = { ...prev };
        delete newState[setlistSongId];
        return newState;
      });
      
      toast.error("An error occurred while voting");
    } finally {
      // Clear submitting state
      setVoteSubmitting(null);
    }
  };

  // Handle song added to setlist
  const handleSongAdded = async () => {
    if (setlist) {
      console.log("Refreshing setlist after song was added");
      const refreshedSetlist = await setlistService.getSetlistWithSongs(setlist.id);
      if (refreshedSetlist) {
        // Convert to our local Setlist type
        const updatedSongs = refreshedSetlist.songs.map(song => ({
          ...song,
          song: song.song || { id: '', artist_id: '', name: '', album: '', duration_ms: 0, popularity: 0, spotify_url: '' },
          userVoted: userVotes[song.id] || false
        })) as SetlistSong[];
        
        setSetlist({
          ...refreshedSetlist,
          songs: updatedSongs
        } as Setlist);
      }
    }
  };

  return {
    show,
    setlist,
    loading,
    votingError,
    voteSubmitting,
    userVotes,
    usedVotesCount,
    maxFreeVotes,
    votesRemaining,
    handleVote,
    handleSongAdded
  };
}

export default useShowVoting;
