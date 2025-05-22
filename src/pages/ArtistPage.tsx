
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import * as userService from "@/services/user";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { CalendarDays, Clock, MapPin, Star, Ticket, PlusCircle, MinusCircle } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  image_url: string | null;
  genres: string[] | null;
  popularity: number | null;
}

interface Show {
  id: string;
  name: string | null;
  date: string;
  start_time: string | null;
  status: 'scheduled' | 'postponed' | 'canceled';
  ticketmaster_url: string | null;
  venue: {
    name: string;
    city: string;
    state: string | null;
    country: string;
  };
}

const ArtistPage = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingArtist, setIsFollowingArtist] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch artist details and shows
  useEffect(() => {
    async function fetchArtistAndShows() {
      if (!artistId) return;
      
      try {
        setLoading(true);
        
        // Get artist from database
        const { data: artistData } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();
        
        if (artistData) {
          setArtist(artistData);
          
          // If the artist is in the database, get their shows
          const { data: showsData, error: showsError } = await supabase
            .from('shows')
            .select(`
              *,
              venue:venues(name, city, state, country)
            `)
            .eq('artist_id', artistId)
            .order('date');
            
          if (showsError) {
            console.error("Error fetching shows:", showsError);
          } else {
            setShows(showsData || []);
          }
        } else {
          // If artist not in database, fetch from Spotify
          const spotifyArtist = await spotifyService.getArtist(artistId);
          
          if (spotifyArtist) {
            // Store artist in database
            await spotifyService.storeArtistInDatabase(spotifyArtist);
            
            setArtist({
              id: spotifyArtist.id,
              name: spotifyArtist.name,
              image_url: spotifyArtist.images?.[0]?.url || null,
              genres: spotifyArtist.genres || null,
              popularity: spotifyArtist.popularity || null
            });
            
            // Fetch shows from Ticketmaster
            const events = await ticketmasterService.getArtistEvents(spotifyArtist.name);
            
            // Process and store shows
            if (events && events.length > 0) {
              await processAndStoreEvents(events, spotifyArtist.id);
            }
          } else {
            toast.error("Artist not found");
            navigate("/");
          }
        }
        
        // Check if user is following this artist
        if (user) {
          const following = await userService.isFollowingArtist(artistId);
          setIsFollowingArtist(following);
        }
      } catch (error) {
        console.error("Error fetching artist data:", error);
        toast.error("Failed to load artist details");
      } finally {
        setLoading(false);
      }
    }
    
    fetchArtistAndShows();
  }, [artistId, navigate, user]);

  // Process and store events from Ticketmaster
  async function processAndStoreEvents(events: ticketmasterService.TicketmasterEvent[], artistId: string) {
    try {
      const processedShows: Show[] = [];
      
      for (const event of events) {
        // Only process events with venues
        if (event._embedded?.venues?.[0]) {
          const venue = event._embedded.venues[0];
          
          // Store venue in database
          await ticketmasterService.storeVenueInDatabase(venue);
          
          // Store show in database
          await ticketmasterService.storeShowInDatabase(event, artistId, venue.id);
          
          // Add to processed shows
          processedShows.push({
            id: event.id,
            name: event.name,
            date: event.dates.start.dateTime,
            start_time: event.dates.start.localTime || null,
            status: 
              event.dates.status?.code === 'cancelled' ? 'canceled' :
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
      }
      
      // Update state with processed shows
      setShows(processedShows);
    } catch (error) {
      console.error("Error processing events:", error);
    }
  }

  // Handle following/unfollowing artist
  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please sign in to follow artists");
      navigate("/login");
      return;
    }
    
    try {
      setFollowLoading(true);
      
      if (isFollowingArtist) {
        // Unfollow artist
        const success = await userService.unfollowArtist(artistId || '');
        
        if (success) {
          setIsFollowingArtist(false);
          toast.success(`Unfollowed ${artist?.name}`);
        } else {
          toast.error("Failed to unfollow artist");
        }
      } else {
        // Follow artist
        const success = await userService.followArtist(artistId || '');
        
        if (success) {
          setIsFollowingArtist(true);
          toast.success(`Following ${artist?.name}`);
        } else {
          toast.error("Failed to follow artist");
        }
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast.error("An error occurred");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Artist Header */}
      <div className="relative">
        {/* Background Image with Gradient Overlay */}
        <div className="h-64 md:h-80 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
          {artist?.image_url && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-md"
                style={{ backgroundImage: `url(${artist.image_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black" />
            </>
          )}
        </div>
        
        {/* Artist Info */}
        <div className="container mx-auto max-w-7xl px-4 relative -mt-24">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            {/* Artist Image */}
            {loading ? (
              <Skeleton className="w-48 h-48 rounded-lg flex-shrink-0" />
            ) : artist?.image_url ? (
              <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 border-4 border-black shadow-xl">
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-lg flex-shrink-0 bg-gray-900 flex items-center justify-center border-4 border-black shadow-xl">
                <Star className="h-12 w-12 text-cyan-500" />
              </div>
            )}
            
            {/* Artist Details */}
            <div className="flex-grow md:pb-6">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold text-white">{artist?.name}</h1>
                  {artist?.genres && artist.genres.length > 0 && (
                    <p className="text-gray-400 mt-2">
                      {artist.genres.slice(0, 3).join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>
            
            {/* Follow Button */}
            {!loading && (
              <Button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={isFollowingArtist 
                  ? "bg-gray-700 hover:bg-gray-600 md:mb-6" 
                  : "bg-cyan-600 hover:bg-cyan-700 md:mb-6"
                }
              >
                {followLoading ? (
                  <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
                ) : isFollowingArtist ? (
                  <MinusCircle className="h-4 w-4 mr-2" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                {isFollowingArtist ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Artist Content */}
      <div className="container mx-auto max-w-7xl px-4 pb-16">
        <Tabs defaultValue="upcoming" className="space-y-6">
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
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-full mb-4" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : shows.length > 0 ? (
              <div className="space-y-4">
                {shows
                  .filter(show => new Date(show.date) >= new Date())
                  .map(show => {
                    const eventDate = new Date(show.date);
                    return (
                      <Card 
                        key={show.id}
                        className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
                      >
                        <CardContent className="p-0">
                          <Link to={`/show/${show.id}`} className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                            <div className="flex-grow space-y-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  show.status === 'canceled' ? 'bg-red-900/50 text-red-300' :
                                  show.status === 'postponed' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-green-900/50 text-green-300'
                                }`}>
                                  {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
                                </span>
                                <h3 className="text-lg font-semibold text-white">
                                  {show.name || `${artist?.name} Concert`}
                                </h3>
                              </div>
                              
                              <div className="flex flex-col space-y-2 text-gray-400">
                                <div className="flex items-center">
                                  <CalendarDays className="h-4 w-4 mr-2 text-cyan-500" />
                                  <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                                  {show.start_time && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <Clock className="h-4 w-4 mr-2 text-cyan-500" />
                                      <span>{format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}</span>
                                    </>
                                  )}
                                </div>
                                
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                                  <span>
                                    {show.venue.name}, {show.venue.city}
                                    {show.venue.state ? `, ${show.venue.state}` : ''}, {show.venue.country}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0 flex items-center space-x-4">
                              <Button className="bg-cyan-600 hover:bg-cyan-700">
                                Vote on Setlist
                              </Button>
                              
                              {show.ticketmaster_url && (
                                <a 
                                  href={show.ticketmaster_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Button variant="outline" className="border-gray-700">
                                    <Ticket className="h-4 w-4 mr-2" />
                                    Tickets
                                  </Button>
                                </a>
                              )}
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <CalendarDays className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No upcoming shows found</h3>
                <p className="text-gray-400">
                  We couldn't find any upcoming shows for this artist
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Past Shows Tab */}
          <TabsContent value="past">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-full mb-4" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : shows
                .filter(show => new Date(show.date) < new Date())
                .length > 0 ? (
              <div className="space-y-4">
                {shows
                  .filter(show => new Date(show.date) < new Date())
                  .map(show => {
                    const eventDate = new Date(show.date);
                    return (
                      <Card 
                        key={show.id}
                        className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
                      >
                        <CardContent className="p-0">
                          <Link to={`/comparison/${show.id}`} className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                            <div className="flex-grow space-y-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300">
                                  Past Show
                                </span>
                                <h3 className="text-lg font-semibold text-white">
                                  {show.name || `${artist?.name} Concert`}
                                </h3>
                              </div>
                              
                              <div className="flex flex-col space-y-2 text-gray-400">
                                <div className="flex items-center">
                                  <CalendarDays className="h-4 w-4 mr-2 text-cyan-500" />
                                  <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                                  <span>
                                    {show.venue.name}, {show.venue.city}
                                    {show.venue.state ? `, ${show.venue.state}` : ''}, {show.venue.country}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 md:mt-0">
                              <Button className="bg-gray-700 hover:bg-gray-600">
                                View Setlist
                              </Button>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <CalendarDays className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No past shows found</h3>
                <p className="text-gray-400">
                  We couldn't find any past shows for this artist
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistPage;
