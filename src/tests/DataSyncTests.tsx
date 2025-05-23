
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import * as spotifyService from '@/services/spotify';
import * as ticketmasterService from '@/services/ticketmaster';
import * as setlistService from '@/services/setlist';
import * as trendingService from '@/services/trending';
import { supabase } from '@/integrations/supabase/client';

const DataSyncTests: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  
  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
    console.log(message);
  };
  
  const handleSearchArtist = async () => {
    try {
      setLoading(true);
      addResult("Searching for Taylor Swift on Spotify...");
      
      const artists = await spotifyService.searchArtists("Taylor Swift");
      
      if (artists.length === 0) {
        addResult("❌ No artists found");
        return;
      }
      
      const artist = artists[0];
      addResult(`✅ Found artist: ${artist.name} (ID: ${artist.id})`);
      
      // Store artist in database
      const stored = await spotifyService.storeArtistInDatabase(artist);
      addResult(stored 
        ? `✅ Stored artist in database` 
        : `❌ Failed to store artist in database`);
      
      // Get and store top tracks
      addResult(`Importing top tracks for ${artist.name}...`);
      const tracks = await spotifyService.getArtistTopTracks(artist.id);
      
      if (tracks.length === 0) {
        addResult(`❌ No tracks found for ${artist.name}`);
        return;
      }
      
      addResult(`✅ Found ${tracks.length} tracks for ${artist.name}`);
      
      // Store tracks
      const tracksStored = await spotifyService.storeTracksInDatabase(artist.id, tracks);
      addResult(tracksStored 
        ? `✅ Stored ${tracks.length} tracks in database` 
        : `❌ Failed to store tracks in database`);
      
      // Get shows
      addResult(`Searching for ${artist.name} shows on Ticketmaster...`);
      const events = await ticketmasterService.getArtistEvents(artist.name);
      
      if (events.length === 0) {
        addResult(`❌ No events found for ${artist.name}`);
        return;
      }
      
      addResult(`✅ Found ${events.length} events for ${artist.name}`);
      
      // Store first event
      if (events.length > 0 && events[0]._embedded?.venues?.[0]) {
        const event = events[0];
        const venue = event._embedded.venues[0];
        
        addResult(`Storing venue: ${venue.name}...`);
        const venueStored = await ticketmasterService.storeVenueInDatabase(venue);
        
        if (venueStored) {
          addResult(`✅ Stored venue: ${venue.name}`);
          
          addResult(`Storing show: ${event.name}...`);
          const showStored = await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
          
          if (showStored) {
            addResult(`✅ Stored show: ${event.name}`);
            
            // Create setlist
            addResult(`Creating setlist for show: ${event.name}...`);
            const setlistId = await setlistService.getOrCreateSetlist(event.id);
            
            if (setlistId) {
              addResult(`✅ Created setlist with ID: ${setlistId}`);
              
              // Test fetching setlist
              const setlist = await setlistService.getSetlistWithSongs(setlistId);
              
              if (setlist) {
                addResult(`✅ Fetched setlist with ${setlist.songs?.length || 0} songs`);
              } else {
                addResult(`❌ Failed to fetch setlist`);
              }
            } else {
              addResult(`❌ Failed to create setlist`);
            }
          } else {
            addResult(`❌ Failed to store show`);
          }
        } else {
          addResult(`❌ Failed to store venue`);
        }
      }

      // Test trending shows
      addResult("Testing trending shows...");
      const trendingShows = await trendingService.getTrendingShows(10);
      
      if (trendingShows.length > 0) {
        addResult(`✅ Found ${trendingShows.length} trending shows`);
        trendingShows.forEach((show, i) => {
          addResult(`   ${i+1}. ${show.artist_name} - ${show.name} (${show.votes} votes)`);
        });
      } else {
        addResult(`❌ No trending shows found`);
        
        // Check if there are any shows in the database
        const { data: showsCount, error: showsError } = await supabase
          .from('shows')
          .select('id', { count: 'exact' });
        
        if (showsError) {
          addResult(`❌ Error checking shows: ${showsError.message}`);
        } else {
          addResult(`Database has ${showsCount?.length || 0} shows`);
        }
        
        // Check if there are any setlists in the database
        const { data: setlistsCount, error: setlistsError } = await supabase
          .from('setlists')
          .select('id', { count: 'exact' });
        
        if (setlistsError) {
          addResult(`❌ Error checking setlists: ${setlistsError.message}`);
        } else {
          addResult(`Database has ${setlistsCount?.length || 0} setlists`);
          
          if (setlistsCount && setlistsCount.length > 0) {
            // Check if setlists have songs
            const { data: setlistSongsCount, error: setlistSongsError } = await supabase
              .from('setlist_songs')
              .select('id', { count: 'exact' });
            
            if (setlistSongsError) {
              addResult(`❌ Error checking setlist songs: ${setlistSongsError.message}`);
            } else {
              addResult(`Database has ${setlistSongsCount?.length || 0} setlist songs`);
            }
          }
        }
      }
      
      toast.success("Test completed");
    } catch (error) {
      console.error('Error running test:', error);
      addResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Sync Tests</h1>
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-800 rounded-lg bg-gray-900">
          <h2 className="text-xl font-semibold mb-2">Artist Sync Test</h2>
          <p className="text-gray-400 mb-4">
            This will search for an artist on Spotify, store them in the database,
            get their top tracks, find shows on Ticketmaster, and create a setlist.
          </p>
          <Button 
            onClick={handleSearchArtist}
            disabled={loading}
          >
            {loading ? 'Running Test...' : 'Run Test'}
          </Button>
        </div>
        
        <Separator />
        
        <div className="p-4 border border-gray-800 rounded-lg bg-gray-900 max-h-96 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-400">No results yet</p>
          ) : (
            <div className="space-y-2 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index} className="border-l-2 border-gray-700 pl-2">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSyncTests;
