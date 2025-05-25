
import { useState, useEffect } from "react";
import { Music, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { SpotifyArtist } from "@/services/spotify";

interface ArtistHeaderProps {
  artist: SpotifyArtist;
  upcomingShowsCount: number;
}

export function ArtistHeader({ artist, upcomingShowsCount }: ArtistHeaderProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Check if user is following this artist
  useEffect(() => {
    async function checkFollowingStatus() {
      if (!user || !artist?.id) return;
      
      try {
        const { data } = await supabase
          .from('user_artists')
          .select('id')
          .eq('user_id', user.id)
          .eq('artist_id', artist.id)
          .limit(1);
          
        setIsFollowing(data && data.length > 0);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    }
    
    checkFollowingStatus();
  }, [user, artist?.id]);

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
          .eq('artist_id', artist.id);
          
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
            artist_id: artist.id,
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

  return (
    <div className="relative min-h-[400px] bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Background image with overlay */}
      {artist.images && artist.images[0] && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${artist.images[0].url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
        </div>
      )}
      
      <div className="relative container mx-auto max-w-7xl px-4 pt-20 pb-10">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Artist Image */}
          <div className="w-48 h-48 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 shadow-2xl">
            {artist.images && artist.images[0] ? (
              <img
                src={artist.images[0].url}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <Music className="h-20 w-20 text-gray-600" />
              </div>
            )}
          </div>
          
          {/* Artist Info */}
          <div className="flex-1 text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{artist.name}</h1>
            
            {/* Show count */}
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-yellow-metal-400" />
              <span className="text-yellow-metal-400 font-medium">
                {upcomingShowsCount} upcoming shows
              </span>
            </div>
            
            {/* Genres */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {artist.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="bg-yellow-metal-900/50 text-yellow-metal-300 px-3 py-1 rounded-full text-sm border border-yellow-metal-800"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                size="lg"
                className={isFollowing ? 
                  "border-yellow-metal-500 text-yellow-metal-300 hover:bg-yellow-metal-900/50" : 
                  "bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-semibold"
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              
              {artist.external_urls?.spotify && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-yellow-metal-600 text-yellow-metal-300 hover:bg-yellow-metal-900/50"
                  asChild
                >
                  <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.16-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.78 1.02.42 1.56-.24.48-.96.72-1.56.42z" />
                    </svg>
                    Open in Spotify
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
