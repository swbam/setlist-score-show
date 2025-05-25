import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import * as setlistImportService from "@/services/setlistImport";
import AppHeader from "@/components/AppHeader";

interface Show {
  id: string;
  artist_id: string;
  artist: {
    name: string;
  };
  venue: {
    name: string;
    city: string;
    state: string | null;
    country: string;
  };
  name: string | null;
  date: string;
}

interface SetlistSong {
  id: string;
  position: number;
  song: {
    id: string;
    name: string;
    album: string;
  };
}

interface PlayedSetlistSong {
  id: string;
  position: number;
  song: {
    id: string;
    name: string;
    album: string;
  };
}

interface ComparisonData {
  show: Show | null;
  votedSetlist: SetlistSong[];
  playedSetlist: PlayedSetlistSong[];
  matchPercentage: number;
}

const SetlistComparison = () => {
  const { showId } = useParams<{ showId: string }>();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [comparison, setComparison] = useState<ComparisonData>({
    show: null,
    votedSetlist: [],
    playedSetlist: [],
    matchPercentage: 0
  });

  // Create URL-friendly slug
  const createSlug = (text: string | null | undefined) => {
    if (!text) return 'untitled';
    
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const fetchComparisonData = async () => {
    if (!showId) return;
    
    try {
      setLoading(true);
      
      // Get show data
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(name),
          venue:venues(name, city, state, country)
        `)
        .eq('id', showId)
        .single();
        
      if (showError) {
        console.error("Error fetching show:", showError);
        toast.error("Failed to load show details");
        return;
      }
      
      // Get voted setlist
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .single();
        
      if (setlistError && setlistError.code !== 'PGRST116') { // Not found error
        console.error("Error fetching setlist:", setlistError);
      }
      
      let votedSongs: SetlistSong[] = [];
      
      if (setlistData) {
        // Get voted songs
        const { data: votedSongsData } = await supabase
          .from('setlist_songs')
          .select(`
            id,
            position,
            song:songs(id, name, album)
          `)
          .eq('setlist_id', setlistData.id)
          .order('position');
          
        if (votedSongsData) {
          votedSongs = votedSongsData;
        }
      }
      
      // Get played setlist using our service
      const { playedSetlist, songs: playedSongs } = await setlistImportService.getPlayedSetlistForShow(showId);
      
      // Calculate match percentage
      let matchPercentage = 0;
      if (votedSongs.length && playedSongs.length) {
        const votedSongIds = new Set(votedSongs.map(s => s.song.id));
        const matches = playedSongs.filter(s => s.song && votedSongIds.has(s.song.id)).length;
        matchPercentage = Math.round((matches / playedSongs.length) * 100);
      }
      
      setComparison({
        show: showData,
        votedSetlist: votedSongs,
        playedSetlist: playedSongs.map(ps => ({
          id: ps.song?.id || '',
          position: ps.position,
          song: ps.song || { id: '', name: 'Unknown Song', album: 'Unknown Album' }
        })),
        matchPercentage
      });
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [showId]);

  // Handle importing setlist from setlist.fm
  const handleImportSetlist = async () => {
    if (!showId) return;
    
    setImporting(true);
    try {
      const result = await setlistImportService.importPlayedSetlistForShow(showId);
      
      if (result.success) {
        if (result.songsImported && result.songsImported > 0) {
          toast.success(`Successfully imported ${result.songsImported} songs from setlist.fm`);
          // Refresh the comparison data
          await fetchComparisonData();
        } else if (result.error === "Setlist already imported") {
          toast.info("Setlist has already been imported");
        } else {
          toast.error(result.error || "No songs found in the setlist");
        }
      } else {
        toast.error(result.error || "Failed to import setlist");
      }
    } catch (error) {
      console.error("Error importing setlist:", error);
      toast.error("An error occurred while importing");
    } finally {
      setImporting(false);
    }
  };

  // Check if song from voted setlist was played
  const wasPlayed = (songId: string) => {
    return comparison.playedSetlist.some(s => s.song.id === songId);
  };

  // Check if song from played setlist was predicted
  const wasPredicted = (songId: string) => {
    return comparison.votedSetlist.some(s => s.song.id === songId);
  };

  const { show, votedSetlist, playedSetlist, matchPercentage } = comparison;
  
  // Check if show date has passed
  const showDatePassed = show ? new Date(show.date) < new Date() : false;
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header */}
      <div className="relative bg-gradient-to-br from-cyan-600/20 to-blue-600/20 py-12">
        <div className="absolute inset-0 bg-black/50" />
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <Link 
            to={show ? `/artists/${show.artist_id}/${createSlug(show.artist?.name)}` : '/'}
            className="text-gray-300 hover:text-white inline-block mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline-block" />
            Back to artist
          </Link>
          
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-1/3 bg-gray-800 rounded"></div>
              <div className="h-4 w-1/4 bg-gray-800 rounded"></div>
            </div>
          ) : show ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {show.artist?.name}
              </h1>
              <div className="flex items-center text-gray-300">
                <CalendarDays className="h-5 w-5 mr-2 text-cyan-400" />
                {format(new Date(show.date), 'EEEE, MMMM d, yyyy')}
                <span className="mx-2">•</span>
                {show.venue?.name}, {show.venue?.city}
              </div>
            </>
          ) : (
            <h1 className="text-3xl font-bold text-white">Show Not Found</h1>
          )}
        </div>
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Accuracy Card */}
            <Card className="bg-gray-900 border-gray-800 mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="text-center md:text-left mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-white mb-2">Setlist Prediction Accuracy</h2>
                    <p className="text-gray-400">
                      Compare fan votes against what was actually played
                    </p>
                  </div>
                  
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-800"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-cyan-500"
                        strokeWidth="10"
                        strokeDasharray={`${matchPercentage * 2.51} 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{matchPercentage}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Voted Setlist */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">
                    Fan-Voted Setlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {votedSetlist.length > 0 ? (
                    <ul className="space-y-4">
                      {votedSetlist.map((song, index) => (
                        <li
                          key={song.id}
                          className={`flex items-center justify-between p-3 rounded-md ${
                            wasPlayed(song.song.id) 
                              ? 'bg-green-900/20 border border-green-900'
                              : 'bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg font-medium text-gray-400 w-8">
                              {index + 1}.
                            </span>
                            <div>
                              <h4 className="text-white font-medium">{song.song.name}</h4>
                              <p className="text-sm text-gray-400">{song.song.album}</p>
                            </div>
                          </div>
                          {wasPlayed(song.song.id) && (
                            <Check className="h-5 w-5 text-green-400" />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No fan votes for this show
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Played Setlist */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">
                    Actual Setlist
                  </CardTitle>
                  {showDatePassed && playedSetlist.length === 0 && (
                    <Button
                      size="sm"
                      onClick={handleImportSetlist}
                      disabled={importing}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Import from setlist.fm
                        </>
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {playedSetlist.length > 0 ? (
                    <ul className="space-y-4">
                      {playedSetlist.map((song, index) => (
                        <li
                          key={`played-${index}`}
                          className={`flex items-center justify-between p-3 rounded-md ${
                            wasPredicted(song.song.id) 
                              ? 'bg-green-900/20 border border-green-900'
                              : 'bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg font-medium text-gray-400 w-8">
                              {index + 1}.
                            </span>
                            <div>
                              <h4 className="text-white font-medium">{song.song.name}</h4>
                              <p className="text-sm text-gray-400">{song.song.album}</p>
                            </div>
                          </div>
                          {wasPredicted(song.song.id) ? (
                            <Check className="h-5 w-5 text-green-400" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      {showDatePassed ? (
                        <>
                          <p>No setlist data available yet</p>
                          <p className="text-sm mt-2">Click "Import from setlist.fm" to fetch the actual setlist</p>
                        </>
                      ) : (
                        <p>Show hasn't occurred yet</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8 text-center">
              {show && (
                <Button
                  onClick={() => window.history.back()}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Show
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetlistComparison;
