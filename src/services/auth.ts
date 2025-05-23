
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { User } from "@supabase/supabase-js";

// Sign in with Spotify OAuth
export async function signInWithSpotify() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: 'user-read-email user-top-read',
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error signing in with Spotify:', error);
    toast.error('Failed to sign in with Spotify');
    return null;
  }
}

// Sign in with email/password
export async function signInWithEmail(email: string, password: string) {
  try {
    // Clean up existing auth state to prevent conflicts
    cleanupAuthState();
    
    // Attempt to sign out any existing session
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      // Continue even if this fails
      console.log('Error signing out existing session:', error);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    toast.error('Failed to sign in. Please check your credentials.');
    return null;
  }
}

// Sign up with email/password
export async function signUp(email: string, password: string, displayName: string) {
  try {
    // Clean up existing auth state
    cleanupAuthState();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    toast.error('Failed to create account. Please try again.');
    return null;
  }
}

// Sign out
export async function signOut() {
  try {
    // Clean up auth state
    cleanupAuthState();
    
    // Attempt global sign out
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      throw error;
    }
    
    // Force page reload for a clean state
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error('Failed to sign out. Please try again.');
  }
}

// Helper function to clean up auth state
export function cleanupAuthState() {
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
}

// Get user's top artists from Spotify
export async function getUserTopArtists() {
  try {
    const user = supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    // Check if this is a Spotify-authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const isSpotifyUser = userData?.user?.app_metadata?.provider === 'spotify';
    
    if (!isSpotifyUser) {
      return [];
    }
    
    // Fetch user's top artists from the database
    const { data: userArtists, error } = await supabase
      .from('user_artists')
      .select(`
        artist_id,
        rank,
        artists(*)
      `)
      .order('rank');
      
    if (error) {
      console.error('Error fetching user artists:', error);
      return [];
    }
    
    return userArtists?.map(item => item.artists) || [];
  } catch (error) {
    console.error('Error getting user top artists:', error);
    return [];
  }
}

// Store user in database after authentication
export async function storeUserProfile(user: User) {
  try {
    const isSpotifyUser = user.app_metadata?.provider === 'spotify';
    const displayName = 
      user.user_metadata?.display_name || 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      'User';
    const spotifyId = isSpotifyUser ? user.user_metadata?.provider_id : null;
    const avatarUrl = user.user_metadata?.avatar_url || null;
    
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      spotify_id: spotifyId,
      display_name: displayName,
      avatar_url: avatarUrl
    });
    
    if (error) {
      console.error('Error storing user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error storing user profile:', error);
    return false;
  }
}
