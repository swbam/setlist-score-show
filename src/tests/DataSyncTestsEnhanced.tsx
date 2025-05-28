import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, Clock, Info } from 'lucide-react';

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  operation: string;
  message: string;
  data?: any;
  duration?: number;
}

// Enhanced test component for data sync operations with comprehensive logging
const DataSyncTestsEnhanced = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>({});
  const [logs, setLogs] = useState<TestLog[]>([]);

  // Enhanced logging function
  const addLog = (type: TestLog['type'], operation: string, message: string, data?: any, duration?: number) => {
    const logEntry: TestLog = {
      timestamp: new Date().toISOString(),
      type,
      operation,
      message,
      data,
      duration
    };
    
    setLogs(prev => [...prev, logEntry]);
    console.log(`[${type.toUpperCase()}] ${operation}: ${message}`, data || '');
    
    // Also show important logs as toasts
    if (type === 'error') {
      toast.error(`${operation}: ${message}`);
    } else if (type === 'success') {
      toast.success(`${operation}: ${message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResults({});
    addLog('info', 'System', 'Logs and results cleared');
  };

  const testShowsQuery = async () => {
    const startTime = Date.now();
    setLoading('shows');
    addLog('info', 'Shows Query', 'Starting shows database query test');
    
    try {
      addLog('info', 'Shows Query', 'Executing Supabase query with joins to artists and venues');
      
      const { data, error, count } = await supabase
        .from('shows')
        .select(`
          id,
          name,
          date,
          status,
          ticketmaster_url,
          artists!shows_artist_id_fkey (
            id,
            name,
            image_url,
            genres
          ),
          venues!shows_venue_id_fkey (
            id,
            name,
            city,
            state,
            country
          )
        `, { count: 'exact' })
        .limit(5);

      const duration = Date.now() - startTime;

      if (error) {
        addLog('error', 'Shows Query', `Database query failed: ${error.message}`, error, duration);
        throw error;
      }

      addLog('info', 'Shows Query', `Raw database response received`, { 
        rowCount: data?.length || 0,
        totalCount: count,
        sample: data?.[0] || null,
        queryDuration: `${duration}ms`
      }, duration);

      // Validate data integrity
      const validationResults = {
        showsWithoutArtists: 0,
        showsWithoutVenues: 0,
        futureShows: 0,
        pastShows: 0
      };

      const formattedShows = (data || []).map((show, index) => {
        // Track validation issues
        if (!show.artists) validationResults.showsWithoutArtists++;
        if (!show.venues) validationResults.showsWithoutVenues++;
        
        const showDate = new Date(show.date);
        const now = new Date();
        if (showDate > now) {
          validationResults.futureShows++;
        } else {
          validationResults.pastShows++;
        }

        const formatted = {
          id: show.id,
          name: show.name,
          date: show.date,
          status: show.status,
          artist_name: show.artists?.name || 'Unknown Artist',
          artist_id: show.artists?.id || null,
          venue_name: show.venues?.name || 'Unknown Venue',
          venue_city: show.venues?.city || 'Unknown City',
          venue_state: show.venues?.state || null,
          ticketmaster_url: show.ticketmaster_url
        };
        
        if (index === 0) {
          addLog('info', 'Shows Query', 'Sample formatted show data', formatted);
        }
        
        return formatted;
      });

      // Log validation results
      addLog('info', 'Shows Query', 'Data validation completed', validationResults);

      if (validationResults.showsWithoutArtists > 0) {
        addLog('warning', 'Shows Query', `Found ${validationResults.showsWithoutArtists} shows without artist data`);
      }

      if (validationResults.showsWithoutVenues > 0) {
        addLog('warning', 'Shows Query', `Found ${validationResults.showsWithoutVenues} shows without venue data`);
      }

      setResults(prev => ({ ...prev, shows: formattedShows }));
      addLog('success', 'Shows Query', `Successfully processed ${formattedShows.length} shows`, {
        futureShows: validationResults.futureShows,
        pastShows: validationResults.pastShows
      }, duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog('error', 'Shows Query', `Query execution failed`, error, duration);
    } finally {
      setLoading(null);
    }
  };

  const testArtistsQuery = async () => {
    const startTime = Date.now();
    setLoading('artists');
    addLog('info', 'Artists Query', 'Starting artists database query test');
    
    try {
      addLog('info', 'Artists Query', 'Fetching artists with metadata');
      
      const { data, error, count } = await supabase
        .from('artists')
        .select('id, name, image_url, genres, popularity, spotify_url, last_synced_at', { count: 'exact' })
        .limit(5);

      const duration = Date.now() - startTime;

      if (error) {
        addLog('error', 'Artists Query', `Database query failed: ${error.message}`, error, duration);
        throw error;
      }

      // Analyze artist data quality
      const dataQuality = {
        withImages: 0,
        withGenres: 0,
        withPopularity: 0,
        recentlySync: 0,
        staleSync: 0
      };

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      (data || []).forEach(artist => {
        if (artist.image_url) dataQuality.withImages++;
        if (artist.genres && artist.genres.length > 0) dataQuality.withGenres++;
        if (artist.popularity && artist.popularity > 0) dataQuality.withPopularity++;
        
        if (artist.last_synced_at) {
          const syncDate = new Date(artist.last_synced_at);
          if (syncDate > oneDayAgo) {
            dataQuality.recentlySync++;
          } else {
            dataQuality.staleSync++;
          }
        }
      });

      addLog('info', 'Artists Query', 'Data quality analysis completed', {
        totalArtists: data?.length || 0,
        dataQuality,
        queryDuration: `${duration}ms`
      }, duration);

      setResults(prev => ({ ...prev, artists: data }));
      addLog('success', 'Artists Query', `Found ${data?.length || 0} artists`, dataQuality, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog('error', 'Artists Query', `Query execution failed`, error, duration);
    } finally {
      setLoading(null);
    }
  };

  const testUserArtistsQuery = async () => {
    const startTime = Date.now();
    setLoading('user_artists');
    addLog('info', 'User Artists Query', 'Starting user artists relationship test');
    
    try {
      addLog('info', 'User Artists Query', 'Checking user authentication');
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser?.user) {
        addLog('warning', 'User Artists Query', 'User not authenticated - cannot test user artists');
        toast.error('Please log in to test user artists');
        setLoading(null);
        return;
      }

      addLog('info', 'User Artists Query', `Testing for user: ${authUser.user.email}`, {
        userId: authUser.user.id
      });

      const { data, error } = await supabase
        .from('user_artists')
        .select(`
          id,
          rank,
          created_at,
          artists!user_artists_artist_id_fkey (
            id,
            name,
            image_url,
            genres,
            popularity
          )
        `)
        .eq('user_id', authUser.user.id)
        .order('rank', { ascending: true })
        .limit(10);

      const duration = Date.now() - startTime;

      if (error) {
        addLog('error', 'User Artists Query', `Database query failed: ${error.message}`, error, duration);
        throw error;
      }

      const formattedUserArtists = (data || []).map(item => ({
        id: item.id,
        rank: item.rank,
        created_at: item.created_at,
        artist_name: item.artists?.name || 'Unknown Artist',
        artist_id: item.artists?.id || null,
        artist_image: item.artists?.image_url,
        artist_genres: item.artists?.genres || [],
        artist_popularity: item.artists?.popularity || 0
      }));

      // Analyze ranking consistency
      const rankingIssues = formattedUserArtists.filter((item, index) => 
        item.rank !== index + 1
      );

      if (rankingIssues.length > 0) {
        addLog('warning', 'User Artists Query', `Found ${rankingIssues.length} ranking inconsistencies`, rankingIssues);
      }

      setResults(prev => ({ ...prev, user_artists: formattedUserArtists }));
      addLog('success', 'User Artists Query', `Found ${formattedUserArtists.length} user artists`, {
        rankingIssues: rankingIssues.length,
        queryDuration: `${duration}ms`
      }, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      addLog('error', 'User Artists Query', `Query execution failed`, error, duration);
    } finally {
      setLoading(null);
    }
  };

  const testDataFlow = async () => {
    const startTime = Date.now();
    setLoading('data_flow');
    addLog('info', 'Data Flow Test', 'Starting comprehensive data flow validation');

    try {
      // Test 1: Artist → Shows relationship
      addLog('info', 'Data Flow Test', 'Testing Artist → Shows relationship');
      const { data: artistWithShows } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          shows!shows_artist_id_fkey(count)
        `)
        .limit(5);

      const artistsWithShowCounts = artistWithShows?.map(artist => ({
        id: artist.id,
        name: artist.name,
        showCount: artist.shows?.[0]?.count || 0
      })) || [];

      addLog('info', 'Data Flow Test', 'Artist → Shows relationship analysis', {
        artistsChecked: artistsWithShowCounts.length,
        artistsWithShows: artistsWithShowCounts.filter(a => a.showCount > 0).length
      });

      // Test 2: Show → Setlists relationship
      addLog('info', 'Data Flow Test', 'Testing Show → Setlists relationship');
      const { data: showsWithSetlists } = await supabase
        .from('shows')
        .select(`
          id,
          name,
          setlists!setlists_show_id_fkey(count)
        `)
        .limit(5);

      const showSetlistCounts = showsWithSetlists?.map(show => ({
        id: show.id,
        name: show.name,
        setlistCount: show.setlists?.[0]?.count || 0
      })) || [];

      addLog('info', 'Data Flow Test', 'Show → Setlists relationship analysis', {
        showsChecked: showSetlistCounts.length,
        showsWithSetlists: showSetlistCounts.filter(s => s.setlistCount > 0).length
      });

      const duration = Date.now() - startTime;
      addLog('success', 'Data Flow Test', 'Data flow validation completed', {
        artistsWithShows: artistsWithShowCounts.filter(a => a.showCount > 0).length,
        showsWithSetlists: showSetlistCounts.filter(s => s.setlistCount > 0).length,
        totalDuration: `${duration}ms`
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      addLog('error', 'Data Flow Test', 'Data flow validation failed', error, duration);
    } finally {
      setLoading(null);
    }
  };

  const getLogIcon = (type: TestLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Data Sync Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              onClick={testShowsQuery}
              disabled={loading === 'shows'}
              variant="outline"
            >
              {loading === 'shows' ? 'Testing...' : 'Test Shows Query'}
            </Button>
            
            <Button 
              onClick={testArtistsQuery}
              disabled={loading === 'artists'}
              variant="outline"
            >
              {loading === 'artists' ? 'Testing...' : 'Test Artists Query'}
            </Button>
            
            <Button 
              onClick={testUserArtistsQuery}
              disabled={loading === 'user_artists'}
              variant="outline"
            >
              {loading === 'user_artists' ? 'Testing...' : 'Test User Artists'}
            </Button>

            <Button 
              onClick={testDataFlow}
              disabled={loading === 'data_flow'}
              variant="outline"
            >
              {loading === 'data_flow' ? 'Testing...' : 'Test Data Flow'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearLogs} variant="secondary" size="sm">
              Clear Logs
            </Button>
            <Badge variant="outline">
              {logs.length} log entries
            </Badge>
          </div>
          
          <Separator />

          {/* Logs Section */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Test Logs:</h3>
              <div className="max-h-64 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <span className="font-mono text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="ml-2 font-medium">[{log.operation}]</span>
                      <span className="ml-1">{log.message}</span>
                      {log.duration && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({log.duration}ms)
                        </span>
                      )}
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            Show data
                          </summary>
                          <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Display Results */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              {results.shows && (
                <div>
                  <Badge variant="secondary">Shows ({results.shows.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                    {JSON.stringify(results.shows, null, 2)}
                  </pre>
                </div>
              )}
              
              {results.artists && (
                <div>
                  <Badge variant="secondary">Artists ({results.artists.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                    {JSON.stringify(results.artists, null, 2)}
                  </pre>
                </div>
              )}
              
              {results.user_artists && (
                <div>
                  <Badge variant="secondary">User Artists ({results.user_artists.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                    {JSON.stringify(results.user_artists, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSyncTestsEnhanced;
