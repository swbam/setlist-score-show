
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  operation: string;
  message: string;
  data?: any;
}

// Enhanced test component for data sync operations with comprehensive logging
const DataSyncTests = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>({});
  const [logs, setLogs] = useState<TestLog[]>([]);

  // Enhanced logging function
  const addLog = (type: TestLog['type'], operation: string, message: string, data?: any) => {
    const logEntry: TestLog = {
      timestamp: new Date().toISOString(),
      type,
      operation,
      message,
      data
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
  };

  const testShowsQuery = async () => {
    setLoading('shows');
    addLog('info', 'Shows Query', 'Starting shows database query test');
    
    try {
      addLog('info', 'Shows Query', 'Executing Supabase query with joins to artists and venues');
      
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          name,
          date,
          artists!shows_artist_id_fkey (
            id,
            name
          ),
          venues!shows_venue_id_fkey (
            id,
            name,
            city
          )
        `)
        .limit(5);

      if (error) {
        addLog('error', 'Shows Query', `Database query failed: ${error.message}`, error);
        throw error;
      }

      addLog('info', 'Shows Query', `Raw database response received`, { 
        rowCount: data?.length || 0,
        sample: data?.[0] || null 
      });

      const formattedShows = (data || []).map((show, index) => {
        const formatted = {
          id: show.id,
          name: show.name,
          date: show.date,
          artist_name: show.artists?.name || 'Unknown Artist',
          venue_name: show.venues?.name || 'Unknown Venue',
          venue_city: show.venues?.city || 'Unknown City'
        };
        
        if (index === 0) {
          addLog('info', 'Shows Query', 'Sample formatted show data', formatted);
        }
        
        return formatted;
      });

      setResults(prev => ({ ...prev, shows: formattedShows }));
      addLog('success', 'Shows Query', `Successfully processed ${formattedShows.length} shows`);
      
    } catch (error) {
      addLog('error', 'Shows Query', `Query execution failed`, error);
    } finally {
      setLoading(null);
    }
  };

  const testArtistsQuery = async () => {
    setLoading('artists');
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, image_url, genres')
        .limit(5);

      if (error) throw error;

      setResults(prev => ({ ...prev, artists: data }));
      toast.success(`Found ${data?.length || 0} artists`);
    } catch (error) {
      console.error('Artists test error:', error);
      toast.error('Artists test failed');
    } finally {
      setLoading(null);
    }
  };

  const testUserArtistsQuery = async () => {
    setLoading('user_artists');
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser?.user) {
        toast.error('Please log in to test user artists');
        setLoading(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_artists')
        .select(`
          id,
          rank,
          artists!user_artists_artist_id_fkey (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', authUser.user.id)
        .limit(5);

      if (error) throw error;

      const formattedUserArtists = (data || []).map(item => ({
        id: item.id,
        rank: item.rank,
        artist_name: item.artists?.name || 'Unknown Artist',
        artist_image: item.artists?.image_url
      }));

      setResults(prev => ({ ...prev, user_artists: formattedUserArtists }));
      toast.success(`Found ${formattedUserArtists.length} user artists`);
    } catch (error) {
      console.error('User artists test error:', error);
      toast.error('User artists test failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Sync Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {loading === 'user_artists' ? 'Testing...' : 'Test User Artists Query'}
            </Button>
          </div>
          
          <Separator />
          
          {/* Display Results */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              {results.shows && (
                <div>
                  <Badge variant="secondary">Shows ({results.shows.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(results.shows, null, 2)}
                  </pre>
                </div>
              )}
              
              {results.artists && (
                <div>
                  <Badge variant="secondary">Artists ({results.artists.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(results.artists, null, 2)}
                  </pre>
                </div>
              )}
              
              {results.user_artists && (
                <div>
                  <Badge variant="secondary">User Artists ({results.user_artists.length})</Badge>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
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

export default DataSyncTests;
