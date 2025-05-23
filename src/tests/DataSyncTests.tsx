
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Import services
import * as spotifyService from '@/services/spotify';
import * as ticketmasterService from '@/services/ticketmaster';
import * as setlistService from '@/services/setlist';
import { supabase } from '@/integrations/supabase/client';

// Types
interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'failed';
  message?: string;
  data?: any;
}

// Test artist ID for Spotify
const TEST_ARTIST_ID = '4Z8W4fKeB5YxbusRsdQVPb'; // Radiohead
const TEST_ARTIST_NAME = 'Radiohead';

const DataSyncTests = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    spotifyArtist: { name: 'Spotify: Fetch Artist', status: 'pending' },
    spotifyTracks: { name: 'Spotify: Fetch Track Catalog', status: 'pending' },
    spotifyImport: { name: 'Spotify: Import Artist Catalog', status: 'pending' },
    ticketmasterEvents: { name: 'Ticketmaster: Fetch Events', status: 'pending' },
    ticketmasterStore: { name: 'Ticketmaster: Store Shows & Venues', status: 'pending' },
    setlistCreate: { name: 'Setlist: Create Setlist', status: 'pending' },
    setlistFetch: { name: 'Setlist: Fetch Setlist', status: 'pending' },
    songAdd: { name: 'Setlist: Add Song', status: 'pending' },
    songVote: { name: 'Setlist: Vote for Song', status: 'pending' },
  });
  
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  const updateTestResult = (key: string, status: 'success' | 'failed', message?: string, data?: any) => {
    setTestResults(prev => ({
      ...prev,
      [key]: { ...prev[key], status, message, data }
    }));
  };
  
  // Test Spotify Artist Fetch
  const testSpotifyArtist = async () => {
    setRunningTest('spotifyArtist');
    try {
      const artist = await spotifyService.getArtist(TEST_ARTIST_ID);
      if (artist && artist.id === TEST_ARTIST_ID) {
        updateTestResult(
          'spotifyArtist', 
          'success', 
          `Successfully fetched artist: ${artist.name}`,
          artist
        );
      } else {
        updateTestResult(
          'spotifyArtist', 
          'failed', 
          'Failed to fetch artist or invalid response'
        );
      }
    } catch (error) {
      updateTestResult(
        'spotifyArtist', 
        'failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Spotify Tracks Fetch
  const testSpotifyTracks = async () => {
    setRunningTest('spotifyTracks');
    try {
      const tracks = await spotifyService.getArtistAllTracks(TEST_ARTIST_ID);
      if (tracks && tracks.length > 0) {
        updateTestResult(
          'spotifyTracks', 
          'success', 
          `Successfully fetched ${tracks.length} tracks`,
          { trackCount: tracks.length, sampleTracks: tracks.slice(0, 3) }
        );
      } else {
        updateTestResult(
          'spotifyTracks', 
          'failed', 
          'Failed to fetch tracks or empty response'
        );
      }
    } catch (error) {
      updateTestResult(
        'spotifyTracks', 
        'failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Spotify Catalog Import
  const testSpotifyImport = async () => {
    setRunningTest('spotifyImport');
    try {
      const success = await spotifyService.importArtistCatalog(TEST_ARTIST_ID);
      
      // Verify data was stored in database
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', TEST_ARTIST_ID)
        .single();
        
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', TEST_ARTIST_ID)
        .limit(10);
      
      if (success && artistData && !artistError && songsData && !songsError && songsData.length > 0) {
        updateTestResult(
          'spotifyImport', 
          'success', 
          `Successfully imported artist catalog with ${songsData.length}+ songs`,
          { artist: artistData, sampleSongs: songsData.slice(0, 3) }
        );
      } else {
        updateTestResult(
          'spotifyImport', 
          'failed', 
          `Import issues: API success=${success}, DB artist=${!!artistData}, DB songs=${songsData?.length || 0}`
        );
      }
    } catch (error) {
      updateTestResult(
        'spotifyImport', 
        'failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Ticketmaster Events
  const testTicketmasterEvents = async () => {
    setRunningTest('ticketmasterEvents');
    try {
      const events = await ticketmasterService.getArtistEvents(TEST_ARTIST_NAME);
      if (events && events.length > 0) {
        updateTestResult(
          'ticketmasterEvents', 
          'success', 
          `Successfully fetched ${events.length} events`,
          { eventCount: events.length, sampleEvents: events.slice(0, 3) }
        );
      } else {
        updateTestResult(
          'ticketmasterEvents', 
          'failed', 
          `No events found for ${TEST_ARTIST_NAME} or API error`
        );
      }
    } catch (error) {
      updateTestResult(
        'ticketmasterEvents', 
        'failed', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Ticketmaster Store
  const testTicketmasterStore = async () => {
    setRunningTest('ticketmasterStore');
    try {
      // Get events
      const events = await ticketmasterService.getArtistEvents(TEST_ARTIST_NAME);
      
      if (!events || events.length === 0) {
        updateTestResult(
          'ticketmasterStore',
          'failed',
          'No events available to store'
        );
        setRunningTest(null);
        return;
      }
      
      // Try to store the first event
      const event = events[0];
      const venue = event._embedded?.venues?.[0];
      
      if (!venue) {
        updateTestResult(
          'ticketmasterStore',
          'failed',
          'No venue data in event'
        );
        setRunningTest(null);
        return;
      }
      
      // Store venue
      const venueStored = await ticketmasterService.storeVenueInDatabase(venue);
      
      // Store show
      const showStored = await ticketmasterService.storeShowInDatabase(event, TEST_ARTIST_ID, venue.id);
      
      // Verify data was stored
      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venue.id)
        .single();
        
      const { data: showData } = await supabase
        .from('shows')
        .select('*')
        .eq('id', event.id)
        .single();
      
      if (venueStored && showStored && venueData && showData) {
        updateTestResult(
          'ticketmasterStore',
          'success',
          'Successfully stored venue and show data',
          { venue: venueData, show: showData }
        );
      } else {
        updateTestResult(
          'ticketmasterStore',
          'failed',
          `Store issues: Venue=${venueStored}, Show=${showStored}`
        );
      }
    } catch (error) {
      updateTestResult(
        'ticketmasterStore',
        'failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Create Setlist
  const testSetlistCreate = async () => {
    setRunningTest('setlistCreate');
    try {
      // Get a show for our test artist
      const { data: shows } = await supabase
        .from('shows')
        .select('*')
        .eq('artist_id', TEST_ARTIST_ID)
        .limit(1);
      
      if (!shows || shows.length === 0) {
        updateTestResult(
          'setlistCreate',
          'failed',
          'No shows available for test artist'
        );
        setRunningTest(null);
        return;
      }
      
      const showId = shows[0].id;
      
      // Create setlist
      const setlistId = await setlistService.getOrCreateSetlist(showId);
      
      if (!setlistId) {
        updateTestResult(
          'setlistCreate',
          'failed',
          'Failed to create setlist'
        );
        setRunningTest(null);
        return;
      }
      
      // Verify setlist was created
      const { data: setlist } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', setlistId)
        .single();
      
      if (setlist) {
        updateTestResult(
          'setlistCreate',
          'success',
          `Successfully created setlist with ID: ${setlistId}`,
          { setlist }
        );
      } else {
        updateTestResult(
          'setlistCreate',
          'failed',
          'Failed to find created setlist'
        );
      }
    } catch (error) {
      updateTestResult(
        'setlistCreate',
        'failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Fetch Setlist
  const testSetlistFetch = async () => {
    setRunningTest('setlistFetch');
    try {
      // Get a show for our test artist
      const { data: shows } = await supabase
        .from('shows')
        .select('*')
        .eq('artist_id', TEST_ARTIST_ID)
        .limit(1);
      
      if (!shows || shows.length === 0) {
        updateTestResult(
          'setlistFetch',
          'failed',
          'No shows available for test artist'
        );
        setRunningTest(null);
        return;
      }
      
      const showId = shows[0].id;
      
      // Fetch setlist
      const setlist = await setlistService.getSetlistByShowId(showId);
      
      if (setlist && setlist.songs) {
        updateTestResult(
          'setlistFetch',
          'success',
          `Successfully fetched setlist with ${setlist.songs.length} songs`,
          { setlist }
        );
      } else {
        updateTestResult(
          'setlistFetch',
          'failed',
          'Failed to fetch setlist or setlist has no songs'
        );
      }
    } catch (error) {
      updateTestResult(
        'setlistFetch',
        'failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Add Song
  const testSongAdd = async () => {
    setRunningTest('songAdd');
    try {
      // Get a setlist to work with
      const { data: setlistData } = await supabase
        .from('setlists')
        .select('*')
        .limit(1);
      
      if (!setlistData || setlistData.length === 0) {
        updateTestResult(
          'songAdd',
          'failed',
          'No setlists available for testing'
        );
        setRunningTest(null);
        return;
      }
      
      const setlistId = setlistData[0].id;
      
      // Get a song from the artist that's not already in this setlist
      const { data: existingSongs } = await supabase
        .from('setlist_songs')
        .select('song_id')
        .eq('setlist_id', setlistId);
      
      const existingSongIds = existingSongs?.map(s => s.song_id) || [];
      
      const { data: artistSongs } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', TEST_ARTIST_ID)
        .not('id', 'in', `(${existingSongIds.join(',')})`)
        .limit(1);
      
      if (!artistSongs || artistSongs.length === 0) {
        updateTestResult(
          'songAdd',
          'failed',
          'No available songs to add to setlist'
        );
        setRunningTest(null);
        return;
      }
      
      const songId = artistSongs[0].id;
      
      // Add song to setlist
      const success = await setlistService.addSongToSetlist(setlistId, songId);
      
      // Verify song was added
      const { data: setlistSong } = await supabase
        .from('setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .eq('song_id', songId)
        .single();
      
      if (success && setlistSong) {
        updateTestResult(
          'songAdd',
          'success',
          'Successfully added song to setlist',
          { setlistSong }
        );
      } else {
        updateTestResult(
          'songAdd',
          'failed',
          `Failed to add song: API success=${success}, DB verification=${!!setlistSong}`
        );
      }
    } catch (error) {
      updateTestResult(
        'songAdd',
        'failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Test Vote (Note: This requires an authenticated user)
  const testSongVote = async () => {
    setRunningTest('songVote');
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateTestResult(
          'songVote',
          'failed',
          'User not authenticated. Voting requires authentication.'
        );
        setRunningTest(null);
        return;
      }
      
      // Get a setlist song to vote on
      const { data: setlistSongs } = await supabase
        .from('setlist_songs')
        .select('*')
        .limit(1);
      
      if (!setlistSongs || setlistSongs.length === 0) {
        updateTestResult(
          'songVote',
          'failed',
          'No setlist songs available for voting'
        );
        setRunningTest(null);
        return;
      }
      
      const setlistSongId = setlistSongs[0].id;
      
      // Vote for the song
      const newVoteCount = await setlistService.voteForSong(setlistSongId);
      
      if (newVoteCount !== null) {
        updateTestResult(
          'songVote',
          'success',
          `Successfully voted for song. New vote count: ${newVoteCount}`,
          { setlistSongId, newVoteCount }
        );
      } else {
        updateTestResult(
          'songVote',
          'failed',
          'Failed to vote for song'
        );
      }
    } catch (error) {
      updateTestResult(
        'songVote',
        'failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setRunningTest(null);
    }
  };
  
  // Run all tests sequentially
  const runAllTests = async () => {
    toast.info("Running all tests sequentially");
    
    await testSpotifyArtist();
    await testSpotifyTracks();
    await testSpotifyImport();
    await testTicketmasterEvents();
    await testTicketmasterStore();
    await testSetlistCreate();
    await testSetlistFetch();
    await testSongAdd();
    await testSongVote();
    
    toast.success("All tests completed");
  };
  
  // Count test results
  const successCount = Object.values(testResults).filter(t => t.status === 'success').length;
  const failedCount = Object.values(testResults).filter(t => t.status === 'failed').length;
  const pendingCount = Object.values(testResults).filter(t => t.status === 'pending').length;
  
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Data Sync & Import Tests</h1>
      <p className="text-slate-300 mb-6">
        This utility runs tests to ensure proper data flow between APIs and the database.
        It will test Spotify API, Ticketmaster API, and database synchronization.
      </p>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={runAllTests}
          className="bg-slate-800 hover:bg-slate-700"
          disabled={!!runningTest}
        >
          {runningTest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Run All Tests
        </Button>
        
        <Button 
          onClick={() => setShowDetails(!showDetails)} 
          variant="outline"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{successCount}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{failedCount}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-400">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle>Spotify API Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.spotifyArtist.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.spotifyArtist.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.spotifyArtist.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSpotifyArtist}
                disabled={runningTest === 'spotifyArtist'}
              >
                {runningTest === 'spotifyArtist' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.spotifyTracks.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.spotifyTracks.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.spotifyTracks.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSpotifyTracks}
                disabled={runningTest === 'spotifyTracks'}
              >
                {runningTest === 'spotifyTracks' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.spotifyImport.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.spotifyImport.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.spotifyImport.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSpotifyImport}
                disabled={runningTest === 'spotifyImport'}
              >
                {runningTest === 'spotifyImport' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle>Ticketmaster API Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.ticketmasterEvents.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.ticketmasterEvents.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.ticketmasterEvents.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testTicketmasterEvents}
                disabled={runningTest === 'ticketmasterEvents'}
              >
                {runningTest === 'ticketmasterEvents' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.ticketmasterStore.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.ticketmasterStore.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.ticketmasterStore.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testTicketmasterStore}
                disabled={runningTest === 'ticketmasterStore'}
              >
                {runningTest === 'ticketmasterStore' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle>Setlist Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.setlistCreate.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.setlistCreate.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.setlistCreate.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSetlistCreate}
                disabled={runningTest === 'setlistCreate'}
              >
                {runningTest === 'setlistCreate' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.setlistFetch.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.setlistFetch.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.setlistFetch.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSetlistFetch}
                disabled={runningTest === 'setlistFetch'}
              >
                {runningTest === 'setlistFetch' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.songAdd.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.songAdd.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.songAdd.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSongAdd}
                disabled={runningTest === 'songAdd'}
              >
                {runningTest === 'songAdd' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {testResults.songVote.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : testResults.songVote.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                )}
                <span className="text-slate-200">{testResults.songVote.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={testSongVote}
                disabled={runningTest === 'songVote'}
              >
                {runningTest === 'songVote' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Test Details */}
        {showDetails && (
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(testResults).map(([key, test]) => (
              <AccordionItem key={key} value={key} className="border-slate-700 bg-slate-900">
                <AccordionTrigger className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    {test.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : test.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-400"></div>
                    )}
                    <span className="text-slate-200">{test.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {test.status !== 'pending' && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong className="text-white">Status:</strong>{" "}
                        <span className={test.status === 'success' ? "text-green-500" : "text-red-500"}>
                          {test.status === 'success' ? "Success" : "Failed"}
                        </span>
                      </div>
                      
                      {test.message && (
                        <div className="text-sm">
                          <strong className="text-white">Message:</strong>{" "}
                          <span className="text-slate-300">{test.message}</span>
                        </div>
                      )}
                      
                      {test.data && (
                        <div className="text-sm">
                          <strong className="text-white">Data:</strong>
                          <pre className="mt-2 rounded bg-slate-950 p-2 text-xs text-slate-300 overflow-auto max-h-60">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default DataSyncTests;
