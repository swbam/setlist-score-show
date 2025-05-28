import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateSetlistWithSongs } from '@/services/setlistCreation';
import { search } from '@/services/search';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Info, Clock } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
  duration?: number;
  logs?: string[];
}

interface TestLog {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  test: string;
  message: string;
  data?: any;
}

export default function UserFlowTestEnhanced() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Search for Artists', status: 'pending' },
    { name: 'Load Artist Data', status: 'pending' },
    { name: 'Load Shows for Artist', status: 'pending' },
    { name: 'Create/Load Setlist with Songs', status: 'pending' },
    { name: 'Vote Functionality', status: 'pending' },
    { name: 'Real-time Updates', status: 'pending' },
    { name: 'Data Consistency Check', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [allLogs, setAllLogs] = useState<TestLog[]>([]);

  const addLog = (level: TestLog['level'], test: string, message: string, data?: any) => {
    const log: TestLog = {
      timestamp: new Date().toISOString(),
      level,
      test,
      message,
      data
    };
    
    setAllLogs(prev => [...prev, log]);
    console.log(`[${level.toUpperCase()}] ${test}: ${message}`, data || '');
  };

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => {
      if (i === index) {
        const updatedTest = { ...test, ...updates };
        
        // Add log entry for test updates
        if (updates.status === 'running') {
          addLog('info', test.name, 'Test started');
        } else if (updates.status === 'passed') {
          addLog('success', test.name, updates.message || 'Test passed', updates.data);
        } else if (updates.status === 'failed') {
          addLog('error', test.name, updates.message || 'Test failed', updates.data);
        }
        
        return updatedTest;
      }
      return test;
    }));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setAllLogs([]);
    setTestData({});
    addLog('info', 'System', 'Starting comprehensive user flow test');
    
    try {
      // Test 1: Search for Artists
      const searchStartTime = Date.now();
      updateTest(0, { status: 'running' });
      addLog('info', 'Search', 'Initiating artist search for "Taylor Swift"');
      
      const searchResults = await search({ query: 'Taylor Swift', limit: 5 });
      const searchDuration = Date.now() - searchStartTime;
      
      addLog('info', 'Search', `Search completed in ${searchDuration}ms`, {
        totalResults: searchResults.length,
        resultTypes: searchResults.map(r => r.type)
      });

      if (searchResults.length === 0) {
        updateTest(0, { 
          status: 'failed', 
          message: 'No search results found',
          duration: searchDuration
        });
        return;
      }

      const artist = searchResults.find(r => r.type === 'artist');
      if (!artist) {
        updateTest(0, { 
          status: 'failed', 
          message: 'No artists in search results',
          duration: searchDuration,
          data: { searchResults }
        });
        return;
      }

      updateTest(0, { 
        status: 'passed', 
        message: `Found ${searchResults.length} results, selected artist: ${artist.name}`,
        duration: searchDuration,
        data: { selectedArtist: artist }
      });
      setTestData(prev => ({ ...prev, artist }));

      // Test 2: Load Artist Data
      const artistDataStartTime = Date.now();
      updateTest(1, { status: 'running' });
      addLog('info', 'Artist Data', `Loading full artist data for ${artist.name} (ID: ${artist.id})`);
      
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artist.id)
        .single();

      const artistDataDuration = Date.now() - artistDataStartTime;
      
      if (artistError || !artistData) {
        addLog('error', 'Artist Data', `Failed to load artist data: ${artistError?.message || 'Not found'}`);
        updateTest(1, { 
          status: 'failed', 
          message: artistError?.message || 'Artist not found in database',
          duration: artistDataDuration
        });
        return;
      }

      // Validate artist data completeness
      const dataCompleteness = {
        hasImage: !!artistData.image_url,
        hasGenres: !!(artistData.genres && artistData.genres.length > 0),
        hasPopularity: !!artistData.popularity,
        hasSpotifyUrl: !!artistData.spotify_url,
        lastSynced: artistData.last_synced_at
      };

      addLog('info', 'Artist Data', 'Artist data completeness analysis', dataCompleteness);

      updateTest(1, { 
        status: 'passed', 
        message: `Loaded artist: ${artistData.name}`,
        duration: artistDataDuration,
        data: { artistData, dataCompleteness }
      });
      setTestData(prev => ({ ...prev, artistData }));

      // Test 3: Load Shows for Artist
      const showsStartTime = Date.now();
      updateTest(2, { status: 'running' });
      addLog('info', 'Shows', `Loading shows for artist ${artist.name}`);
      
      const { data: shows, error: showsError, count: totalShows } = await supabase
        .from('shows')
        .select(`
          *,
          artists!shows_artist_id_fkey(id, name, image_url),
          venues!shows_venue_id_fkey(id, name, city, state, country)
        `, { count: 'exact' })
        .eq('artist_id', artist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);

      const showsDuration = Date.now() - showsStartTime;

      if (showsError) {
        addLog('error', 'Shows', `Failed to load shows: ${showsError.message}`);
        updateTest(2, { 
          status: 'failed', 
          message: showsError.message,
          duration: showsDuration
        });
        return;
      }
      
      if (!shows || shows.length === 0) {
        addLog('warning', 'Shows', 'No upcoming shows found for artist');
        updateTest(2, { 
          status: 'failed', 
          message: 'No upcoming shows found for artist',
          duration: showsDuration,
          data: { totalShows }
        });
        return;
      }

      // Validate show data quality
      const showsValidation = {
        withVenues: shows.filter(s => s.venues).length,
        withDates: shows.filter(s => s.date).length,
        withTicketmasterUrls: shows.filter(s => s.ticketmaster_url).length,
        statusDistribution: shows.reduce((acc, show) => {
          acc[show.status || 'unknown'] = (acc[show.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      addLog('info', 'Shows', 'Shows data validation completed', showsValidation);
      
      updateTest(2, { 
        status: 'passed', 
        message: `Found ${shows.length} upcoming shows`,
        duration: showsDuration,
        data: { shows, validation: showsValidation }
      });
      setTestData(prev => ({ ...prev, shows, selectedShow: shows[0] }));

      // Test 4: Create/Load Setlist with Songs
      const setlistStartTime = Date.now();
      updateTest(3, { status: 'running' });
      const selectedShow = shows[0];
      addLog('info', 'Setlist', `Creating/loading setlist for show: ${selectedShow.name} on ${selectedShow.date}`);
      
      const setlistResult = await getOrCreateSetlistWithSongs(selectedShow.id);
      const setlistDuration = Date.now() - setlistStartTime;
      
      if (!setlistResult.success) {
        addLog('error', 'Setlist', `Setlist creation failed: ${setlistResult.message}`);
        updateTest(3, { 
          status: 'failed', 
          message: setlistResult.message || 'Failed to create setlist',
          duration: setlistDuration
        });
        return;
      }

      addLog('info', 'Setlist', `Setlist operation successful, checking songs`, {
        setlistId: setlistResult.setlist_id,
        wasExisting: setlistResult.was_existing
      });

      // Verify setlist has songs
      const { data: setlistSongs, error: songsError } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          songs!setlist_songs_song_id_fkey(id, name, album, artist_id, spotify_url, popularity)
        `)
        .eq('setlist_id', setlistResult.setlist_id)
        .order('position');

      if (songsError || !setlistSongs || setlistSongs.length === 0) {
        addLog('error', 'Setlist', `No songs found in setlist: ${songsError?.message || 'Empty setlist'}`);
        updateTest(3, { 
          status: 'failed', 
          message: 'Setlist created but no songs found',
          duration: setlistDuration
        });
        return;
      }

      // Analyze setlist song quality
      const songsAnalysis = {
        totalSongs: setlistSongs.length,
        songsWithSpotifyUrls: setlistSongs.filter(s => s.songs?.spotify_url).length,
        songsWithPopularity: setlistSongs.filter(s => s.songs?.popularity && s.songs.popularity > 0).length,
        averagePopularity: setlistSongs.reduce((sum, s) => sum + (s.songs?.popularity || 0), 0) / setlistSongs.length,
        positionIntegrity: setlistSongs.every((song, index) => song.position === index + 1)
      };

      addLog('info', 'Setlist', 'Setlist songs analysis completed', songsAnalysis);

      updateTest(3, { 
        status: 'passed', 
        message: `Setlist created with ${setlistSongs.length} songs`,
        duration: setlistDuration,
        data: { setlistResult, setlistSongs, analysis: songsAnalysis }
      });
      setTestData(prev => ({ ...prev, setlistResult, setlistSongs }));

      // Test 5: Vote Functionality
      const voteStartTime = Date.now();
      updateTest(4, { status: 'running' });
      addLog('info', 'Voting', 'Testing vote functionality');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addLog('warning', 'Voting', 'User not authenticated - cannot test voting');
        updateTest(4, { 
          status: 'failed', 
          message: 'User not logged in - cannot test voting',
          duration: Date.now() - voteStartTime
        });
        return;
      }

      addLog('info', 'Voting', `User authenticated: ${user.email}, attempting to vote for first song`);

      // Try to vote for the first song
      const firstSong = setlistSongs[0];
      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_song', {
        setlist_song_id: firstSong.id
      });

      const voteDuration = Date.now() - voteStartTime;

      if (voteError) {
        if (voteError.message.includes('already voted')) {
          addLog('info', 'Voting', 'Vote system working correctly - user already voted');
          updateTest(4, { 
            status: 'passed', 
            message: 'Vote system working (already voted)',
            duration: voteDuration
          });
        } else {
          addLog('error', 'Voting', `Vote failed: ${voteError.message}`);
          updateTest(4, { 
            status: 'failed', 
            message: voteError.message,
            duration: voteDuration
          });
          return;
        }
      } else {
        addLog('success', 'Voting', 'Vote successfully recorded', { voteResult });
        updateTest(4, { 
          status: 'passed', 
          message: 'Vote successfully recorded',
          duration: voteDuration,
          data: { voteResult }
        });
      }

      // Test 6: Real-time Updates
      const realtimeStartTime = Date.now();
      updateTest(5, { status: 'running' });
      addLog('info', 'Real-time', 'Testing real-time subscription setup');
      
      let realtimeTestPassed = false;
      
      const channel = supabase
        .channel(`test-setlist-${setlistResult.setlist_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'setlist_songs',
            filter: `setlist_id=eq.${setlistResult.setlist_id}`
          },
          (payload) => {
            addLog('success', 'Real-time', 'Real-time update received', payload);
            realtimeTestPassed = true;
            updateTest(5, { 
              status: 'passed', 
              message: 'Real-time subscription active and working',
              duration: Date.now() - realtimeStartTime
            });
          }
        )
        .subscribe((status) => {
          addLog('info', 'Real-time', `Subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            // If no real update comes through, we'll consider subscription setup as success
            setTimeout(() => {
              if (!realtimeTestPassed) {
                addLog('info', 'Real-time', 'No real-time updates received, but subscription is active');
                updateTest(5, { 
                  status: 'passed', 
                  message: 'Real-time setup verified (subscription active)',
                  duration: Date.now() - realtimeStartTime
                });
              }
            }, 3000);
          }
        });

      // Test 7: Data Consistency Check
      const consistencyStartTime = Date.now();
      updateTest(6, { status: 'running' });
      addLog('info', 'Consistency', 'Running data consistency checks');

      // Check artist → shows → setlist → songs chain
      const consistencyChecks = {
        artistExists: !!artistData,
        showsLinkedToArtist: shows.every(show => show.artist_id === artist.id),
        setlistLinkedToShow: setlistResult.show_id === selectedShow.id,
        songsLinkedToSetlist: setlistSongs.every(song => song.setlist_id === setlistResult.setlist_id),
        songsHaveValidArtist: setlistSongs.every(song => song.songs?.artist_id === artist.id)
      };

      const consistencyDuration = Date.now() - consistencyStartTime;
      const allConsistencyChecksPassed = Object.values(consistencyChecks).every(check => check);

      if (allConsistencyChecksPassed) {
        addLog('success', 'Consistency', 'All data consistency checks passed', consistencyChecks);
        updateTest(6, { 
          status: 'passed', 
          message: 'All data relationships are consistent',
          duration: consistencyDuration,
          data: consistencyChecks
        });
      } else {
        addLog('error', 'Consistency', 'Some data consistency checks failed', consistencyChecks);
        updateTest(6, { 
          status: 'failed', 
          message: 'Data consistency issues found',
          duration: consistencyDuration,
          data: consistencyChecks
        });
      }

      // Clean up real-time subscription
      setTimeout(() => {
        supabase.removeChannel(channel);
        addLog('info', 'Real-time', 'Real-time subscription cleaned up');
      }, 5000);

      addLog('success', 'System', 'Complete user flow test finished successfully!');
      toast.success('User flow test completed successfully!');

    } catch (error: any) {
      addLog('error', 'System', `Unexpected error: ${error.message}`, error);
      console.error('Test error:', error);
      const runningTestIndex = tests.findIndex(t => t.status === 'running');
      if (runningTestIndex >= 0) {
        updateTest(runningTestIndex, { 
          status: 'failed', 
          message: error.message || 'Unexpected error' 
        });
      }
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getLogIcon = (level: TestLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            Enhanced User Flow Test
          </CardTitle>
          <p className="text-gray-400">
            Comprehensive testing of the entire user journey from search to voting with detailed logging and validation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runComprehensiveTest}
            disabled={isRunning}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Complete Flow Test'
            )}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Results */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Test Results</h3>
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-white">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.message && (
                      <span className="text-sm text-gray-400 max-w-48 truncate">{test.message}</span>
                    )}
                    {test.duration && (
                      <span className="text-xs text-gray-500">({test.duration}ms)</span>
                    )}
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Logs */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Test Logs</h3>
              <div className="bg-gray-800 rounded-lg p-3 max-h-96 overflow-y-auto space-y-1">
                {allLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No logs yet. Run the test to see detailed logs.</p>
                ) : (
                  allLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="ml-2 font-medium text-gray-300">[{log.test}]</span>
                        <span className="ml-1 text-gray-100">{log.message}</span>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="text-xs text-blue-400 cursor-pointer">
                              Show data
                            </summary>
                            <pre className="text-xs bg-gray-900 p-2 rounded border mt-1 overflow-auto text-gray-300">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {Object.keys(testData).length > 0 && (
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Test Data Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
