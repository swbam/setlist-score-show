
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Music, Calendar, TrendingUp, Plus, Star, Clock, PlayCircle, Heart, ArrowRight, Grid, List } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface UserArtist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  rank: number;
  upcoming_shows_count?: number;
  total_shows_count?: number;
  vote_count?: number;
  last_show_date?: string;
  next_show_date?: string;
  popularity?: number;
}

interface UpcomingShow {
  id: string;
  name: string;
  date: string;
  venue: {
    name: string;
    city: string;
    state?: string;
  };
  artist: {
    name: string;
    image_url?: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'vote' | 'follow' | 'show_added';
  artist_name: string;
  show_name?: string;
  created_at: string;
}

const MyArtistsDashboard = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [importing, setImporting] = useState(false);

  // Use React Query for better data management
  const { 
    data: userArtists, 
    isLoading, 
    error: artistsError,
    refetch 
  } = useQuery({
    queryKey: ['user-artists', user?.id],
    queryFn: fetchUserTopArtists,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const { 
    data: upcomingShows,
    isLoading: showsLoading,
    error: showsError 
  } = useQuery({
    queryKey: ['upcoming-shows', user?.id],
    queryFn: fetchUpcomingShows,
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const { 
    data: recentActivity,
    isLoading: activityLoading,
    error: activityError 
  } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: fetchRecentActivity,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  async function fetchUserTopArtists(): Promise<UserArtist[]> {
    if (!user) return [];

    try {
      const { data: userArtists, error } = await supabase
        .from('user_artists')
        .select(`
          rank,
          artists!user_artists_artist_id_fkey (
            id,
            name,
            image_url,
            genres,
            popularity
          )
        `)
        .eq('user_id', user.id)
        .order('rank');

      if (error) throw error;

      if (!userArtists || userArtists.length === 0) return [];

      // Get enhanced data for each artist
      const enhancedArtists = await Promise.all(
        userArtists.map(async (ua) => {
          const artist = ua.artists;
          if (!artist) return null;

          // Get show counts and dates
          const [upcomingShows, totalShows, userVotes] = await Promise.all([
            supabase
              .from('shows')
              .select('id', { count: 'exact' })
              .eq('artist_id', artist.id)
              .gte('date', new Date().toISOString()),
            
            supabase
              .from('shows')
              .select('id', { count: 'exact' })
              .eq('artist_id', artist.id),

            // Simplified vote count query
            supabase
              .rpc('get_user_vote_stats', { show_id_param: 'all' })
          ]);

          return {
            id: artist.id,
            name: artist.name,
            image_url: artist.image_url,
            genres: artist.genres,
            popularity: artist.popularity,
            rank: ua.rank,
            upcoming_shows_count: upcomingShows.count || 0,
            total_shows_count: totalShows.count || 0,
            vote_count: 0 // Simplified for now
          };
        })
      );

      return enhancedArtists.filter(Boolean) as UserArtist[];
    } catch (error) {
      console.error('Error fetching user artists:', error);
      throw error;
    }
  }

  async function fetchUpcomingShows(): Promise<UpcomingShow[]> {
    if (!user) return [];

    try {
      // First get user's artist IDs
      const { data: userArtistIds } = await supabase
        .from('user_artists')
        .select('artist_id')
        .eq('user_id', user.id);

      if (!userArtistIds || userArtistIds.length === 0) return [];

      const artistIds = userArtistIds.map(ua => ua.artist_id);

      // Then get shows for those artists
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          name,
          date,
          venue:venues!shows_venue_id_fkey (
            name,
            city,
            state
          ),
          artist:artists!shows_artist_id_fkey (
            name,
            image_url
          )
        `)
        .in('artist_id', artistIds)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming shows:', error);
      return [];
    }
  }

  async function fetchRecentActivity(): Promise<RecentActivity[]> {
    if (!user) return [];

    try {
      // Simplified recent activity - just get recent votes
      const { data: recentVotes, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          setlist_songs!votes_setlist_song_id_fkey (
            setlists!setlist_songs_setlist_id_fkey (
              shows!setlists_show_id_fkey (
                name,
                artist:artists!shows_artist_id_fkey (name)
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (votesError) throw votesError;

      const activity: RecentActivity[] = [];

      // Process votes with better error handling
      recentVotes?.forEach(vote => {
        try {
          const show = (vote.setlist_songs as any)?.setlists?.shows;
          if (show && show.artist) {
            activity.push({
              id: vote.id,
              type: 'vote',
              artist_name: show.artist.name || 'Unknown Artist',
              show_name: show.name || 'Untitled Show',
              created_at: vote.created_at
            });
          }
        } catch (e) {
          console.warn('Error processing vote:', e);
        }
      });

      return activity.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  const importFromSpotify = async () => {
    if (!user?.email) {
      toast.error("Please log in with Spotify to import your top artists");
      return;
    }

    try {
      setImporting(true);
      toast.info("Importing your top artists from Spotify...");

      // Enhanced Spotify import with multiple artists
      const searchTerms = [
        "Taylor Swift", "Ed Sheeran", "Billie Eilish", "Drake", "Ariana Grande",
        "The Weeknd", "Post Malone", "Dua Lipa", "Harry Styles", "Olivia Rodrigo"
      ];

      let importedCount = 0;
      const maxImports = 5;

      for (const term of searchTerms.slice(0, maxImports)) {
        try {
          const popularArtists = await spotifyService.searchArtists(term);
          
          if (popularArtists.length > 0) {
            const artist = popularArtists[0];
            
            // Store artist in our database
            await spotifyService.storeArtistInDatabase(artist);
            
            // Check if user already follows this artist
            const { data: existingFollow } = await supabase
              .from('user_artists')
              .select('id')
              .eq('user_id', user.id)
              .eq('artist_id', artist.id)
              .single();

            if (!existingFollow) {
              // Add to user's artists with incremental rank
              const { error } = await supabase
                .from('user_artists')
                .insert({
                  user_id: user.id,
                  artist_id: artist.id,
                  rank: importedCount + 1
                });

              if (error) {
                console.error('Error storing user artist:', error);
              } else {
                importedCount++;
              }
            }
          }
        } catch (error) {
          console.error(`Error importing ${term}:`, error);
        }
      }

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} artists from Spotify!`);
        refetch(); // Refresh the artists list
      } else {
        toast.info("No new artists were imported - you may already be following these artists.");
      }

    } catch (error) {
      console.error('Error importing from Spotify:', error);
      toast.error("Failed to import from Spotify. Please try again later.");
    } finally {
      setImporting(false);
    }
  };

  // Get unique genres for filtering
  const availableGenres = userArtists 
    ? Array.from(new Set(userArtists.flatMap(artist => artist.genres || [])))
    : [];

  // Filter artists based on selected genre
  const filteredArtists = userArtists?.filter(artist => 
    filterGenre === 'all' || artist.genres?.includes(filterGenre)
  ) || [];

  // Show error states if any critical errors occurred
  if (artistsError) {
    toast.error("Failed to load your artists. Please try refreshing the page.");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Star className="h-6 w-6 mr-2 text-yellow-metal-400" />
              My Artists
            </h2>
            <p className="text-gray-400">Your followed artists and upcoming shows</p>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
              <div className="h-40 bg-gray-800" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-800 rounded mb-2" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredArtists || filteredArtists.length === 0) {
    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Star className="h-6 w-6 mr-2 text-yellow-metal-400" />
              My Artists
            </h2>
            <p className="text-gray-400">Your followed artists and upcoming shows</p>
          </div>
          <Button 
            onClick={importFromSpotify}
            disabled={importing}
            className="bg-green-600 hover:bg-green-700"
          >
            {importing ? (
              <>
                <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Music className="h-4 w-4 mr-2" />
                Import from Spotify
              </>
            )}
          </Button>
        </div>
        
        {/* Empty State */}
        <div className="text-center py-16 bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl border border-gray-800">
          <div className="relative mb-6">
            <div className="h-24 w-24 bg-yellow-metal-900/30 rounded-full flex items-center justify-center mx-auto border border-yellow-metal-700/50">
              <Music className="h-10 w-10 text-yellow-metal-400" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-metal-600 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-white mb-2">Start Building Your Music Collection</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Import your favorite artists from Spotify or browse our catalog to start following artists and voting on setlists
          </p>
          
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Button 
              onClick={importFromSpotify}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {importing ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                  Importing from Spotify...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4 mr-2" />
                  Import from Spotify
                </>
              )}
            </Button>
            <Button variant="outline" className="border-yellow-metal-600 text-yellow-metal-400 hover:bg-yellow-metal-900/30" asChild>
              <Link to="/artists">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Artists
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Star className="h-8 w-8 mr-3 text-yellow-metal-400" />
            My Artists Dashboard
          </h2>
          <p className="text-gray-400 mt-1">
            Track your favorite artists, upcoming shows, and voting activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3 py-1.5"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Genres</option>
              {availableGenres.slice(0, 10).map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          )}

          <Button 
            onClick={importFromSpotify}
            disabled={importing}
            variant="outline"
            className="border-yellow-metal-600 text-yellow-metal-400 hover:bg-yellow-metal-900/30"
          >
            {importing ? (
              <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Music className="h-4 w-4 mr-2" />
            )}
            {importing ? 'Importing...' : 'Import Artists'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Following</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    userArtists?.length || 0
                  )}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Upcoming Shows</p>
                <p className="text-2xl font-bold text-white">
                  {showsLoading ? (
                    <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    userArtists?.reduce((sum, artist) => sum + (artist.upcoming_shows_count || 0), 0) || 0
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-metal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Votes</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    userArtists?.reduce((sum, artist) => sum + (artist.vote_count || 0), 0) || 0
                  )}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Artists</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    userArtists?.filter(artist => (artist.upcoming_shows_count || 0) > 0).length || 0
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="artists" className="space-y-6">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="artists" className="data-[state=active]:bg-yellow-metal-600 data-[state=active]:text-white">
            My Artists ({filteredArtists.length})
          </TabsTrigger>
          <TabsTrigger value="shows" className="data-[state=active]:bg-yellow-metal-600 data-[state=active]:text-white">
            Upcoming Shows ({upcomingShows?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-yellow-metal-600 data-[state=active]:text-white">
            Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* Artists Tab */}
        <TabsContent value="artists" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredArtists.map((artist) => (
                <Card 
                  key={artist.id} 
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:border-yellow-metal-500 transition-all duration-300 group focus-within:ring-2 focus-within:ring-yellow-metal-500"
                >
                  <Link 
                    to={`/artists/${artist.id}/${artist.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')}`} 
                    className="block h-full focus:outline-none"
                    aria-label={`View ${artist.name} artist page`}
                  >
                    <div className="h-40 bg-gray-800 relative overflow-hidden">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={`${artist.name} artist image`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback content */}
                      <div 
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 ${artist.image_url ? 'hidden' : 'flex'}`}
                        aria-hidden="true"
                      >
                        <Music className="h-8 w-8 text-gray-600" />
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge className="text-xs font-bold bg-yellow-metal-400 text-black">
                          #{artist.rank}
                        </Badge>
                        {(artist.upcoming_shows_count || 0) > 0 && (
                          <Badge className="text-xs bg-green-600 text-white">
                            {artist.upcoming_shows_count} show{artist.upcoming_shows_count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="text-white font-medium truncate group-hover:text-yellow-metal-400 transition-colors">
                        {artist.name}
                      </h3>
                      {artist.genres && artist.genres.length > 0 && (
                        <p className="text-sm text-gray-400 truncate" title={artist.genres.join(", ")}>
                          {artist.genres.slice(0, 2).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-gray-500" title="Total shows">
                          {artist.total_shows_count || 0} show{artist.total_shows_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-yellow-metal-400" title="Your votes">
                          {artist.vote_count || 0} vote{artist.vote_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredArtists.map((artist) => (
                <Card 
                  key={artist.id} 
                  className="bg-gray-900 border-gray-800 hover:border-yellow-metal-500 transition-all duration-300 focus-within:ring-2 focus-within:ring-yellow-metal-500"
                >
                  <Link 
                    to={`/artists/${artist.id}/${artist.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')}`}
                    className="focus:outline-none"
                    aria-label={`View ${artist.name} artist page - ${artist.upcoming_shows_count || 0} upcoming shows`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {artist.image_url ? (
                            <img
                              src={artist.image_url}
                              alt={`${artist.name} artist image`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback content */}
                          <div 
                            className={`w-full h-full flex items-center justify-center ${artist.image_url ? 'hidden' : 'flex'}`}
                            aria-hidden="true"
                          >
                            <Music className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium truncate">{artist.name}</h3>
                            <Badge className="text-xs bg-yellow-metal-400 text-black">#{artist.rank}</Badge>
                            {(artist.popularity && artist.popularity > 70) && (
                              <Badge className="text-xs bg-blue-600 text-white">Popular</Badge>
                            )}
                          </div>
                          {artist.genres && artist.genres.length > 0 && (
                            <p 
                              className="text-sm text-gray-400 truncate" 
                              title={artist.genres.join(", ")}
                            >
                              {artist.genres.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-white font-medium">{artist.upcoming_shows_count || 0}</p>
                            <p className="text-gray-400 text-xs">Upcoming</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium">{artist.total_shows_count || 0}</p>
                            <p className="text-gray-400 text-xs">Total Shows</p>
                          </div>
                          <div className="text-center">
                            <p className="text-yellow-metal-400 font-medium">{artist.vote_count || 0}</p>
                            <p className="text-gray-400 text-xs">My Votes</p>
                          </div>
                        </div>

                        <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-yellow-metal-400 transition-colors" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upcoming Shows Tab */}
        <TabsContent value="shows" className="space-y-4">
          {showsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-800 rounded w-2/3" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : showsError ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Failed to Load Shows</h3>
                <p className="text-gray-400 mb-4">
                  There was an error loading your upcoming shows.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="border-yellow-metal-600 text-yellow-metal-400"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : !upcomingShows || upcomingShows.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Upcoming Shows</h3>
                <p className="text-gray-400">
                  Your followed artists don't have any upcoming shows scheduled yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingShows.map((show) => (
                <Card key={show.id} className="bg-gray-900 border-gray-800 hover:border-yellow-metal-500 transition-all duration-300">
                  <Link to={`/shows/${show.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden">
                          {show.artist?.image_url ? (
                            <img
                              src={show.artist.image_url}
                              alt={show.artist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{show.artist?.name}</h3>
                          <p className="text-sm text-gray-400 truncate">{show.name || 'Concert'}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-yellow-metal-400 mr-2" />
                          <span className="text-white">
                            {new Date(show.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-400">
                            {show.venue?.city}, {show.venue?.state}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activityError ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Failed to Load Activity</h3>
                <p className="text-gray-400 mb-4">
                  There was an error loading your recent activity.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="border-yellow-metal-600 text-yellow-metal-400"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Recent Activity</h3>
                <p className="text-gray-400">
                  Start voting on setlists to see your activity here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <Card key={activity.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-metal-600 rounded-full flex items-center justify-center">
                        <PlayCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          You voted on <span className="font-medium">{activity.show_name}</span> by{' '}
                          <span className="text-yellow-metal-400 font-medium">{activity.artist_name}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyArtistsDashboard;
