
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";
import * as spotifyService from "./spotify";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

// Sign up with email/password
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

// Sign in with Spotify OAuth
export async function signInWithSpotify() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user-read-email user-top-read',
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing in with Spotify:", error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

// Store user profile in database
export async function storeUserProfile(user: User) {
  try {
    if (!user) return false;
    
    const userData = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      spotify_id: user.app_metadata?.provider === 'spotify' ? user.user_metadata?.sub : null,
    };
    
    const { error } = await supabase
      .from('users')
      .upsert(userData);
      
    if (error) {
      console.error("Error storing user profile:", error);
      return false;
    }
    
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

// Fetch user's top artists from Spotify
export async function fetchUserTopArtistsFromSpotify(timeRange: string = 'medium_term'): Promise<boolean> {
  try {
    const accessToken = await getSpotifyUserToken();
    
    if (!accessToken) {
      console.log("No Spotify access token available");
      return false;
    }
    
    // Get user's top artists from Spotify
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=30`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error("Error fetching top artists from Spotify:", response.status);
      return false;
    }
    
    const data = await response.json();
    const artists = data.items || [];
    
    if (artists.length === 0) {
      console.log("No top artists found");
      return false;
    }
    
    console.log(`Found ${artists.length} top artists`);
    
    // Get user ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("Error getting user data:", userError);
      return false;
    }
    
    const userId = userData.user.id;
    
    // Store artists in database
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
      
      // Store artist
      const artistStored = await spotifyService.storeArtistInDatabase(artistData);
      
      if (artistStored) {
        // Store relationship to user with rank
        const { error: relationError } = await supabase
          .from('user_artists')
          .upsert({
            user_id: userId,
            artist_id: artist.id,
            rank: i + 1
          });
          
        if (!relationError) {
          storedCount++;
          
          // Import artist's top tracks (for the first 10 artists only to avoid rate limits)
          if (i < 10) {
            try {
              const tracks = await spotifyService.getArtistTopTracks(artist.id);
              if (tracks.length > 0) {
                await spotifyService.storeTracksInDatabase(artist.id, tracks);
              }
            } catch (trackError) {
              console.error(`Error importing tracks for ${artist.name}:`, trackError);
            }
          }
        }
      }
    }
    
    console.log(`Successfully imported ${storedCount} of ${artists.length} artists`);
    return storedCount > 0;
  } catch (error) {
    console.error("Error fetching user's top artists:", error);
    return false;
  }
}

// Get user's top artists from database
export async function getUserTopArtists(userId?: string): Promise<any[]> {
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
        artists (
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
    
    // Extract artists from joined query
    return data.map(item => item.artists);
  } catch (error) {
    console.error("Error fetching user top artists:", error);
    return [];
  }
}
