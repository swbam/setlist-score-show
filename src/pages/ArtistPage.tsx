import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Music, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import AppHeader from "@/components/AppHeader";
import VotingStats from "@/components/VotingStats";
import { supabase } from "@/integrations/supabase/client";
import { SpotifyArtist } from "@/services/spotify";
import { toast } from "@/components/ui/sonner";

const ArtistPage = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<any[]>([]);
  const [pastShows, setPastShows] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if user is following this artist
  useEffect(() => {
    async function checkFollowingStatus() {
      if (!user || !artistId) return;
      
      try {
        const { data } = await supabase
          .from('user_artists')
          .select('id')
          .eq('user_id', user.id)
          .eq('artist_id', artistId)
          .limit(1);
          
        setIsFollowing(data && data.length > 0);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    }
    
    checkFollowingStatus();
  }, [user, artistId]);
  
  // Fetch artist details and shows
  useEffect(() => {
    async function fetchArtistData() {
      if (!artistId) return;
      
      setLoading(true);
      
      try {
        // First try to get from database
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();
        
        let artistInfo: SpotifyArtist | null = null;
        
        if (artistError || !artistData || isDataStale(artistData.last_synced_at)) {
          // Fetch from API if not found or stale
          artistInfo = await spotifyService.getArtist(artistId);
          
          if (artistInfo) {
            // Store in database
            await spotifyService.storeArtistInDatabase(artistInfo);
          }
        } else {
          // Use database data
          artistInfo = {
            id: artistData.id,
            name: artistData.name,
            images: artistData.image_url ? [{ url: artistData.image_url, height: 300, width: 300 }] : [],
            popularity: artistData.popularity || 0,
            genres: artistData.genres || [],
            external_urls: { spotify: artistData.spotify_url || '' }
          };
        }
        
        if (artistInfo) {
          setArtist(artistInfo);
          
          // Get upcoming shows for this artist
          const artistShows = await fetchArtistShows(artistInfo.name);
          
          // Split into upcoming and past shows
          const now = new Date();
          const upcoming: any[] = [];
          const past: any[] = [];
          
          artistShows.forEach(show => {
            const showDate = new Date(show.date);
            if (showDate > now) {
              upcoming.push(show);
            } else {
              past.push(show);
            }
          });
          
          setUpcomingShows(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          setPastShows(past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
          toast.error("Could not find artist information");
        }
      } catch (error) {
        console.error("Error fetching artist data:", error);
        toast.error("Failed to load artist information");
      } finally {
        setLoading(false);
      }
    }
    
    fetchArtistData();
  }, [artistId]);
  
  // Check if data is more than 7 days old
  function isDataStale(lastSyncedAt: string) {
    if (!lastSyncedAt) return true;
    
    const syncedDate = new Date(lastSyncedAt);
    const now = new Date();
    const diffDays = (now.getTime() - syncedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffDays > 7;
  }
  
  // Fetch shows for the artist
  async function fetchArtistShows(artistName: string) {
    try {
      // First check database for shows
      const { data: dbShows, error: dbError } = await supabase
        .from('shows')
        .select(`
          *,
          venue:venues(name, city, state, country)
        `)
        .eq('artist_id', artistId);
        
      if (dbError) {
        console.error("Error fetching shows from database:", dbError);
      }
      
      // If we have shows and the most recent show was updated in the last 24 hours, use db data
      if (dbShows && dbShows.length > 0) {
        // Check if we should refresh from API
        // For now, we'll always return the database results and refresh in the background
        refreshShowsInBackground(artistName, artistId as string);
        return dbShows;
      }
      
      // Otherwise, fetch from Ticketmaster API and store results
      return await fetchAndStoreShows(artistName, artistId as string);
    } catch (error) {
      console.error("Error fetching artist shows:", error);
      return [];
    }
  }
  
  // Fetch shows from API and store in database
  async function fetchAndStoreShows(artistName: string, artistId: string) {
    const events = await ticketmasterService.getArtistEvents(artistName);
    const shows: any[] = [];
    
    for (const event of events) {
      // Skip if no venue or date
      if (!event._embedded?.venues?.[0] || !event.dates?.start?.dateTime) {
        continue;
      }
      
      const venue = event._embedded.venues[0];
      
      // Store venue in database
      await ticketmasterService.storeVenueInDatabase(venue);
      
      // Store show in database
      await ticketmasterService.storeShowInDatabase(event, artistId, venue.id);
      
      // Add to results
      shows.push({
        id: event.id,
        artist_id: artistId,
        venue_id: venue.id,
        name: event.name,
        date: event.dates.start.dateTime,
        start_time: event.dates.start.localTime || null,
        status: event.dates.status?.code === 'cancelled' ? 'canceled' : 
               event.dates.status?.code === 'postponed' ? 'postponed' : 'scheduled',
        ticketmaster_url: event.url || null,
        venue: {
          name: venue.name,
          city: venue.city?.name || '',
          state: venue.state?.name || null,
          country: venue.country?.name || ''
        }
      });
    }
    
    return shows;
  }
  
  // Refresh shows in the background
  async function refreshShowsInBackground(artistName: string, artistId: string) {
    // Don't await this to prevent blocking the UI
    fetchAndStoreShows(artistName, artistId).catch(console.error);
  }
  
  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please sign in to follow artists", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/login"
        }
      });
      return;
    }
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_artists')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artistId);
          
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${artist?.name}`);
      } else {
        // Follow
        // Get current max rank for this user
        const { data: rankData } = await supabase
          .from('user_artists')
          .select('rank')
          .eq('user_id', user.id)
          .order('rank', { ascending: false })
          .limit(1);
          
        const nextRank = rankData && rankData.length > 0 ? rankData[0].rank + 1 : 1;
        
        // Insert new follow
        const { error } = await supabase
          .from('user_artists')
          .insert({
            user_id: user.id,
            artist_id: artistId,
            rank: nextRank
          });
          
        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Now following ${artist?.name}`);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast.error("Could not update follow status");
    }
  };
  
  // Show loading state
  if (loading || !artist) {
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
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Artist Header */}
      <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 pt-24 pb-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-40 h-40 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
              {artist.images && artist.images[0] ? (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Music className="h-16 w-16 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white">{artist.name}</h1>
              
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  {artist.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex gap-4 justify-center md:justify-start">
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? "border-cyan-500 text-cyan-500" : "bg-cyan-600 hover:bg-cyan-700"}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                
                {artist.external_urls?.spotify && (
                  <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-gray-700 text-gray-300">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.16-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.78 1.02.42 1.56-.24.48-.96.72-1.56.42z" />
                      </svg>
                      Spotify
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for Upcoming/Past Shows */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="bg-gray-900/60 border border-gray-800">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-600">
              Upcoming Shows
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-cyan-600">
              Past Shows
            </TabsTrigger>
          </TabsList>
          
          {/* Upcoming Shows Tab */}
          <TabsContent value="upcoming">
            {upcomingShows.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No upcoming shows</h3>
                <p className="text-gray-400 mb-6">
                  {artist.name} doesn't have any upcoming shows at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingShows.map((show) => (
                  <Card 
                    key={show.id}
                    className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              show.status === 'canceled' ? 'bg-red-900/50 text-red-300' :
                              show.status === 'postponed' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-green-900/50 text-green-300'
                            }`}>
                              {show.status === 'canceled' ? 'Canceled' :
                               show.status === 'postponed' ? 'Postponed' :
                              'Upcoming'}
                            </span>
                            <h3 className="text-lg font-semibold text-white">
                              {show.name}
                            </h3>
                          </div>
                          
                          <div className="flex flex-col space-y-2 text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-cyan-500" />
                              <span>{format(new Date(show.date), 'EEEE, MMMM d, yyyy')}</span>
                              {show.start_time && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                              <span>
                                {show.venue?.name}, {show.venue?.city}
                                {show.venue?.state ? `, ${show.venue.state}` : ''}, {show.venue?.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex space-x-3">
                          <Link to={`/show/${show.id}`}>
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                              Vote on Setlist
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Past Shows Tab */}
          <TabsContent value="past">
            {pastShows.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No past shows</h3>
                <p className="text-gray-400 mb-6">
                  {artist.name} doesn't have any past shows in our database
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastShows.map((show) => (
                  <Card 
                    key={show.id}
                    className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                        <div className="flex-grow space-y-2">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {show.name}
                          </h3>
                          
                          <div className="flex flex-col space-y-2 text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-cyan-500" />
                              <span>{format(new Date(show.date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                              <span>
                                {show.venue?.name}, {show.venue?.city}
                                {show.venue?.state ? `, ${show.venue.state}` : ''}, {show.venue?.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex space-x-3">
                          <Link to={`/comparison/${show.id}`}>
                            <Button variant="outline" className="border-cyan-600 text-cyan-500">
                              View Comparison
                            </Button>
                          </Link>
                          <Link to={`/show/${show.id}`}>
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                              View Setlist
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Stats Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Artist Stats</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VotingStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistPage;
