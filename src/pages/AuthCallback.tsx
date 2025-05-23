
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import * as userService from '@/services/user';
import { storeUserProfile } from "@/services/auth";

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
          
          // Store user in database
          await storeUserProfile(user);
          
          // If Spotify user, fetch and store their top artists
          const isSpotifyUser = user.app_metadata?.provider === 'spotify';
          
          if (isSpotifyUser) {
            // We'll implement this later with proper Spotify API integration
            // For now, we redirect to the profile page
            console.log("Spotify user authenticated, will fetch top artists later");
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

    // Small delay to ensure auth state is properly initialized
    setTimeout(() => {
      handleCallback();
    }, 300);
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
