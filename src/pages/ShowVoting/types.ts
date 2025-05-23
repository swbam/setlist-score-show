
// Fix the recursive type issue by separating song from SetlistSong
export interface Song {
  id: string;
  name: string;
  album?: string;
  duration_ms?: number;
  popularity?: number;
  spotify_url?: string;
}

export interface SetlistSong {
  id: string;
  song_id: string;
  votes: number;
  position: number;
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

export interface Show {
  id: string;
  name?: string | null;
  date: string;
  status: 'scheduled' | 'postponed' | 'canceled';
  artist: {
    id: string;
    name: string;
    image_url?: string;
    popularity?: number;
    genres?: string[];
    spotify_url?: string;
  };
  venue?: {
    id?: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    address?: string;
  };
  ticketmaster_url?: string | null;
  start_time?: string | null;
  view_count: number;
}
