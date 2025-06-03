'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Users, 
  Music, 
  Calendar,
  TrendingUp,
  Settings,
  Database,
  RefreshCw
} from 'lucide-react';
import { GlobalMetrics } from '@/components/admin/GlobalMetrics';
import { DataSync } from '@/components/admin/DataSync';
import { UserManagement } from '@/components/admin/UserManagement';
import { ShowManagement } from '@/components/admin/ShowManagement';
import { SystemHealth } from '@/components/admin/SystemHealth';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }

    if (user && !isAdmin) {
      router.push('/');
      return;
    }

    setLoading(false);
  }, [user, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage your Setlist Score Show platform</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Data Sync
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="shows" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Shows
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GlobalMetrics />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickStatCard
              title="Total Users"
              value="12,543"
              change="+12.5%"
              icon={Users}
            />
            <QuickStatCard
              title="Active Shows"
              value="847"
              change="+8.3%"
              icon={Calendar}
            />
            <QuickStatCard
              title="Total Votes"
              value="458K"
              change="+23.1%"
              icon={TrendingUp}
            />
            <QuickStatCard
              title="Artists"
              value="3,291"
              change="+5.7%"
              icon={Music}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivityList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <DataSync />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="shows" className="space-y-6">
          <ShowManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickStatCard({ 
  title, 
  value, 
  change, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  icon: any;
}) {
  const isPositive = change.startsWith('+');
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8 text-teal-500" />
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {change}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-gray-400">{title}</p>
      </CardContent>
    </Card>
  );
}

function RecentActivityList() {
  const activities = [
    {
      id: 1,
      type: 'vote',
      message: 'User voted on "Bohemian Rhapsody" for Queen at Madison Square Garden',
      time: '2 minutes ago'
    },
    {
      id: 2,
      type: 'sync',
      message: 'Successfully synced 45 new shows from Ticketmaster',
      time: '15 minutes ago'
    },
    {
      id: 3,
      type: 'user',
      message: 'New user registration: john.doe@example.com',
      time: '1 hour ago'
    },
    {
      id: 4,
      type: 'error',
      message: 'Failed to sync Spotify catalog for artist: The Beatles',
      time: '2 hours ago'
    }
  ];

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50">
          <div className={`w-2 h-2 rounded-full mt-2 ${
            activity.type === 'error' ? 'bg-red-500' : 'bg-teal-500'
          }`} />
          <div className="flex-1">
            <p className="text-sm">{activity.message}</p>
            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}