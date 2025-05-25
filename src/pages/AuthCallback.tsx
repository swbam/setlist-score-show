
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { storeUserProfile, fetchUserTopArtistsFromSpotify } from "@/services/auth";
import { toast } from "@/components/ui/sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Processing auth callback...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          toast.error("Authentication failed. Please try again.");
          navigate("/login");
          return;
        }
        
        if (data.session && data.session.user) {
          const user = data.session.user;
          console.log("User authenticated successfully:", user.id);
          
          // Store user profile in database
          const profileStored = await storeUserProfile(user);
          
          if (!profileStored) {
            console.warn("Failed to store user profile, but continuing...");
          }
          
          // Check if user signed in with Spotify
          const isSpotifyUser = user.app_metadata?.provider === 'spotify';
          
          if (isSpotifyUser) {
            console.log("Spotify user detected, importing top artists...");
            toast.loading("Importing your favorite artists from Spotify...", { duration: 3000 });
            
            try {
              const success = await fetchUserTopArtistsFromSpotify();
              
              if (success) {
                toast.success("Successfully imported your favorite artists from Spotify!");
              } else {
                toast.info("Could not import artists from Spotify, but you can still search and add them manually.");
              }
            } catch (importError) {
              console.error("Error importing Spotify artists:", importError);
              toast.info("Could not import artists from Spotify, but you can still search and add them manually.");
            }
          } else {
            toast.success("Successfully signed in!");
          }
          
          // Navigate to profile page
          setTimeout(() => {
            navigate("/profile");
          }, 1000);
        } else {
          console.warn("No session found in callback");
          toast.error("Authentication session not found. Please try signing in again.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        toast.error("An unexpected error occurred during authentication.");
        navigate("/login");
      }
    };

    // Delay callback handling to ensure auth state is properly initialized
    const timeoutId = setTimeout(() => {
      handleCallback();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-cyan-500 animate-spin mx-auto" />
          <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Completing sign in...</h1>
          <p className="text-gray-400 max-w-md">
            Please wait while we set up your account and import your preferences.
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <span>Setting up your personalized experience</span>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
