import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Database, Zap, Activity } from 'lucide-react';
import { errorHandler } from '@/services/errorHandling';
import { getJobMetrics } from '@/services/backgroundJobs';
import { cacheService } from '@/services/cacheService';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'unhealthy';
  database: string;
  cache: {
    status: string;
    stats: any;
  };
  jobs: {
    status: string;
    successRate: number;
    metrics: any;
  };
  errors: {
    status: string;
    stats: any;
  };
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  dbConnections: number;
  memoryUsage: number;
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Gather system health data
      const errorStats = errorHandler.getErrorStats();
      const jobMetrics = getJobMetrics();
      const cacheStats = cacheService.getStats();
      
      // Mock health status (in real app this would come from health check service)
      const health: SystemHealth = {
        overall: 'healthy',
        database: 'healthy',
        cache: {
          status: Object.values(cacheStats).every((stat: any) => stat.usage < 90) ? 'healthy' : 'warning',
          stats: cacheStats
        },
        jobs: {
          status: jobMetrics.totalJobs > 0 && (jobMetrics.successfulJobs / jobMetrics.totalJobs) > 0.8 ? 'healthy' : 'warning',
          successRate: jobMetrics.totalJobs > 0 ? (jobMetrics.successfulJobs / jobMetrics.totalJobs) * 100 : 100,
          metrics: jobMetrics
        },
        errors: {
          status: errorStats.lastHour < 10 ? 'healthy' : errorStats.lastHour < 50 ? 'warning' : 'unhealthy',
          stats: errorStats
        }
      };

      // Mock performance metrics (in real app this would come from monitoring service)
      const metrics: PerformanceMetrics = {
        responseTime: 150 + Math.random() * 100, // ms
        throughput: 85 + Math.random() * 30, // requests/second
        errorRate: Math.random() * 2, // percentage
        cacheHitRate: 85 + Math.random() * 10, // percentage
        dbConnections: 5 + Math.floor(Math.random() * 10),
        memoryUsage: 65 + Math.random() * 20 // percentage
      };

      setSystemHealth(health);
      setPerformanceMetrics(metrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number, decimals = 1) => {
    return num.toFixed(decimals);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading && !systemHealth) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={loadDashboardData} disabled={isLoading}>
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              {getStatusIcon(systemHealth.overall)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(systemHealth.overall)}>
                  {systemHealth.overall}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(systemHealth.database)}>
                  {systemHealth.database}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache System</CardTitle>
              <Zap className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className={getStatusColor(systemHealth.cache.status)}>
                  {systemHealth.cache.status}
                </Badge>
                <div className="text-xs text-gray-600">
                  {Object.keys(systemHealth.cache.stats).length} caches active
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Background Jobs</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className={getStatusColor(systemHealth.jobs.status)}>
                  {systemHealth.jobs.status}
                </Badge>
                <div className="text-xs text-gray-600">
                  {formatNumber(systemHealth.jobs.successRate)}% success rate
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(performanceMetrics.responseTime)}ms
              </div>
              <div className="text-sm text-gray-600">
                Average response time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(performanceMetrics.throughput)}/s
              </div>
              <div className="text-sm text-gray-600">
                Requests per second
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(performanceMetrics.errorRate)}%
              </div>
              <div className="text-sm text-gray-600">
                Error percentage
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(performanceMetrics.cacheHitRate)}%
              </div>
              <div className="text-sm text-gray-600">
                Cache effectiveness
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DB Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {performanceMetrics.dbConnections}
              </div>
              <div className="text-sm text-gray-600">
                Active connections
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(performanceMetrics.memoryUsage)}%
              </div>
              <div className="text-sm text-gray-600">
                Memory utilization
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Metrics */}
      {systemHealth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Background Job Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Jobs</div>
                    <div className="text-xl font-semibold">{systemHealth.jobs.metrics.totalJobs}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Successful</div>
                    <div className="text-xl font-semibold text-green-600">{systemHealth.jobs.metrics.successfulJobs}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Failed</div>
                    <div className="text-xl font-semibold text-red-600">{systemHealth.jobs.metrics.failedJobs}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avg Time</div>
                    <div className="text-xl font-semibold">{formatNumber(systemHealth.jobs.metrics.avgProcessingTime)}ms</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Error Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Last Hour</div>
                    <div className="text-xl font-semibold">{systemHealth.errors.stats.lastHour}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Day</div>
                    <div className="text-xl font-semibold">{systemHealth.errors.stats.lastDay}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-semibold">{systemHealth.errors.stats.total}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Critical</div>
                    <div className="text-xl font-semibold text-red-600">{systemHealth.errors.stats.criticalErrors}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Details */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(systemHealth.cache.stats).map(([cacheType, stats]: [string, any]) => (
                <div key={cacheType} className="border rounded-lg p-4">
                  <div className="font-medium capitalize mb-2">{cacheType} Cache</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{stats.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span>{stats.maxSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span>{formatNumber(stats.usage)}%</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stats.usage > 80 ? 'bg-red-500' : stats.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stats.usage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitoringDashboard;
