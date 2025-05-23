
// User profile from database
export interface UserProfile {
  id: string;
  email?: string;
  spotify_id?: string;
  display_name: string;
  avatar_url?: string;
  created_at?: Date;
}

// Song types
export interface Song {
  id: string;
  artist_id: string;
  name: string;
  album: string;
  duration_ms: number;
  popularity: number;
  spotify_url: string;
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  votes: number;
  song: Song;
  userVoted?: boolean;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs: SetlistSong[];
}

// Show types
export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  artist?: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue?: Venue;
  name: string | null;
  date: string;
  start_time: string | null;
  status: 'scheduled' | 'postponed' | 'canceled';
  ticketmaster_url: string | null;
  view_count: number;
}

// Artist types
export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  popularity?: number;
  genres?: string[];
  spotify_url?: string;
  last_synced_at?: string;
}

// User Artists
export interface UserArtist {
  id: string;
  user_id: string;
  artist_id: string;
  rank: number;
  artist?: Artist;
}
