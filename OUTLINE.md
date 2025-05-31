review the outline below and the codebase of my repo, then implement the fixes and improvements and features in the plan.

TheSet: Concert Setlist Voting Platform - Technical Implementation Guide
Technical Overview
TheSet is a React/TypeScript web application that enables real-time voting on concert setlists. The platform automatically imports artist data from Spotify, concert information from Ticketmaster, and actual performed setlists from setlist.fm for post-show comparisons. Built with Vite, Tailwind CSS, Supabase, and React Query.

Tech Stack & Credentials

Frontend
React 18.3.1 + TypeScript + Vite
Tailwind CSS + ShadCN UI
React Query + React Router DOM
Supabase Client with Realtime
Backend
Supabase PostgreSQL
Supabase Auth (Email + Spotify OAuth)
Supabase Realtime WebSockets
Vercel Edge Functions + Cron Jobs
API Credentials
VITE_SUPABASE_URL=https://ailrmwtahifvstpfhbgn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw
SUPABASE_PROJECT_ID=ailrmwtahifvstpfhbgn
SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL
Database Schema
-- Core Tables (Already Created)

users (id, email, spotify_id, display_name, avatar_url, created_at)
artists (id, name, image_url, popularity, genres[], spotify_url, last_synced_at)
venues (id, name, city, state, country, address, latitude, longitude)
shows (id, artist_id, venue_id, name, date, start_time, status, ticketmaster_url, view_count)
songs (id, artist_id, name, album, duration_ms, popularity, spotify_url)
setlists (id, show_id, created_at, updated_at)
setlist_songs (id, setlist_id, song_id, position, votes)
votes (id, user_id, setlist_song_id, created_at)
user_artists (id, user_id, artist_id, rank)
played_setlists (id, show_id, setlist_fm_id, played_date, imported_at)
played_setlist_songs (id, played_setlist_id, song_id, position)
-- Database Functions (Already Created)

vote_for_song
create_setlist_with_songs
increment_show_views
match_song_similarity
Current State Analysis
✅ Working Components
Basic authentication (email/password + Spotify OAuth)
Homepage with search functionality
Artist profile pages
Show voting pages (partial functionality)
Database schema and relationships
API service files for Spotify/Ticketmaster
🔴 Critical Issues
TypeScript Build Errors
Missing artist_id property in song objects
Type mismatches between service files and components
RPC function signature misalignments
Incomplete Data Flow

Spotify integration only fetches top tracks (not full catalog)
No artist ID mapping between Spotify and Ticketmaster
setlist.fm integration not implemented
Voting System Issues

No vote limit enforcement
Missing user vote tracking in UI
Realtime updates not broadcasting
No optimistic UI updates
Missing Background Services

No automated data sync
No trending calculation
No post-show setlist imports
Detailed Implementation Plan
Phase 1: Critical Bug Fixes (3-5 days)
Task 1.1: Fix TypeScript Build Errors
// Fix song type definition in types/index.ts
interface Song {
id: string;
artist_id: string; // Add missing property
name: string;
album: string;
duration_ms: number;
popularity: number;
spotify_url: string;
}

// Update ShowVoting.tsx component
// Ensure all song objects include artist_id when creating setlist songs
Task 1.2: Complete Voting System
// Add vote tracking and limits
interface VoteLimit {
user_id: string;
daily_votes: number;
last_reset: Date;
}

// Update vote_for_song RPC function
CREATE OR REPLACE FUNCTION vote_for_song(
p_user_id UUID,
p_setlist_song_id UUID
) RETURNS VOID AS $$
BEGIN
-- Check if user already voted
IF EXISTS (
SELECT 1 FROM votes
WHERE user_id = p_user_id
AND setlist_song_id = p_setlist_song_id
) THEN
RAISE EXCEPTION 'Already voted for this song';
END IF;

-- Check daily vote limit (50 votes)
IF (
SELECT COUNT(*) FROM votes
WHERE user_id = p_user_id
AND DATE(created_at) = CURRENT_DATE
) >= 50 THEN
RAISE EXCEPTION 'Daily vote limit reached';
END IF;

-- Insert vote and increment count
INSERT INTO votes (user_id, setlist_song_id)
VALUES (p_user_id, p_setlist_song_id);

UPDATE setlist_songs
SET votes = votes + 1
WHERE id = p_setlist_song_id;
END;
$$ LANGUAGE plpgsql;
Task 1.3: Implement Realtime Voting
// services/realtime.ts
export function subscribeToSetlistVotes(setlistId: string, onUpdate: (payload: any) => void) {
const channel = supabase
.channel(setlist:${setlistId})
.on(
'postgres_changes',
{
event: 'UPDATE',
schema: 'public',
table: 'setlist_songs',
filter: setlist_id=eq.${setlistId}
},
(payload) => onUpdate(payload)
)
.subscribe();

return () => channel.unsubscribe();
}

// Add optimistic updates in voting component
const handleVote = async (setlistSongId: string) => {
// Optimistically update UI
updateLocalVoteCount(setlistSongId, count => count + 1);

try {
await voteForSong(setlistSongId);
} catch (error) {
// Revert on failure
updateLocalVoteCount(setlistSongId, count => count - 1);
toast.error(error.message);
}
};
Phase 2: Core Feature Completion (5-7 days)
Task 2.1: Complete setlist.fm Integration
// services/setlistfm.ts
interface SetlistFmResponse {
artist: { name: string };
venue: { name: string; city: { name: string } };
eventDate: string;
sets: { set: Array<{ song: Array<{ name: string }> }> };
}

export async function importPlayedSetlist(showId: string) {
// Get show details
const { data: show } = await supabase
.from('shows')
.select(', artist:artists()')
.eq('id', showId)
.single();

// Format date for setlist.fm API
const eventDate = format(new Date(show.date), 'dd-MM-yyyy');

// Query setlist.fm
const response = await fetch(
https://api.setlist.fm/rest/1.0/search/setlists? +
artistName=${encodeURIComponent(show.artist.name)}& +
date=${eventDate},
{
headers: {
'Accept': 'application/json',
'x-api-key': process.env.SETLISTFM_API_KEY
}
}
);

const data: SetlistFmResponse = await response.json();

// Create played setlist record
const { data: playedSetlist } = await supabase
.from('played_setlists')
.insert({
show_id: showId,
setlist_fm_id: data.id,
played_date: new Date(show.date),
imported_at: new Date()
})
.select()
.single();

// Process and insert songs
const allSongs = data.sets.set.flatMap(set =>
set.song.map(song => song.name)
);

for (let i = 0; i < allSongs.length; i++) {
const songId = await matchOrCreateSong(show.artist_id, allSongs[i]);

}
}
Task 2.2: Full Song Catalog Import
// services/spotify.ts
export async function importFullArtistCatalog(artistId: string) {
const albums = await getAllArtistAlbums(artistId);
const songs = [];

for (const album of albums) {
const tracks = await getAlbumTracks(album.id);
songs.push(...tracks.map(track => ({
id: track.id,
artist_id: artistId,
name: track.name,
album: album.name,
duration_ms: track.duration_ms,
popularity: track.popularity,
spotify_url: track.external_urls.spotify
})));
}

// Batch insert songs
const { error } = await supabase
.from('songs')
.upsert(songs, { onConflict: 'id' });

// Update artist sync timestamp
await supabase
.from('artists')
.update({ last_synced_at: new Date() })
.eq('id', artistId);

return songs;
}
Task 2.3: Artist ID Mapping
// services/artist-mapping.ts
export async function mapTicketmasterToSpotify(tmArtistName: string) {
// Search Spotify for artist
const spotifyResults = await searchSpotifyArtists(tmArtistName);

if (spotifyResults.length === 0) return null;

// Use fuzzy matching to find best match
const bestMatch = spotifyResults.reduce((best, current) => {
const currentSimilarity = similarity(tmArtistName, current.name);
const bestSimilarity = similarity(tmArtistName, best.name);
return currentSimilarity > bestSimilarity ? current : best;
});

// Store mapping in artists table
await supabase
.from('artists')
.upsert({
id: bestMatch.id,
name: bestMatch.name,
image_url: bestMatch.images[0]?.url,
popularity: bestMatch.popularity,
genres: bestMatch.genres,
spotify_url: bestMatch.external_urls.spotify,
ticketmaster_name: tmArtistName // Add this column
});

return bestMatch.id;
}
Phase 3: Background Services (4-6 days)
Task 3.1: Implement Vercel Cron Jobs
// api/cron/sync-artists.ts
export default async function handler(req: Request) {
// Verify cron secret
if (req.headers.get('Authorization') !== Bearer ${process.env.CRON_SECRET}) {
return new Response('Unauthorized', { status: 401 });
}

// Get artists needing update (not synced in 7 days)
const { data: artists } = await supabase
.from('artists')
.select('id')
.or('last_synced_at.is.null,last_synced_at.lt.now() - interval '7 days'')
.limit(10);

for (const artist of artists) {
await importFullArtistCatalog(artist.id);
}

return new Response('OK');
}

// vercel.json
{
"crons": [
{
"path": "/api/cron/sync-artists",
"schedule": "0 3 * * *" // Daily at 3 AM
},
{
"path": "/api/cron/sync-shows",
"schedule": "0 */6 * * *" // Every 6 hours
},
{
"path": "/api/cron/import-setlists",
"schedule": "0 12 * * *" // Daily at noon
}
]
}
Task 3.2: Trending Calculation
// api/cron/calculate-trending.ts
export default async function handler(req: Request) {
// Calculate trending score based on views and votes in last 7 days
const { data: shows } = await supabase
.from('shows')
.select(      *,       setlist:setlists(         setlist_songs(votes)       )    )
.gte('date', new Date())
.order('date', { ascending: true })
.limit(100);

const trending = shows.map(show => {
const totalVotes = show.setlist?.setlist_songs?.reduce(
(sum, song) => sum + song.votes, 0
) || 0;

});

// Update trending scores in database
for (const show of trending) {
await supabase
.from('shows')
.update({ trending_score: show.trending_score })
.eq('id', show.id);
}

return new Response('OK');
}
Phase 4: User Experience Features (4-5 days)
Task 4.1: My Artists Dashboard
// pages/MyArtists.tsx
export function MyArtistsPage() {
const { data: userArtists } = useQuery({
queryKey: ['user-artists'],
queryFn: async () => {
const { data } = await supabase
.from('user_artists')
.select(          *,           artist:artists(             *,             shows(*)           )        )
.order('rank');
return data;
}
});

return (
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
{userArtists?.map(({ artist }) => (
<ArtistCard
key={artist.id}
artist={artist}
upcomingShows={artist.shows.filter(s => new Date(s.date) > new Date())}
/>
))}
</div>
);
}
Task 4.2: Enhanced Search
// components/Search.tsx
export function EnhancedSearch() {
const [filters, setFilters] = useState({
location: '',
dateRange: { start: null, end: null },
genre: ''
});

const searchShows = async (query: string) => {
let queryBuilder = supabase
.from('shows')
.select(        *,         artist:artists(*),         venue:venues(*)      )
.textSearch('artist.name', query);

};
}
Phase 5: Performance & Polish (3-4 days)
Task 5.1: Database Optimization
-- Add indexes for performance
CREATE INDEX idx_shows_date ON shows(date);
CREATE INDEX idx_shows_artist_date ON shows(artist_id, date);
CREATE INDEX idx_setlist_songs_votes ON setlist_songs(votes DESC);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at);
CREATE INDEX idx_songs_artist_popularity ON songs(artist_id, popularity DESC);

-- Add materialized view for trending
CREATE MATERIALIZED VIEW trending_shows AS
SELECT
s.*,
COUNT(DISTINCT v.user_id) as unique_voters,
SUM(ss.votes) as total_votes,
(s.view_count * 0.3 + COALESCE(SUM(ss.votes), 0) * 0.7) as trending_score
FROM shows s
LEFT JOIN setlists sl ON sl.show_id = s.id
LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
LEFT JOIN votes v ON v.setlist_song_id = ss.id
WHERE s.date >= CURRENT_DATE
GROUP BY s.id;

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_trending()
RETURNS void AS $$
BEGIN
REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;
Task 5.2: React Query Optimization
// utils/queryClient.ts
export const queryClient = new QueryClient({
defaultOptions: {
queries: {
staleTime: 5 * 60 * 1000, // 5 minutes
cacheTime: 10 * 60 * 1000, // 10 minutes
refetchOnWindowFocus: false,
retry: 2
}
}
});

// Prefetch upcoming shows
export async function prefetchUpcomingShows() {
await queryClient.prefetchQuery({
queryKey: ['shows', 'upcoming'],
queryFn: getUpcomingShows,
staleTime: 30 * 60 * 1000 // 30 minutes
});
}
Testing Requirements
// Required test coverage

Unit tests for all service functions
Integration tests for API endpoints
E2E tests for critical flows:
User signup/login with Spotify
Searching and voting on shows
Real-time vote updates
Post-show setlist comparison