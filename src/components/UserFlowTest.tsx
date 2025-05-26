
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import * as searchService from '@/services/search';
import * as spotifyService from '@/services/spotify';
import * as ticketmasterService from '@/services/ticketmaster';
import * as catalogService from '@/services/catalog';
import { getOrCreateSetlistWithSongs } from '@/services/setlistCreation';
import { supabase } from '@/integrations/supabase/client';

interface TestResults {
  step: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
}

const UserFlowTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedShow, setSelectedShow] = useState<any>(null);

  const updateResult = (step: string, status: 'success' | 'error', message?: string, data?: any) => {
    setResults(prev => prev.map(r => 
      r.step === step ? { ...r, status, message, data } : r
    ));
  };

  const addStep = (step: string) => {
    setResults(prev => [...prev, { step, status: 'pending' }]);
  };

  const runEndToEndTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Step 1: Search for artists
      addStep('Search for artists');
      console.log('🔍 Testing artist search...');
      
      const searchResults = await searchService.searchArtists('Rebelution', 5);
      
      if (searchResults.length === 0) {
        updateResult('Search for artists', 'error', 'No artists found in search');
        return;
      }
      
      updateResult('Search for artists', 'success', `Found ${searchResults.length} artists`, searchResults);
      const testArtist = searchResults[0];
      setSelectedArtist(testArtist);

      // Step 2: Get/Import artist details and catalog
      addStep('Import artist data and catalog');
      console.log('📥 Testing artist data import...');
      
      // Ensure artist exists in database
      let artistData = await spotifyService.getArtist(testArtist.id);
      if (!artistData) {
        updateResult('Import artist data and catalog', 'error', 'Failed to get artist from Spotify');
        return;
      }
      
      // Store artist in database
      await spotifyService.storeArtistInDatabase(artistData);
      
      // Import artist catalog
      const catalogImported = await catalogService.syncArtistCatalog(testArtist.id);
      if (!catalogImported) {
        updateResult('Import artist data and catalog', 'error', 'Failed to import artist catalog');
        return;
      }
      
      updateResult('Import artist data and catalog', 'success', 'Artist data and catalog imported successfully');

      // Step 3: Create/Get shows for artist
      addStep('Get/Create shows for artist');
      console.log('🎪 Testing show creation...');
      
      // First check if we have shows in database
      const { data: existingShows } = await supabase
        .from('shows')
        .select('*')
        .eq('artist_id', testArtist.id)
        .limit(1);
      
      let testShow;
      if (existingShows && existingShows.length > 0) {
        testShow = existingShows[0];
        updateResult('Get/Create shows for artist', 'success', 'Found existing show', testShow);
      } else {
        // Try to get shows from Ticketmaster and store them
        const events = await ticketmasterService.getArtistEvents(artistData.name);
        
        if (events.length === 0) {
          // Create a test show if no events found
          const testVenue = {
            id: 'test-venue-001',
            name: 'Test Venue',
            city: 'Test City',
            state: 'Test State',
            country: 'US',
            type: 'venue' as const
          };
          
          await ticketmasterService.storeVenueInDatabase(testVenue);
          
          const testShowData = {
            id: 'test-show-001',
            name: `${artistData.name} Concert`,
            type: 'event' as const,
            dates: {
              start: {
                localDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                localTime: '20:00:00'
              }
            },
            url: 'https://test.com',
            _embedded: {
              venues: [testVenue]
            }
          };
          
          await ticketmasterService.storeShowInDatabase(testShowData, testArtist.id, testVenue.id);
          testShow = { id: testShowData.id, artist_id: testArtist.id, venue_id: testVenue.id };
          updateResult('Get/Create shows for artist', 'success', 'Created test show', testShow);
        } else {
          // Store first event as show
          const event = events[0];
          const venue = event._embedded?.venues?.[0];
          
          if (venue) {
            await ticketmasterService.storeVenueInDatabase(venue);
            await ticketmasterService.storeShowInDatabase(event, testArtist.id, venue.id);
            testShow = { id: event.id, artist_id: testArtist.id, venue_id: venue.id };
            updateResult('Get/Create shows for artist', 'success', 'Imported show from Ticketmaster', testShow);
          }
        }
      }
      
      if (!testShow) {
        updateResult('Get/Create shows for artist', 'error', 'Failed to create or find show');
        return;
      }
      
      setSelectedShow(testShow);

      // Step 4: Create setlist with 5 random songs
      addStep('Create setlist with 5 random songs');
      console.log('🎵 Testing setlist creation...');
      
      const setlistResult = await getOrCreateSetlistWithSongs(testShow.id);
      
      if (!setlistResult.success || !setlistResult.setlist_id) {
        updateResult('Create setlist with 5 random songs', 'error', setlistResult.message || 'Failed to create setlist');
        return;
      }
      
      updateResult('Create setlist with 5 random songs', 'success', 
        `Created setlist with ${setlistResult.songs_added} songs`, 
        { setlist_id: setlistResult.setlist_id, songs_added: setlistResult.songs_added }
      );

      // Step 5: Verify songs were loaded from database
      addStep('Verify songs loaded from database');
      console.log('✅ Testing song loading...');
      
      const { data: setlistSongs } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          songs!fk_setlist_songs_song_id (*)
        `)
        .eq('setlist_id', setlistResult.setlist_id);
      
      if (!setlistSongs || setlistSongs.length === 0) {
        updateResult('Verify songs loaded from database', 'error', 'No songs found in setlist');
        return;
      }
      
      updateResult('Verify songs loaded from database', 'success', 
        `Found ${setlistSongs.length} songs in setlist`, 
        setlistSongs
      );

      // Step 6: Test voting functionality
      addStep('Test voting functionality');
      console.log('🗳️ Testing voting...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateResult('Test voting functionality', 'error', 'User not logged in');
        return;
      }
      
      // Test vote for first song
      const firstSong = setlistSongs[0];
      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_song', {
        setlist_song_id: firstSong.id
      });
      
      if (voteError) {
        updateResult('Test voting functionality', 'error', `Vote failed: ${voteError.message}`);
        return;
      }
      
      updateResult('Test voting functionality', 'success', 
        'Vote successfully recorded', 
        voteResult
      );

      // Step 7: Test song search and adding
      addStep('Test song search and adding');
      console.log('🔍 Testing song search...');
      
      const { data: artistSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', testArtist.id)
        .limit(10);
      
      if (!artistSongs || artistSongs.length === 0) {
        updateResult('Test song search and adding', 'error', 'No songs found for artist');
        return;
      }
      
      // Find a song not already in the setlist
      const songsInSetlist = setlistSongs.map(s => s.song_id);
      const songToAdd = artistSongs.find(song => !songsInSetlist.includes(song.id));
      
      if (!songToAdd) {
        updateResult('Test song search and adding', 'success', 'All songs already in setlist (expected behavior)');
      } else {
        // Add the song to setlist
        const { error: addError } = await supabase
          .from('setlist_songs')
          .insert({
            setlist_id: setlistResult.setlist_id,
            song_id: songToAdd.id,
            position: setlistSongs.length + 1,
            votes: 0
          });
        
        if (addError) {
          updateResult('Test song search and adding', 'error', `Failed to add song: ${addError.message}`);
          return;
        }
        
        updateResult('Test song search and adding', 'success', 'Song successfully added to setlist', songToAdd);
      }

      toast.success('🎉 End-to-end test completed successfully!');

    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">End-to-End User Flow Test</h2>
      <p className="text-gray-300 mb-6">
        This test simulates the complete user journey: search artist (Rebelution) → view artist page → 
        click show → create setlist with 5 random songs → vote → add song
      </p>
      
      <Button 
        onClick={runEndToEndTest} 
        disabled={isRunning}
        className="mb-6 bg-blue-600 hover:bg-blue-700"
      >
        {isRunning ? 'Running Test...' : 'Run End-to-End Test'}
      </Button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getStatusIcon(result.status)}</span>
              <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                {result.step}
              </h3>
            </div>
            
            {result.message && (
              <p className="text-gray-300 mb-2">{result.message}</p>
            )}
            
            {result.data && (
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                  View Data
                </summary>
                <pre className="mt-2 p-2 bg-gray-800 rounded overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {selectedArtist && (
        <div className="mt-6 p-4 border border-green-700 rounded-lg">
          <h3 className="font-semibold text-green-400 mb-2">Selected Test Artist:</h3>
          <p>{selectedArtist.name} (ID: {selectedArtist.id})</p>
        </div>
      )}

      {selectedShow && (
        <div className="mt-4 p-4 border border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-400 mb-2">Selected Test Show:</h3>
          <p>Show ID: {selectedShow.id}</p>
        </div>
      )}
    </div>
  );
};

export default UserFlowTest;
