'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Music2, 
  Calendar, 
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Trash2,
  Database
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export function DataSync() {
  const queryClient = useQueryClient();
  const [selectedArtist, setSelectedArtist] = useState('');

  const { data: syncStatus } = useQuery({
    queryKey: ['admin', 'sync', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sync/status');
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const { mutate: triggerSync, isPending: isSyncing } = useMutation({
    mutationFn: async ({ type, params }: { type: string; params?: any }) => {
      const response = await fetch('/api/admin/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params })
      });
      if (!response.ok) throw new Error('Failed to trigger sync');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sync'] });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Synchronization</h2>
        <p className="text-gray-400">Manage external data imports and synchronization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SyncCard
          title="Setlist.fm"
          description="Import concert setlists and historical data"
          icon={Music2}
          lastSync={syncStatus?.setlistfm?.lastSync}
          status={syncStatus?.setlistfm?.status}
          onSync={() => triggerSync({ type: 'setlistfm' })}
          isLoading={isSyncing}
        />
        
        <SyncCard
          title="Spotify"
          description="Sync artist catalogs and song metadata"
          icon={Calendar}
          lastSync={syncStatus?.spotify?.lastSync}
          status={syncStatus?.spotify?.status}
          onSync={() => triggerSync({ type: 'spotify' })}
          isLoading={isSyncing}
        />
        
        <SyncCard
          title="Ticketmaster"
          description="Import upcoming shows and venue data"
          icon={MapPin}
          lastSync={syncStatus?.ticketmaster?.lastSync}
          status={syncStatus?.ticketmaster?.status}
          onSync={() => triggerSync({ type: 'ticketmaster' })}
          isLoading={isSyncing}
        />
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manual">Manual Sync</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Specific Artist</CardTitle>
              <CardDescription>
                Import all data for a specific artist from all sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="artist-name">Artist Name</Label>
                  <Input
                    id="artist-name"
                    placeholder="e.g., Taylor Swift"
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => triggerSync({ 
                    type: 'artist', 
                    params: { artistName: selectedArtist } 
                  })}
                  disabled={!selectedArtist || isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Artist Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Run comprehensive sync operations across all data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => triggerSync({ type: 'trending' })}
                disabled={isSyncing}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Recalculate All Trending Scores
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => triggerSync({ type: 'cleanup' })}
                disabled={isSyncing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Up Orphaned Data
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => triggerSync({ type: 'refresh-materialized-views' })}
                disabled={isSyncing}
              >
                <Database className="w-4 h-4 mr-2" />
                Refresh Materialized Views
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Sync Jobs</CardTitle>
              <CardDescription>
                Configure automatic synchronization schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {syncStatus?.schedules?.map((schedule: any) => (
                  <ScheduleRow key={schedule.id} schedule={schedule} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SyncHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SyncCard({ 
  title, 
  description, 
  icon: Icon, 
  lastSync, 
  status,
  onSync,
  isLoading 
}: {
  title: string;
  description: string;
  icon: any;
  lastSync?: string;
  status?: 'running' | 'completed' | 'failed';
  onSync: () => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="w-8 h-8 text-teal-500" />
          <SyncStatusBadge status={status} />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lastSync && (
            <div className="text-sm text-gray-400">
              Last sync: {format(new Date(lastSync), 'MMM d, h:mm a')}
            </div>
          )}
          <Button
            onClick={onSync}
            disabled={isLoading || status === 'running'}
            className="w-full"
            variant={status === 'failed' ? 'destructive' : 'default'}
          >
            {status === 'running' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SyncStatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const config = {
    running: { icon: Clock, className: 'bg-blue-500/20 text-blue-400' },
    completed: { icon: CheckCircle2, className: 'bg-green-500/20 text-green-400' },
    failed: { icon: AlertCircle, className: 'bg-red-500/20 text-red-400' }
  };

  const { icon: Icon, className } = config[status as keyof typeof config] || config.completed;

  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}

function ScheduleRow({ schedule }: { schedule: any }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
      <div>
        <p className="font-medium">{schedule.name}</p>
        <p className="text-sm text-gray-400">{schedule.description}</p>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline">{schedule.schedule}</Badge>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </div>
    </div>
  );
}

function SyncHistoryTable() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['admin', 'sync', 'history'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sync/history');
      if (!response.ok) throw new Error('Failed to fetch sync history');
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sync Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
              <div className="flex items-center gap-3">
                <SyncStatusBadge status={item.status} />
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-sm text-gray-400">
                    {format(new Date(item.startedAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">{item.itemsProcessed} items</p>
                <p className="text-xs text-gray-400">{item.duration}ms</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}