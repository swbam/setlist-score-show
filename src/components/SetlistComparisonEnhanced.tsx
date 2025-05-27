import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Music, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getSetlistComparison, 
  importSetlistForShow, 
  hasImportedSetlist,
  SetlistComparisonData 
} from '@/services/setlistImportService';

interface SetlistComparisonEnhancedProps {
  showId: string;
  artistName: string;
  showDate: string;
  venueName: string;
}

export function SetlistComparisonEnhanced({ 
  showId, 
  artistName, 
  showDate, 
  venueName 
}: SetlistComparisonEnhancedProps) {
  const [comparisonData, setComparisonData] = useState<SetlistComparisonData | null>(null);
  const [hasSetlist, setHasSetlist] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAndLoadData();
  }, [showId]);

  const checkAndLoadData = async () => {
    setLoading(true);
    try {
      const imported = await hasImportedSetlist(showId);
      setHasSetlist(imported);

      if (imported) {
        const data = await getSetlistComparison(showId);
        setComparisonData(data);
      }
    } catch (error) {
      console.error('Error loading setlist data:', error);
      toast({
        title: "Error",
        description: "Failed to load setlist data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSetlist = async () => {
    setIsImporting(true);
    try {
      const result = await importSetlistForShow(showId, artistName, showDate);
      
      if (result.success) {
        toast({
          title: "Import Successful!",
          description: `Imported ${result.matchedSongs}/${result.totalSongs} songs`,
        });
        await checkAndLoadData();
      } else {
        toast({
          title: "Import Failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import setlist",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Setlist Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasSetlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Setlist Comparison
          </CardTitle>
          <CardDescription>
            Compare fan predictions with the actual setlist from {artistName} at {venueName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Setlist Available</h3>
            <p className="text-gray-600 mb-4">
              The actual setlist for this show hasn't been imported yet.
            </p>
            <Button 
              onClick={handleImportSetlist}
              disabled={isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Import from setlist.fm
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load setlist comparison data.</p>
        </CardContent>
      </Card>
    );
  }

  const { predictedSongs, actualSongs, accuracy } = comparisonData;

  return (
    <div className="space-y-6">
      {/* Accuracy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prediction Accuracy
          </CardTitle>
          <CardDescription>
            How well did fans predict the setlist?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {accuracy.accuracyPercentage}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {accuracy.exactMatches}
              </div>
              <div className="text-sm text-gray-600">Exact Matches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {accuracy.totalPredicted}
              </div>
              <div className="text-sm text-gray-600">Predicted Songs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {accuracy.totalActual}
              </div>
              <div className="text-sm text-gray-600">Actual Songs</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prediction Accuracy</span>
              <span>{accuracy.accuracyPercentage}%</span>
            </div>
            <Progress value={accuracy.accuracyPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Song-by-Song Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="predicted" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="predicted" className="gap-2">
                <Users className="h-4 w-4" />
                Fan Predictions ({predictedSongs.length})
              </TabsTrigger>
              <TabsTrigger value="actual" className="gap-2">
                <Music className="h-4 w-4" />
                Actual Setlist ({actualSongs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="predicted" className="space-y-3">
              {predictedSongs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No predictions available</p>
              ) : (
                predictedSongs.map((song, index) => {
                  const wasPlayed = actualSongs.some(actual => actual.id === song.id);
                  return (
                    <div 
                      key={song.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        wasPlayed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{song.name}</div>
                          <div className="text-sm text-gray-600">
                            {song.votes} votes
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {wasPlayed ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Played
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Played
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
            
            <TabsContent value="actual" className="space-y-3">
              {actualSongs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No actual setlist available</p>
              ) : (
                actualSongs.map((song) => (
                  <div 
                    key={song.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      song.matched ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-500">
                        #{song.position}
                      </div>
                      <div className="font-medium">{song.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {song.matched ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Predicted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Surprise
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}