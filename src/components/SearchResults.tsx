import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2, Music, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ticketmasterService } from '@/services/ticketmaster';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return { artists: [], shows: [] };

      try {
        // First, search Ticketmaster for events
        const ticketmasterEvents = await ticketmasterService.searchEvents(query);
        
        // Import found artists and shows into database
        const importedData = await importTicketmasterData(ticketmasterEvents);
        
        // Then search our database for comprehensive results
        const [artistsResult, showsResult] = await Promise.all([
          supabase
            .from('artists')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10),
          supabase
            .from('shows')
            .select(`
              *,
              artist:artists(name, image_url),
              venue:venues(name, city, state)
            `)
            .or(`name.ilike.%${query}%,artist.name.ilike.%${query}%`)
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(20)
        ]);

        if (artistsResult.error) throw artistsResult.error;
        if (showsResult.error) throw showsResult.error;

        return {
          artists: artistsResult.data || [],
          shows: showsResult.data || [],
          imported: importedData
        };
      } catch (err) {
        console.error('Search error:', err);
        throw err;
      }
    },
    enabled: query.length >= 2,
    staleTime: 60000, // Cache for 1 minute
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading search results. Please try again.
      </div>
    );
  }

  if (!data || (data.artists.length === 0 && data.shows.length === 0)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No results found for "{query}"
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {data.artists.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Music className="h-5 w-5" />
            Artists
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.artists.map((artist) => (
              <Card
                key={artist.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/artist/${artist.id}`)}
              >
                <div className="flex items-center gap-4">
                  {artist.image_url && (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold">{artist.name}</h4>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {artist.genres.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.shows.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Shows
          </h3>
          <div className="grid gap-4">
            {data.shows.map((show) => (
              <Card
                key={show.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/show/${show.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {show.artist?.image_url && (
                      <img
                        src={show.artist.image_url}
                        alt={show.artist.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">{show.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {show.artist?.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(show.date), 'MMM d, yyyy')}
                        </span>
                        {show.venue && (
                          <span className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {show.venue.name}, {show.venue.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {show.status || 'On Sale'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function importTicketmasterData(events: any[]) {
  const importedArtists = new Set<string>();
  const importedVenues = new Set<string>();
  const importedShows = new Set<string>();

  for (const event of events) {
    try {
      // Import venues
      if (event._embedded?.venues) {
        for (const venue of event._embedded.venues) {
          const { error: venueError } = await supabase
            .from('venues')
            .upsert({
              id: venue.id,
              name: venue.name,
              city: venue.city?.name,
              state: venue.state?.stateCode,
              country: venue.country?.countryCode,
              address: venue.address?.line1,
              latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
              longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
            }, { onConflict: 'id' });
          
          if (!venueError) importedVenues.add(venue.id);
        }
      }

      // Import artists
      if (event._embedded?.attractions) {
        for (const attraction of event._embedded.attractions) {
          if (attraction.classifications?.[0]?.segment?.name === 'Music') {
            const { error: artistError } = await supabase
              .from('artists')
              .upsert({
                id: attraction.id,
                name: attraction.name,
                image_url: attraction.images?.[0]?.url,
                genres: attraction.classifications?.[0]?.genre ? [attraction.classifications[0].genre.name] : [],
                popularity: 50, // Default popularity
              }, { onConflict: 'id' });
            
            if (!artistError) importedArtists.add(attraction.id);

            // Also track unmapped artists for later Spotify mapping
            await supabase
              .from('unmapped_artists')
              .upsert({
                ticketmaster_name: attraction.name,
                event_count: 1,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
              }, { 
                onConflict: 'ticketmaster_name',
                ignoreDuplicates: false 
              });
          }
        }
      }

      // Import shows
      const artistId = event._embedded?.attractions?.[0]?.id;
      const venueId = event._embedded?.venues?.[0]?.id;
      
      if (artistId && venueId) {
        const { error: showError } = await supabase
          .from('shows')
          .upsert({
            id: event.id,
            artist_id: artistId,
            venue_id: venueId,
            name: event.name,
            date: event.dates?.start?.localDate || event.dates?.start?.dateTime,
            start_time: event.dates?.start?.localTime,
            status: event.dates?.status?.code,
            ticketmaster_url: event.url,
            image_url: event.images?.[0]?.url,
            min_price: event.priceRanges?.[0]?.min,
            max_price: event.priceRanges?.[0]?.max,
            view_count: 0,
            trending_score: 0,
          }, { onConflict: 'id' });
        
        if (!showError) importedShows.add(event.id);
      }
    } catch (err) {
      console.error('Error importing event:', event.id, err);
    }
  }

  return {
    artists: importedArtists.size,
    venues: importedVenues.size,
    shows: importedShows.size,
  };
}
