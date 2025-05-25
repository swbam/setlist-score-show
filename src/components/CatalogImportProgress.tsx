
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Album, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ImportProgress } from '@/services/catalogImport';

interface CatalogImportProgressProps {
  progress: ImportProgress;
  className?: string;
}

export default function CatalogImportProgress({ progress, className }: CatalogImportProgressProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-cyan-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'starting':
        return 'Starting import...';
      case 'fetching_albums':
        return 'Fetching albums...';
      case 'processing_albums':
        return `Processing albums (${progress.processedAlbums}/${progress.totalAlbums})`;
      case 'importing_tracks':
        return `Importing tracks (${progress.importedTracks}/${progress.totalTracks})`;
      case 'completed':
        return 'Import completed!';
      case 'error':
        return `Error: ${progress.error}`;
      default:
        return 'Processing...';
    }
  };

  const getOverallProgress = () => {
    if (progress.status === 'completed') return 100;
    if (progress.status === 'error') return 0;
    
    const albumProgress = progress.totalAlbums > 0 ? (progress.processedAlbums / progress.totalAlbums) * 50 : 0;
    const trackProgress = progress.totalTracks > 0 ? (progress.importedTracks / progress.totalTracks) * 50 : 0;
    
    return albumProgress + trackProgress;
  };

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          {getStatusIcon()}
          Importing Catalog for {progress.artistName}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-gray-300">{Math.round(getOverallProgress())}%</span>
          </div>
          <Progress 
            value={getOverallProgress()} 
            className="h-2"
          />
        </div>

        {progress.status === 'processing_albums' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Album className="h-4 w-4" />
            <span>Albums: {progress.processedAlbums} / {progress.totalAlbums}</span>
          </div>
        )}

        {progress.status === 'importing_tracks' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Music className="h-4 w-4" />
            <span>Tracks: {progress.importedTracks} / {progress.totalTracks}</span>
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Successfully imported {progress.importedTracks} tracks</span>
            </div>
          </div>
        )}

        {progress.status === 'error' && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <div className="text-red-400 text-sm">
              {progress.error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
