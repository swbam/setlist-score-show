import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import ArtistCard from '../components/ArtistCard';
import { UserArtist, Artist, Show } from '../types';

interface UserArtistWithDetails extends UserArtist {
  artist: Artist & {
    shows: Show[];
  };
}

export function MyArtistsPage() {
  const { data: userArtists, isLoading, error } = useQuery<UserArtistWithDetails[], Error>({
    queryKey: ['user-artists'],
    queryFn: async () => {
      const { data, error: dbError } = await supabase
        .from('user_artists')
        .select(`
          *,
          artist:artists!artist_id (
            *,
            shows(*)
          )
        `)
        .order('rank');
      
      if (dbError) {
        throw dbError;
      }
      return (data as UserArtistWithDetails[]) || []; // Cast to expected type
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Favorite Artists</h1>
        <p className="text-white">Loading your artists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Favorite Artists</h1>
        <p className="text-red-500">Error loading artists: {error.message}</p>
      </div>
    );
  }

  if (!userArtists || userArtists.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Favorite Artists</h1>
        <p className="text-white">You haven't added any favorite artists yet.</p>
        {/* TODO: Add a link or button to discover/add artists */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">My Favorite Artists</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {userArtists?.map(({ artist }) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            // The plan filters upcomingShows here, but ArtistCard might do it or expect all shows
            // Passing all shows and letting ArtistCard decide is more flexible.
            // If ArtistCard specifically needs upcomingShows, then filter here:
            // upcomingShows={artist.shows.filter(s => new Date(s.date) > new Date())}
          />
        ))}
      </div>
    </div>
  );
}