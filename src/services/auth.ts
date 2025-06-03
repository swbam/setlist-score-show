
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";
import * as spotifyService from "./spotify";
import type { Artist } from "@/types/enhanced";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Clean up authentication state
export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

// Sign up with email/password
export async function signUp(email: string, password: string, displayName: string) {
  try {
    // Clean up existing auth state first
    cleanupAuthState();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return null;
    }

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      console.error("Sign up error:", error);
      if (error.message.includes('already registered')) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
      return null;
    }
    
    // If successful and have a user, store profile
    if (data?.user) {
      await storeUserProfile(data.user, displayName);
      toast.success("Account created successfully! Please check your email for verification.");
    }
    
    return data;
  } catch (error) {
    console.error("Error signing up:", error);
    toast.error("An unexpected error occurred. Please try again.");
    return null;
  }
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    cleanupAuthState();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error("Invalid email or password. Please check your credentials and try again.");
      } else {
        toast.error(error.message);
      }
      return null;
    }

    if (data?.user) {
      // Update user profile in case data has changed
      await storeUserProfile(data.user);
      toast.success("Successfully signed in!");
    }

    return data.session;
  } catch (error) {
    console.error("Error signing in:", error);
    toast.error("An unexpected error occurred. Please try again.");
    return null;
  }
}

// Sign in with Spotify OAuth
export async function signInWithSpotify() {
  try {
    cleanupAuthState();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user-read-email user-top-read user-follow-read',
      },
    });

    if (error) {
      console.error("Spotify OAuth error:", error);
      toast.error("Failed to connect with Spotify. Please try again.");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error signing in with Spotify:", error);
    toast.error("An unexpected error occurred. Please try again.");
    return null;
  }
}

// Sign out
export async function signOut() {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      console.error("Sign out error:", error);
    }

    // Force page reload for clean state
    window.location.href = '/';
  } catch (error) {
    console.error("Error signing out:", error);
    // Force reload even if signOut fails
    window.location.href = '/';
  }
}

// Store user profile in database
export async function storeUserProfile(user: User, displayName?: string) {
  try {
    if (!user) return false;
    
    // Supabase handles user storage automatically through auth.users
    // We can update user metadata if needed
    const updates = {
      data: {
        display_name: displayName || user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        spotify_id: user.app_metadata?.provider === 'spotify' ? user.user_metadata?.provider_id : null,
      }
    };
    
    const { error } = await supabase.auth.updateUser(updates);
      
    if (error) {
      console.error("Error updating user metadata:", error);
      return false;
    }
    
    console.log("Successfully updated user profile:", updates.data.display_name);
    return true;
  } catch (error) {
    console.error("Error storing user profile:", error);
    return false;
  }
}

// Get Spotify access token for a user
async function getSpotifyUserToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.error("Error getting user session:", error);
      return null;
    }
    
    const provider = data.session.user?.app_metadata?.provider;
    
    if (provider !== 'spotify') {
      console.log("User is not authenticated with Spotify");
      return null;
    }
    
    // Get the provider token
    const { data: tokenData, error: tokenError } = await supabase.auth.getUser();
    
    if (tokenError || !tokenData?.user) {
      console.error("Error getting user data:", tokenError);
      return null;
    }
    
    const token = tokenData.user?.app_metadata?.provider_token;
    
    if (!token) {
      console.log("No provider token found");
      return null;
    }
    
    return token;
  } catch (error) {
    console.error("Error getting Spotify user token:", error);
    return null;
  }
}

// Fetch user's top artists from Spotify and store them
export async function fetchUserTopArtistsFromSpotify(timeRange: string = 'medium_term'): Promise<boolean> {
  try {
    const accessToken = await getSpotifyUserToken();
    
    if (!accessToken) {
      console.log("No Spotify access token available for user");
      return false;
    }
    
    // Get user's top artists from Spotify
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=30`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error("Error fetching top artists from Spotify:", response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    const artists = data.items || [];
    
    if (artists.length === 0) {
      console.log("No top artists found for user");
      return false;
    }
    
    console.log(`Found ${artists.length} top artists for user`);
    
    // Get current user ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("Error getting user data:", userError);
      return false;
    }
    
    const userId = userData.user.id;
    
    // Process and store artists
    let storedCount = 0;
    
    for (let i = 0; i < artists.length; i++) {
      const artist = artists[i];
      const artistData: spotifyService.SpotifyArtist = {
        id: artist.id,
        name: artist.name,
        images: artist.images,
        popularity: artist.popularity,
        genres: artist.genres,
        external_urls: artist.external_urls
      };
      
      // Store artist in database
      const artistStored = await spotifyService.storeArtistInDatabase(artistData);
      
      if (artistStored) {
        // Store user-artist relationship
        const { error: relationError } = await supabase
          .from('user_artists')
          .upsert({
            user_id: userId,
            artist_id: artist.id,
            rank: i + 1
          }, {
            onConflict: 'user_id,artist_id'
          });
          
        if (!relationError) {
          storedCount++;
          
          // Import top tracks for the first 10 artists
          if (i < 10) {
            try {
              await spotifyService.importArtistCatalog(artist.id);
            } catch (trackError) {
              console.error(`Error importing tracks for ${artist.name}:`, trackError);
            }
          }
        } else {
          console.error(`Error storing user-artist relationship for ${artist.name}:`, relationError);
        }
      }
    }
    
    console.log(`Successfully imported ${storedCount} of ${artists.length} artists for user`);
    return storedCount > 0;
  } catch (error) {
    console.error("Error fetching user's top artists from Spotify:", error);
    return false;
  }
}

// Get user's top artists from database
export async function getUserTopArtists(userId?: string): Promise<Artist[]> {
  try {
    if (!userId) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.error("Error getting user data:", userError);
        return [];
      }
      
      userId = userData.user.id;
    }
    
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .order('rank', { ascending: true })
      .limit(20);
      
    if (error) {
      console.error("Error fetching user artists:", error);
      return [];
    }
    
    // Extract artists from joined query and ensure type safety
    return (data || [])
      .map(item => item.artists)
      .filter(artist => artist !== null)
      .map(artist => ({
        ...artist,
        last_synced_at: artist.last_synced_at || new Date().toISOString(),
        popularity: artist.popularity || 0,
        spotify_url: artist.spotify_url || null,
        ticketmaster_id: artist.ticketmaster_id || null
      }));
  } catch (error) {
    console.error("Error fetching user top artists:", error);
    return [];
  }
}
