'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Music, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

export function GlobalMetrics() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'metrics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/admin/metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-800" />
            <CardContent className="h-64 bg-gray-800/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Platform Metrics</h2>
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-500" />
              Voting Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics?.votingActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-500" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics?.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#0891b2" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-teal-500" />
              Top Voted Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics?.topArtists || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar 
                  dataKey="votes" 
                  fill="#14b8a6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-500" />
              Show Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricRow label="Upcoming Shows" value={metrics?.showStats?.upcoming || 0} />
              <MetricRow label="Ongoing Shows" value={metrics?.showStats?.ongoing || 0} />
              <MetricRow label="Completed Shows" value={metrics?.showStats?.completed || 0} />
              <MetricRow label="Total Shows" value={metrics?.showStats?.total || 0} />
              <div className="pt-4 border-t border-gray-700">
                <MetricRow 
                  label="Shows Added Today" 
                  value={metrics?.showStats?.addedToday || 0}
                  highlight
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LiveMetric 
              label="Active Users" 
              value={metrics?.realtime?.activeUsers || 0}
              suffix="online now"
            />
            <LiveMetric 
              label="Votes/min" 
              value={metrics?.realtime?.votesPerMinute || 0}
              suffix="current rate"
            />
            <LiveMetric 
              label="Page Views" 
              value={metrics?.realtime?.pageViews || 0}
              suffix="last hour"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: number; 
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-lg font-semibold ${
        highlight ? 'text-teal-400' : 'text-white'
      }`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function LiveMetric({ 
  label, 
  value, 
  suffix 
}: { 
  label: string; 
  value: number; 
  suffix: string;
}) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-teal-400">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      <p className="text-xs text-gray-500">{suffix}</p>
    </div>
  );
}