
import { useState, useEffect } from "react";
import { Music, Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { SpotifyArtist } from "@/services/spotify";
import { useMobile } from "@/context/MobileContext";

interface ArtistHeaderProps {
  artist: SpotifyArtist;
  upcomingShowsCount: number;
}

export function ArtistHeader({ artist, upcomingShowsCount }: ArtistHeaderProps) {
  const { user } = useAuth();
  const { isMobile } = useMobile();
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
        const { data: rankData } = await supabase
          .from('user_artists')
          .select('rank')
          .eq('user_id', user.id)
          .order('rank', { ascending: false })
          .limit(1);
          
        const nextRank = rankData && rankData.length > 0 ? rankData[0].rank + 1 : 1;
        
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
    <div className="relative bg-black">
      {/* Hero Background with Artist Image */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        {artist.images && artist.images[0] && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${artist.images[0].url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"></div>
          </div>
        )}
        
        {/* Artist Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto max-w-7xl px-4 pb-8">
            <div className="flex flex-col space-y-4">
              {/* Artist Name */}
              <h1 className={`font-bold text-white leading-tight ${isMobile ? 'text-4xl' : 'text-6xl md:text-7xl'}`}>
                {artist.name}
              </h1>
              
              {/* Tour/Event Name */}
              <p className={`text-gray-300 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {upcomingShowsCount > 0 ? 'World Tour' : 'No upcoming shows'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show Info Bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Show Details */}
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-8">
              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  {upcomingShowsCount} upcoming {upcomingShowsCount === 1 ? 'show' : 'shows'}
                </span>
              </div>
              
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artist.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                className={`${isMobile ? 'w-full' : ''} ${
                  isFollowing 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-800" 
                    : "bg-white text-black hover:bg-gray-100 font-semibold"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              
              {artist.external_urls?.spotify && (
                <Button
                  variant="outline"
                  className={`${isMobile ? 'w-full' : ''} border-gray-600 text-gray-300 hover:bg-gray-800`}
                  asChild
                >
                  <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.16-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.78 1.02.42 1.56-.24.48-.96.72-1.56.42z" />
                    </svg>
                    <span>Open in Spotify</span>
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
