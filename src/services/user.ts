
import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  email: string | null;
  spotify_id: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserArtist {
  id: string;
  user_id: string;
  artist_id: string;
  rank: number;
  artist?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

// Get the current logged-in user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Create or update user in database after authentication
export async function upsertUser(
  id: string,
  email: string | null,
  spotify_id: string | null,
  display_name: string,
  avatar_url: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        spotify_id,
        display_name,
        avatar_url
      });
    
    if (error) {
      console.error("Error upserting user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error upserting user:", error);
    return false;
  }
}

// Get user's followed artists
export async function getUserArtists(): Promise<UserArtist[]> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.user) {
      return [];
    }
    
    // Fix the relationship hint to specify which foreign key to use
    const { data, error } = await supabase
      .from('user_artists')
      .select(`
        *,
        artists!user_artists_artist_id_fkey(id, name, image_url)
      `)
      .eq('user_id', authUser.user.id)
      .order('rank');
    
    if (error) {
      console.error("Error fetching user artists:", error);
      return [];
    }
    
    // Transform the data to ensure type safety
    const transformedData: UserArtist[] = (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      artist_id: item.artist_id,
      rank: item.rank,
      artist: item.artists ? {
        id: item.artists.id,
        name: item.artists.name,
        image_url: item.artists.image_url
      } : undefined
    }));
    
    return transformedData;
  } catch (error) {
    console.error("Error getting user artists:", error);
    return [];
  }
}

// Follow an artist
export async function followArtist(artistId: string, rank: number = 1): Promise<boolean> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.user) {
      return false;
    }
    
    const { error } = await supabase
      .from('user_artists')
      .upsert({
        user_id: authUser.user.id,
        artist_id: artistId,
        rank
      });
    
    if (error) {
      console.error("Error following artist:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error following artist:", error);
    return false;
  }
}

// Unfollow an artist
export async function unfollowArtist(artistId: string): Promise<boolean> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.user) {
      return false;
    }
    
    const { error } = await supabase
      .from('user_artists')
      .delete()
      .eq('user_id', authUser.user.id)
      .eq('artist_id', artistId);
    
    if (error) {
      console.error("Error unfollowing artist:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error unfollowing artist:", error);
    return false;
  }
}

// Check if user is following an artist
export async function isFollowingArtist(artistId: string): Promise<boolean> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('user_artists')
      .select('id')
      .eq('user_id', authUser.user.id)
      .eq('artist_id', artistId)
      .single();
    
    if (error) {
      // Error code for not found
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error("Error checking if following artist:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error checking if following artist:", error);
    return false;
  }
}
