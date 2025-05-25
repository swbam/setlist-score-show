import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import { toast } from "sonner";

interface UserArtist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  rank: number;
  upcoming_shows_count?: number;
}

const MyArtistsDashboard = () => {
  const { user } = useAuth();
  const [topArtists, setTopArtists] = useState<UserArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserTopArtists();
    }
  }, [user]);

  const fetchUserTopArtists = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fix the relationship hint to specify which foreign key to use
      const { data: userArtists, error } = await supabase
        .from('user_artists')
        .select(`
          rank,
          artists!user_artists_artist_id_fkey (
            id,
            name,
            image_url,
            genres
          )
        `)
        .eq('user_id', user.id)
        .order('rank');

      if (error) {
        console.error('Error fetching user artists:', error);
        return;
      }

      if (userArtists && userArtists.length > 0) {
        // Format the data and get show counts
        const formattedArtists = await Promise.all(
          userArtists.map(async (ua) => {
            const artist = ua.artists;
            if (!artist) return null;

            // Get upcoming shows count
            const { count } = await supabase
              .from('shows')
              .select('id', { count: 'exact' })
              .eq('artist_id', artist.id)
              .gte('date', new Date().toISOString());

            return {
              id: artist.id,
              name: artist.name,
              image_url: artist.image_url,
              genres: artist.genres,
              rank: ua.rank,
              upcoming_shows_count: count || 0
            };
          })
        );

        setTopArtists(formattedArtists.filter(Boolean) as UserArtist[]);
      } else {
        // If no artists in database, show import option
        console.log("No user artists found in database");
      }
    } catch (error) {
      console.error('Error fetching user top artists:', error);
      toast.error("Failed to load your artists");
    } finally {
      setLoading(false);
    }
  };

  const importFromSpotify = async () => {
    if (!user?.email) {
      toast.error("Please log in with Spotify to import your top artists");
      return;
    }

    try {
      setImporting(true);
      toast.info("Importing your top artists from Spotify...");

      // This would typically require Spotify user authentication
      // For now, we'll use a placeholder implementation
      // In a real app, you'd use the Spotify user token to get their top artists
      
      // Placeholder: Import some popular artists as user's top artists
      const popularArtists = await spotifyService.searchArtists("Taylor Swift");
      
      if (popularArtists.length > 0) {
        const artist = popularArtists[0];
        
        // Store artist in our database
        await spotifyService.storeArtistInDatabase(artist);
        
        // Add to user's artists
        const { error } = await supabase
          .from('user_artists')
          .upsert({
            user_id: user.id,
            artist_id: artist.id,
            rank: 1
          });

        if (error) {
          console.error('Error storing user artist:', error);
          toast.error("Failed to save artist");
        } else {
          toast.success("Artist imported successfully!");
          fetchUserTopArtists();
        }
      }
    } catch (error) {
      console.error('Error importing from Spotify:', error);
      toast.error("Failed to import from Spotify");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Artists</h2>
        </div>
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

  if (topArtists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Artists</h2>
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
        
        <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
          <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No artists yet</h3>
          <p className="text-gray-400 mb-6">
            Import your top artists from Spotify or search for artists to follow
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={importFromSpotify}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? "Importing..." : "Import from Spotify"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Browse Artists</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">My Artists</h2>
          <p className="text-gray-400">Your followed artists and upcoming shows</p>
        </div>
        <Button 
          onClick={importFromSpotify}
          disabled={importing}
          variant="outline"
          className="border-gray-700"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {topArtists.map((artist) => (
          <Card key={artist.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300 group">
            <Link to={`/artists/${artist.id}/${artist.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')}`} className="block h-full">
              <div className="h-40 bg-gray-800 relative">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Music className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                
                {artist.upcoming_shows_count && artist.upcoming_shows_count > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-cyan-600 text-white">
                    {artist.upcoming_shows_count} shows
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-white font-medium truncate">{artist.name}</h3>
                {artist.genres && artist.genres.length > 0 && (
                  <p className="text-sm text-gray-400 truncate">
                    {artist.genres.slice(0, 2).join(", ")}
                  </p>
                )}
                {artist.upcoming_shows_count !== undefined && (
                  <div className="flex items-center text-xs text-cyan-400 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {artist.upcoming_shows_count} upcoming shows
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyArtistsDashboard;
