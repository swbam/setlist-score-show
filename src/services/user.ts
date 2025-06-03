
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
    const { data: authUser, error } = await supabase.auth.getUser();
    
    if (error || !authUser?.user) {
      return null;
    }

    // Map Supabase auth user to our User interface
    return {
      id: authUser.user.id,
      email: authUser.user.email || null,
      spotify_id: authUser.user.user_metadata?.provider_id || null,
      display_name: authUser.user.user_metadata?.display_name || 
                   authUser.user.user_metadata?.full_name || 
                   authUser.user.user_metadata?.name || 
                   authUser.user.email?.split('@')[0] || 'User',
      avatar_url: authUser.user.user_metadata?.avatar_url || null,
      created_at: authUser.user.created_at
    };
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
    // Update user metadata in Supabase auth instead of custom table
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name,
        avatar_url,
        spotify_id
      }
    });
    
    if (error) {
      console.error("Error updating user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error upserting user:", error);
    return false;
  }
}
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
