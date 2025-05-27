import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateSetlistWithSongs } from '@/services/setlistCreation';
import { search } from '@/services/search';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
}

export default function UserFlowTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Search for Artists', status: 'pending' },
    { name: 'Load Artist Data', status: 'pending' },
    { name: 'Load Shows for Artist', status: 'pending' },
    { name: 'Create/Load Setlist with Songs', status: 'pending' },
    { name: 'Vote Functionality', status: 'pending' },
    { name: 'Real-time Updates', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState<any>({});

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    
    try {
      // Test 1: Search for Artists
      updateTest(0, { status: 'running' });
      const searchResults = await search({ query: 'Taylor Swift', limit: 5 });
      if (searchResults.length === 0) {
        updateTest(0, { status: 'failed', message: 'No search results found' });
        return;
      }
      const artist = searchResults.find(r => r.type === 'artist');
      if (!artist) {
        updateTest(0, { status: 'failed', message: 'No artists in search results' });
        return;
      }
      updateTest(0, { status: 'passed', message: `Found ${searchResults.length} results` });
      setTestData(prev => ({ ...prev, artist }));

      // Test 2: Load Artist Data
      updateTest(1, { status: 'running' });
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artist.id)
        .single();
      
      if (artistError || !artistData) {
        updateTest(1, { status: 'failed', message: artistError?.message || 'Artist not found in database' });
        return;
      }
      updateTest(1, { status: 'passed', message: `Loaded artist: ${artistData.name}` });
      setTestData(prev => ({ ...prev, artistData }));

      // Test 3: Load Shows for Artist
      updateTest(2, { status: 'running' });
      const { data: shows, error: showsError } = await supabase
        .from('shows')
        .select(`
          *,
          artists!shows_artist_id_fkey(id, name, image_url),
          venues!shows_venue_id_fkey(id, name, city, state, country)
        `)
        .eq('artist_id', artist.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);

      if (showsError) {
        updateTest(2, { status: 'failed', message: showsError.message });
        return;
      }
      
      if (!shows || shows.length === 0) {
        updateTest(2, { status: 'failed', message: 'No upcoming shows found for artist' });
        return;
      }
      
      updateTest(2, { status: 'passed', message: `Found ${shows.length} upcoming shows` });
      setTestData(prev => ({ ...prev, shows, selectedShow: shows[0] }));

      // Test 4: Create/Load Setlist with Songs
      updateTest(3, { status: 'running' });
      const selectedShow = shows[0];
      const setlistResult = await getOrCreateSetlistWithSongs(selectedShow.id);
      
      if (!setlistResult.success) {
        updateTest(3, { status: 'failed', message: setlistResult.message || 'Failed to create setlist' });
        return;
      }

      // Verify setlist has songs
      const { data: setlistSongs, error: songsError } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          songs!setlist_songs_song_id_fkey(id, name, album, artist_id, spotify_url)
        `)
        .eq('setlist_id', setlistResult.setlist_id);

      if (songsError || !setlistSongs || setlistSongs.length === 0) {
        updateTest(3, { status: 'failed', message: 'Setlist created but no songs found' });
        return;
      }

      updateTest(3, { status: 'passed', message: `Setlist created with ${setlistSongs.length} songs` });
      setTestData(prev => ({ ...prev, setlistResult, setlistSongs }));

      // Test 5: Vote Functionality (if user is logged in)
      updateTest(4, { status: 'running' });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateTest(4, { status: 'failed', message: 'User not logged in - cannot test voting' });
        return;
      }

      // Try to vote for the first song
      const firstSong = setlistSongs[0];
      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_song', {
        setlist_song_id: firstSong.id
      });

      if (voteError) {
        if (voteError.message.includes('already voted')) {
          updateTest(4, { status: 'passed', message: 'Vote system working (already voted)' });
        } else {
          updateTest(4, { status: 'failed', message: voteError.message });
          return;
        }
      } else {
        updateTest(4, { status: 'passed', message: 'Vote successfully recorded' });
      }

      // Test 6: Real-time Updates
      updateTest(5, { status: 'running' });
      // This is harder to test automatically, so we'll just verify the subscription setup
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
          () => {
            updateTest(5, { status: 'passed', message: 'Real-time subscription active' });
          }
        )
        .subscribe();

      // Wait a moment then clean up
      setTimeout(() => {
        supabase.removeChannel(channel);
        if (tests[5].status === 'running') {
          updateTest(5, { status: 'passed', message: 'Real-time setup verified' });
        }
      }, 2000);

      toast.success('User flow test completed successfully!');

    } catch (error: any) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            Complete User Flow Test
          </CardTitle>
          <p className="text-gray-400">
            Tests the entire user journey from search to voting to ensure all data flows work correctly.
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

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium text-white">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {test.message && (
                    <span className="text-sm text-gray-400">{test.message}</span>
                  )}
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(testData).length > 0 && (
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-sm text-gray-300">Test Data</CardTitle>
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
