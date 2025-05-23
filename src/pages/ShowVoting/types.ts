
import { Artist, Song, Venue } from "@/types";

export interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  artist: {
    id: string;
    name: string;
    image_url: string;
  };
  venue: {
    name: string;
    city: string;
    state: string | null;
    country: string;
    address: string;
  };
  name: string | null;
  date: string;
  start_time: string | null;
  status: 'scheduled' | 'postponed' | 'canceled';
  ticketmaster_url: string | null;
  view_count: number;
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
