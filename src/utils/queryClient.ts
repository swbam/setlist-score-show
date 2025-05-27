import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client'; // Assuming this is the correct path
import { Show } from '../types'; // Assuming Show type is defined here

const getUpcomingShows = async (): Promise<Show[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('shows')
    .select(`
      *,
      artist:artists!artist_id(id, name, image_url),
      venue:venues!venue_id(id, name, city, state, country)
    `) // Fetch related artist and venue using FK hints, added country for Venue type
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(50); // Limit the number of upcoming shows fetched

  if (error) {
    console.error('Error fetching upcoming shows:', error);
    throw error; // React Query will handle this error
  }
  return (data as Show[]) || []; // Cast to Show[] to align with expected type
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime was renamed to gcTime in v5)
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

// Prefetch upcoming shows
export async function prefetchUpcomingShows() {
  await queryClient.prefetchQuery({
    queryKey: ['shows', 'upcoming'],
    queryFn: getUpcomingShows, // This function needs to be implemented
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
}