
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import * as userService from '@/services/user';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          throw error;
        }
        
        if (data.session) {
          const user = data.session.user;
          
          // Check if user has Spotify provider
          const isSpotifyUser = user.app_metadata?.provider === 'spotify';
          
          // Get user details
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user) {
            // Extract user details
            const displayName = 
              userData.user.user_metadata?.full_name || 
              userData.user.user_metadata?.name || 
              "User";
            
            const email = userData.user.email;
            const spotifyId = isSpotifyUser ? userData.user.user_metadata?.provider_id : null;
            const avatarUrl = userData.user.user_metadata?.avatar_url || null;
            
            // Store user in database
            await userService.upsertUser(
              userData.user.id,
              email || null,
              spotifyId,
              displayName,
              avatarUrl
            );
            
            // If Spotify user, fetch and store their top artists
            if (isSpotifyUser) {
              // This would be implemented with proper Spotify API
              // We would populate the user_artists table here
            }
          }
          
          // Navigate to profile
          navigate("/profile");
        } else {
          // No session found
          navigate("/login");
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Completing sign in...</h1>
        <p className="text-gray-400 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;
