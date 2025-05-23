
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import * as spotifyService from '@/services/spotify';
import * as ticketmasterService from '@/services/ticketmaster';
import * as setlistService from '@/services/setlist';
import * as trendingService from '@/services/trending';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Search } from 'lucide-react';

const DataSyncTests: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string>('');
  
  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
    console.log(message);
  };
  
  const logError = (message: string, error: any) => {
    const errorString = typeof error === 'object' ? 
      JSON.stringify(error, null, 2) : 
      String(error);
    
    console.error(message, error);
    addResult(`❌ ${message}: ${typeof error === 'object' && error.message ? error.message : errorString.substring(0, 100)}`);
    setDetailedError(errorString);
  };

  const clearResults = () => {
    setResults([]);
    setDetailedError(null);
  };

  const checkDatabaseState = async () => {
    addResult("Checking database state...");
    
    try {
      // Check if there are any artists in the database
      const { data: artistsCount, error: artistsError } = await supabase
        .from('artists')
        .select('id', { count: 'exact' });
      
      if (artistsError) {
        logError(`Error checking artists`, artistsError);
      } else {
        addResult(`Database has ${artistsCount?.length || 0} artists`);
      }
      
      // Check if there are any shows in the database
      const { data: showsCount, error: showsError } = await supabase
        .from('shows')
        .select('id', { count: 'exact' });
      
      if (showsError) {
        logError(`Error checking shows`, showsError);
      } else {
        addResult(`Database has ${showsCount?.length || 0} shows`);
      }
      
      // Check if there are any setlists in the database
      const { data: setlistsCount, error: setlistsError } = await supabase
        .from('setlists')
        .select('id', { count: 'exact' });
      
      if (setlistsError) {
        logError(`Error checking setlists`, setlistsError);
      } else {
        addResult(`Database has ${setlistsCount?.length || 0} setlists`);
        
        if (setlistsCount && setlistsCount.length > 0) {
          // Check if setlists have songs
          const { data: setlistSongsCount, error: setlistSongsError } = await supabase
            .from('setlist_songs')
            .select('id', { count: 'exact' });
          
          if (setlistSongsError) {
            logError(`Error checking setlist songs`, setlistSongsError);
          } else {
            addResult(`Database has ${setlistSongsCount?.length || 0} setlist songs`);
          }
        }
      }
      
      // Check if there are any venues in the database
      const { data: venuesCount, error: venuesError } = await supabase
        .from('venues')
        .select('id', { count: 'exact' });
      
      if (venuesError) {
        logError(`Error checking venues`, venuesError);
      } else {
        addResult(`Database has ${venuesCount?.length || 0} venues`);
      }
      
      // Check if there are any songs in the database
      const { data: songsCount, error: songsError } = await supabase
        .from('songs')
        .select('id', { count: 'exact' });
      
      if (songsError) {
        logError(`Error checking songs`, songsError);
      } else {
        addResult(`Database has ${songsCount?.length || 0} songs`);
      }
    } catch (error) {
      logError("Error checking database state", error);
    }
  };

  const testRLS = async () => {
    addResult("Testing RLS policies...");
    
    try {
      // Try to insert an artist
      const { error: artistError } = await supabase
        .from('artists')
        .insert({
          id: 'test_artist_id',
          name: 'Test Artist',
          last_synced_at: new Date().toISOString()
        });
      
      if (artistError) {
        logError("RLS test - Artist insertion failed", artistError);
        addResult("⚠️ RLS policies may be blocking insertions. Has the user been authenticated?");
      } else {
        addResult("✅ Artist inserted successfully");
        
        // Clean up the test artist
        const { error: deleteError } = await supabase
          .from('artists')
          .delete()
          .eq('id', 'test_artist_id');
          
        if (deleteError) {
          logError("Error cleaning up test artist", deleteError);
        }
      }
    } catch (error) {
      logError("RLS test error", error);
    }
  };
  
  const handleSearchArtist = async () => {
    if (!artistName.trim()) {
      toast.error("Please enter an artist name to search");
      return;
    }

    try {
      setLoading(true);
      clearResults();
      addResult("===== Starting Artist Sync Test =====");
      
      // Check database state first
      await checkDatabaseState();
      
      // Test RLS policies
      await testRLS();
      
      addResult("\n===== Spotify API Test =====");
      addResult(`Searching for ${artistName} on Spotify...`);
      
      const artists = await spotifyService.searchArtists(artistName);
      
      if (artists.length === 0) {
        addResult("❌ No artists found");
        toast.error("Artist not found on Spotify");
        return;
      }
      
      const artist = artists[0];
      addResult(`✅ Found artist: ${artist.name} (ID: ${artist.id})`);
      
      // Store artist in database
      addResult("Attempting to store artist in database...");
      const stored = await spotifyService.storeArtistInDatabase(artist);
      
      if (stored) {
        addResult(`✅ Stored artist in database`);
      } else {
        addResult(`❌ Failed to store artist in database (Check RLS policies or authentication)`);
        
        // Try to get the error from the database logs
        addResult("Details from database operations are logged in the console and error details panel");
      }
      
      // Get and store top tracks
      addResult(`\nImporting top tracks for ${artist.name}...`);
      const tracks = await spotifyService.getArtistTopTracks(artist.id);
      
      if (tracks.length === 0) {
        addResult(`❌ No tracks found for ${artist.name}`);
      } else {
        addResult(`✅ Found ${tracks.length} tracks for ${artist.name}`);
        
        // Store tracks
        addResult("Attempting to store tracks in database...");
        const tracksStored = await spotifyService.storeTracksInDatabase(artist.id, tracks);
        
        if (tracksStored) {
          addResult(`✅ Stored ${tracks.length} tracks in database`); 
        } else {
          addResult(`❌ Failed to store tracks in database (Check RLS policies or authentication)`);
        }
      }
      
      // Get shows
      addResult("\n===== Ticketmaster API Test =====");
      addResult(`Searching for ${artist.name} shows on Ticketmaster...`);
      const events = await ticketmasterService.getArtistEvents(artist.name);
      
      if (events.length === 0) {
        addResult(`❌ No events found for ${artist.name}`);
      } else {
        addResult(`✅ Found ${events.length} events for ${artist.name}`);
        
        // Store first event
        if (events.length > 0 && events[0]._embedded?.venues?.[0]) {
          const event = events[0];
          const venue = event._embedded.venues[0];
          
          addResult(`\nAttempting to store venue: ${venue.name}...`);
          const venueStored = await ticketmasterService.storeVenueInDatabase(venue);
          
          if (venueStored) {
            addResult(`✅ Stored venue: ${venue.name}`);
            
            addResult(`Attempting to store show: ${event.name}...`);
            const showStored = await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
            
            if (showStored) {
              addResult(`✅ Stored show: ${event.name}`);
              
              // Create setlist
              addResult(`\n===== Setlist Creation Test =====`);
              addResult(`Creating setlist for show: ${event.name}...`);
              const setlistId = await setlistService.getOrCreateSetlist(event.id);
              
              if (setlistId) {
                addResult(`✅ Created setlist with ID: ${setlistId}`);
                
                // Test fetching setlist
                addResult(`Fetching setlist details...`);
                const setlist = await setlistService.getSetlistWithSongs(setlistId);
                
                if (setlist) {
                  addResult(`✅ Fetched setlist with ${setlist.songs?.length || 0} songs`);
                  
                  if (setlist.songs && setlist.songs.length === 0) {
                    addResult(`⚠️ No songs in the setlist. Check createInitialSetlistSongs function`);
                  } else {
                    addResult(`✅ Setlist has ${setlist.songs?.length} songs`);
                  }
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
      }

      // Test trending shows
      addResult("\n===== Trending Shows Test =====");
      const trendingShows = await trendingService.getTrendingShows(10);
      
      if (trendingShows.length > 0) {
        addResult(`✅ Found ${trendingShows.length} trending shows`);
        trendingShows.forEach((show, i) => {
          addResult(`   ${i+1}. ${show.artist_name} - ${show.name} (${show.votes} votes)`);
        });
      } else {
        addResult(`❌ No trending shows found`);
        
        // Additional check - check if there are any shows with votes
        addResult(`Checking if there are shows with votes...`);
        const { data: showsWithSetlists, error: showsError } = await supabase
          .from('shows')
          .select(`
            id,
            name,
            artist_id,
            artists (name),
            setlists (
              id, 
              setlist_songs (id, votes)
            )
          `);
        
        if (showsError) {
          logError(`Error checking shows with setlists`, showsError);
        } else if (showsWithSetlists && showsWithSetlists.length > 0) {
          addResult(`Found ${showsWithSetlists.length} shows with setlists`);
          
          // Log the first few shows and their vote counts for debugging
          showsWithSetlists.slice(0, 3).forEach((show, i) => {
            let totalVotes = 0;
            if (show.setlists && Array.isArray(show.setlists)) {
              show.setlists.forEach(setlist => {
                if (setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
                  totalVotes += setlist.setlist_songs.reduce((sum, song) => sum + (song?.votes || 0), 0);
                }
              });
            }
            
            addResult(`   Show ${i+1}: ${show.artists?.name || 'Unknown'} - ${show.name || 'Unnamed'} (${totalVotes} votes)`);
          });
        } else {
          addResult(`No shows with setlists found`);
        }
      }
      
      toast.success("Test completed");
    } catch (error) {
      logError('Error running test', error);
      toast.error("Test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Data Sync Tests</h1>
      
      <div className="space-y-6">
        <div className="p-6 border border-gray-800 rounded-lg bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">Artist Sync Test</h2>
          <p className="text-gray-400 mb-6">
            This will test the complete data synchronization flow: search for the artist on Spotify, 
            store them in the database, get their top tracks, find shows on Ticketmaster, create setlists, 
            and check trending shows functionality.
          </p>
          
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <Input
                  placeholder="Enter artist name (e.g. Taylor Swift)"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={handleSearchArtist}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search & Sync Artist'}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={checkDatabaseState}
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Check Database State
              </Button>
              <Button 
                onClick={testRLS}
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Test RLS
              </Button>
              <Button 
                onClick={clearResults}
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Clear Results
              </Button>
            </div>
          </div>
          
          {loading && (
            <div className="mt-4 text-amber-500">
              Test is running. Please wait...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-800 rounded-lg bg-gray-900 min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Code className="h-5 w-5" />
              Test Results
            </h2>
            
            <ScrollArea className="h-[500px] pr-4">
              {results.length === 0 ? (
                <p className="text-gray-400">No results yet</p>
              ) : (
                <div className="space-y-2 text-sm font-mono">
                  {results.map((result, index) => {
                    // Check if it's a section header
                    if (result.startsWith("=====")) {
                      return (
                        <div key={index} className="border-t border-gray-700 pt-2 mt-2">
                          <div className="font-semibold text-amber-400">{result}</div>
                        </div>
                      );
                    }
                    
                    // Check if it's a new subsection (marked by newline)
                    if (result.startsWith("\n")) {
                      return (
                        <div key={index} className="mt-2">
                          <div>{result.substring(1)}</div>
                        </div>
                      );
                    }
                    
                    // Regular result line with appropriate styling
                    return (
                      <div 
                        key={index} 
                        className={`pl-2 ${
                          result.includes("✅") 
                            ? "border-l-2 border-green-500 text-green-300" 
                            : result.includes("❌") 
                              ? "border-l-2 border-red-500 text-red-300"
                              : result.includes("⚠️")
                                ? "border-l-2 border-amber-500 text-amber-300"  
                                : "border-l border-gray-700 text-gray-300"
                        }`}
                      >
                        {result}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="p-6 border border-gray-800 rounded-lg bg-gray-900 min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4">Error Details</h2>
            {detailedError ? (
              <ScrollArea className="h-[500px]">
                <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap bg-gray-950 p-4 rounded border border-red-800">
                  {detailedError}
                </pre>
              </ScrollArea>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-gray-500">
                <p>No errors to display</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border border-gray-800 rounded-lg bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">RLS Policy Information</h2>
          <p className="text-gray-400 mb-2">
            If you're seeing errors related to "violates row-level security policy", you likely need to:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Enable RLS (Row Level Security) policies for each table in the database</li>
            <li>Ensure the user is authenticated when making database write operations</li>
            <li>Check that appropriate permissions are set for anonymous access if needed</li>
          </ol>
          <div className="mt-4 p-4 bg-gray-950 rounded text-amber-400 border border-amber-900">
            <p className="font-semibold">Important:</p>
            <p className="mt-1 text-sm">
              For testing purposes, you may need to temporarily disable RLS or create policies that allow public access.
              Remember to secure your tables with proper RLS policies before deploying to production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSyncTests;
