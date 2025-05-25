
export interface ShowData {
  id: string;
  name?: string;
  date: string;
  start_time?: string;
  status: string;
  ticketmaster_url?: string;
  view_count: number;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
  };
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  votes: number;
  song: {
    id: string;
    name: string;
    artist_id: string;
    album: string;
    spotify_url: string;
  };
}
