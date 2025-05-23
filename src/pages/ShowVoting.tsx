
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, ChevronUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import * as setlistService from "@/services/setlist";
import VotingStats from "@/components/VotingStats";
import AppHeader from "@/components/AppHeader";
import AddSongToSetlist from "@/components/AddSongToSetlist";
import { supabase } from "@/integrations/supabase/client";

interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  artist: {
    name: string;
  };
  venue: {
    name: string;
    city: string;
    state: string | null;
    country: string;
  };
  name: string | null;
  date: string;
  start_time: string | null;
  status: 'scheduled' | 'postponed' | 'canceled';
  ticketmaster_url: string | null;
  view_count: number;
}

interface Song {
  id: string;
  name: string;
  album: string;
}

interface SetlistSong {
  id: string;
  song_id: string;
  position: number;
  votes: number;
  song: Song;
  userVoted?: boolean;
}

interface Setlist {
  id: string;
  show_id: string;
  songs: SetlistSong[];
  created_at: string;
  updated_at: string;
}

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});

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
            artist:artists(name),
            venue:venues(name, city, state, country)
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
          const setlistData = await setlistService.getOrCreateSetlist(showId);
          
          if (setlistData) {
            console.log("Setlist found or created:", setlistData.id);
            
            // Get setlist with songs
            const setlistWithSongs = await setlistService.getSetlistWithSongs(setlistData.id);
            
            if (setlistWithSongs) {
              console.log("Setlist with songs loaded:", setlistWithSongs);
              let processedSetlist: Setlist;
              
              // Make sure the songs array exists
              if (setlistWithSongs.songs) {
                // Check user votes if logged in
                if (user) {
                  const { data: votesData } = await supabase
                    .from('votes')
                    .select('setlist_song_id')
                    .eq('user_id', user.id);
                    
                  if (votesData) {
                    const votesMap: Record<string, boolean> = {};
                    votesData.forEach(vote => {
                      votesMap[vote.setlist_song_id] = true;
                    });
                    setUserVotes(votesMap);
                    
                    // Mark songs user has voted for
                    const updatedSongs = setlistWithSongs.songs.map(song => ({
                      ...song,
                      userVoted: votesMap[song.id] || false
                    }));
                    
                    processedSetlist = {
                      ...setlistWithSongs,
                      songs: updatedSongs
                    };
                  } else {
                    processedSetlist = {
                      ...setlistWithSongs,
                      songs: setlistWithSongs.songs
                    };
                  }
                } else {
                  processedSetlist = {
                    ...setlistWithSongs,
                    songs: setlistWithSongs.songs
                  };
                }
                
                setSetlist(processedSetlist);
              } else {
                // Create an empty array if songs is undefined
                setSetlist({
                  ...setlistWithSongs,
                  songs: []
                });
                
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
            
            return {
              ...prev,
              songs: prev.songs.map(song => 
                song.id === payload.new.id
                  ? { ...song, votes: payload.new.votes }
                  : song
              ).sort((a, b) => b.votes - a.votes) // Re-sort by votes
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
              setSetlist(refreshedSetlist);
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
  }, [setlist]);

  // Handle voting for a song
  const handleVote = async (songId: string) => {
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
    
    if (userVotes[songId]) {
      toast.error("You've already voted for this song");
      return;
    }
    
    // Optimistically update UI
    setSetlist(prev => {
      if (!prev || !prev.songs) return prev;
      
      return {
        ...prev,
        songs: prev.songs.map(song => 
          song.id === songId
            ? { ...song, votes: song.votes + 1, userVoted: true }
            : song
        ).sort((a, b) => b.votes - a.votes) // Re-sort by votes
      };
    });
    
    setUserVotes(prev => ({ ...prev, [songId]: true }));
    
    try {
      console.log("Voting for song:", songId);
      const newVotes = await setlistService.voteForSong(songId);
      
      if (newVotes === null) {
        console.error("Vote failed, reverting UI");
        // Revert optimistic update
        setSetlist(prev => {
          if (!prev || !prev.songs) return prev;
          
          return {
            ...prev,
            songs: prev.songs.map(song => 
              song.id === songId
                ? { ...song, votes: song.votes - 1, userVoted: false }
                : song
            ).sort((a, b) => b.votes - a.votes) // Re-sort by votes
          };
        });
        
        setUserVotes(prev => {
          const newState = { ...prev };
          delete newState[songId];
          return newState;
        });
        
        toast.error("Failed to vote for song");
      } else {
        console.log("Vote successful, new vote count:", newVotes);
      }
    } catch (error) {
      console.error("Error voting:", error);
      
      // Revert optimistic update
      setSetlist(prev => {
        if (!prev || !prev.songs) return prev;
        
        return {
          ...prev,
          songs: prev.songs.map(song => 
            song.id === songId
              ? { ...song, votes: song.votes - 1, userVoted: false }
              : song
          ).sort((a, b) => b.votes - a.votes) // Re-sort by votes
        };
      });
      
      setUserVotes(prev => {
        const newState = { ...prev };
        delete newState[songId];
        return newState;
      });
      
      toast.error("An error occurred while voting");
    }
  };

  // Handle song added to setlist
  const handleSongAdded = async () => {
    if (setlist) {
      console.log("Refreshing setlist after song was added");
      const refreshedSetlist = await setlistService.getSetlistWithSongs(setlist.id);
      if (refreshedSetlist) {
        setSetlist(refreshedSetlist);
      }
    }
  };

  // Check remaining votes allowed
  const usedVotesCount = Object.keys(userVotes).length;
  const maxFreeVotes = 3;
  const votesRemaining = user ? 'Unlimited' : maxFreeVotes - usedVotesCount;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header */}
      <div className="relative h-64 bg-gradient-to-br from-cyan-600/20 to-blue-600/20">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto max-w-7xl px-4 h-full flex items-center">
          {show?.artist_id && (
            <Link to={`/artist/${show.artist_id}`} className="text-gray-300 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2 inline-block" />
              Back to artist
            </Link>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-sm font-medium
                ${show?.status === 'canceled' ? 'bg-red-600 text-white' : 
                  show?.status === 'postponed' ? 'bg-yellow-600 text-white' :
                  'bg-cyan-600 text-white'}`}>
                {show?.status === 'scheduled' ? 'Upcoming' : 
                 show?.status === 'canceled' ? 'Canceled' : 'Postponed'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {show?.artist?.name || "Loading..."}
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              {show?.name || 'Concert'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-gray-300">
              {show?.date && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-cyan-400" />
                  {format(new Date(show.date), 'EEEE, MMMM d, yyyy')}
                  {show.start_time && ` at ${format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}`}
                </div>
              )}
              {show?.venue && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-cyan-400" />
                  {show.venue.name}, {show.venue.city}
                  {show.venue.state ? `, ${show.venue.state}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">What do you want to hear?</h2>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  {setlist?.songs?.reduce((total, song) => total + song.votes, 0) || 0} votes
                </Button>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  Share
                </Button>
              </div>
            </div>

            {votingError && (
              <div className="bg-red-900/20 border border-red-900 text-red-300 p-4 rounded-md mb-6 flex items-start">
                <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{votingError}</p>
                  <p className="text-sm opacity-80 mt-1">
                    Sign in to vote on setlists. Non-logged in users can vote up to 3 times.
                  </p>
                </div>
              </div>
            )}

            <p className="text-gray-300 mb-6">Vote for songs you want to hear at this show.</p>

            {/* Add Song Section */}
            {setlist && show?.artist_id && (
              <Card className="bg-gray-900 border-gray-800 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Add a song to this setlist:</span>
                    <AddSongToSetlist
                      setlistId={setlist.id}
                      artistId={show.artist_id}
                      onSongAdded={handleSongAdded}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Add your favorite songs to the setlist for everyone to vote on.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Songs List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-800 rounded"></div>
                          <div className="space-y-2">
                            <div className="w-48 h-4 bg-gray-800 rounded"></div>
                            <div className="w-32 h-3 bg-gray-800 rounded"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-800 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : setlist && setlist.songs && setlist.songs.length > 0 ? (
              <div className="space-y-4">
                {setlist.songs.map((song, index) => (
                  <Card 
                    key={song.id} 
                    className={`bg-gray-900 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 ${
                      song.userVoted ? 'border-l-4 border-l-cyan-500' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-gray-400 w-8">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{song.song.name}</h3>
                            <p className="text-gray-400 text-sm">{song.song.album}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-white font-bold">{song.votes}</div>
                            <div className="text-gray-400 text-xs">VOTES</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVote(song.id)}
                              className={`h-8 w-8 p-0 
                                ${song.userVoted 
                                  ? 'text-cyan-400 bg-cyan-400/20' 
                                  : usedVotesCount >= maxFreeVotes && !user
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-cyan-400'
                                }`}
                              disabled={song.userVoted || (usedVotesCount >= maxFreeVotes && !user)}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-lg">
                <h3 className="text-lg font-medium text-gray-300">No songs in setlist yet</h3>
                <p className="text-gray-400 mt-2">Be the first to add a song!</p>
              </div>
            )}

            <div className="text-center text-gray-400 text-sm mt-6">
              You've used {usedVotesCount}/{votesRemaining === 'Unlimited' ? '∞' : maxFreeVotes} {votesRemaining === 'Unlimited' ? '' : 'free'} votes
              {!user && usedVotesCount < maxFreeVotes && (
                <p className="mt-2">Sign in to vote on unlimited songs!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <VotingStats />
            
            {/* How It Works */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Anyone can add songs to the setlist. Select from the dropdown above to help build the perfect concert.
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Voting closes 2 hours before the show
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Ticket Link */}
            {show?.ticketmaster_url && (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Tickets</h3>
                  <a 
                    href={show.ticketmaster_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      Buy Tickets on Ticketmaster
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
