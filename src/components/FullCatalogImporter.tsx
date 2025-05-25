
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Info } from 'lucide-react';
import { toast } from "sonner";
import { importFullArtistCatalog, getArtistImportStats, ImportProgress } from '@/services/catalogImport';
import CatalogImportProgress from './CatalogImportProgress';

interface FullCatalogImporterProps {
  artistId: string;
  artistName: string;
  onImportComplete?: (totalTracks: number) => void;
}

export default function FullCatalogImporter({ artistId, artistName, onImportComplete }: FullCatalogImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importStats, setImportStats] = useState<{
    totalSongs: number;
    lastImported: string | null;
    needsUpdate: boolean;
  } | null>(null);

  const handleGetStats = async () => {
    const stats = await getArtistImportStats(artistId);
    setImportStats(stats);
  };

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    setProgress(null);
    
    try {
      const result = await importFullArtistCatalog(artistId, (progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      if (result.success) {
        toast.success(`Successfully imported ${result.totalTracksImported} tracks for ${artistName}`);
        onImportComplete?.(result.totalTracksImported);
        
        // Update stats after successful import
        await handleGetStats();
      } else {
        toast.error(`Failed to import catalog: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import catalog');
    } finally {
      setIsImporting(false);
    }
  };

  React.useEffect(() => {
    if (isDialogOpen) {
      handleGetStats();
    }
  }, [isDialogOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Import Full Catalog
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Import Full Song Catalog</DialogTitle>
          <DialogDescription className="text-gray-400">
            Import the complete discography for {artistName} from Spotify
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {importStats && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Songs in database:</span>
                  <span className="text-white">{importStats.totalSongs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last imported:</span>
                  <span className="text-white">
                    {importStats.lastImported 
                      ? new Date(importStats.lastImported).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${importStats.needsUpdate ? 'text-yellow-400' : 'text-green-400'}`}>
                    {importStats.needsUpdate ? 'Needs Update' : 'Up to Date'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {progress && (
            <CatalogImportProgress progress={progress} />
          )}

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">What this does:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Fetches all albums and singles from Spotify</li>
              <li>• Imports complete track listings with metadata</li>
              <li>• Provides more songs for setlist voting</li>
              <li>• May take several minutes for large catalogs</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : 'Start Full Import'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isImporting}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
