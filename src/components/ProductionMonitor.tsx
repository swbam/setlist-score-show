import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Wifi, 
  WifiOff,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string | number;
  lastChecked: Date;
  trend?: 'up' | 'down' | 'stable';
}

interface SystemHealth {
  database: HealthMetric;
  api: HealthMetric;
  spotify: HealthMetric;
  websockets: HealthMetric;
  memory: HealthMetric;
  responseTime: HealthMetric;
}

const ProductionMonitor = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>>([]);

  const addLog = useCallback((level: 'info' | 'warning' | 'error', message: string, details?: any) => {
    setLogs(prev => [{
      timestamp: new Date(),
      level,
      message,
      details
    }, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  const checkDatabaseHealth = async (): Promise<HealthMetric> => {
    const start = performance.now();
    try {
      // Simple health check - try to count users
      const response = await fetch('/api/health/database');
      const duration = performance.now() - start;
      
      if (response.ok) {
        addLog('info', `Database health check passed in ${duration.toFixed(2)}ms`);
        return {
          name: 'Database',
          status: duration > 1000 ? 'warning' : 'healthy',
          value: `${duration.toFixed(0)}ms`,
          lastChecked: new Date(),
          trend: duration > 1000 ? 'down' : 'stable'
        };
      } else {
        addLog('error', 'Database health check failed', { status: response.status });
        return {
          name: 'Database',
          status: 'error',
          value: 'Failed',
          lastChecked: new Date(),
          trend: 'down'
        };
      }
    } catch (error) {
      addLog('error', 'Database health check error', error);
      return {
        name: 'Database',
        status: 'error',
        value: 'Unreachable',
        lastChecked: new Date(),
        trend: 'down'
      };
    }
  };

  const checkAPIHealth = async (): Promise<HealthMetric> => {
    const start = performance.now();
    try {
      const response = await fetch('/api/health');
      const duration = performance.now() - start;
      
      if (response.ok) {
        addLog('info', `API health check passed in ${duration.toFixed(2)}ms`);
        return {
          name: 'API',
          status: duration > 500 ? 'warning' : 'healthy',
          value: `${duration.toFixed(0)}ms`,
          lastChecked: new Date(),
          trend: duration > 500 ? 'down' : 'stable'
        };
      } else {
        addLog('error', 'API health check failed', { status: response.status });
        return {
          name: 'API',
          status: 'error',
          value: 'Failed',
          lastChecked: new Date(),
          trend: 'down'
        };
      }
    } catch (error) {
      addLog('error', 'API health check error', error);
      return {
        name: 'API',
        status: 'error',
        value: 'Unreachable',
        lastChecked: new Date(),
        trend: 'down'
      };
    }
  };

  const checkSpotifyHealth = async (): Promise<HealthMetric> => {
    try {
      // Check if we can make a simple Spotify API call
      const response = await fetch('/api/health/spotify');
      
      if (response.ok) {
        const data = await response.json();
        addLog('info', 'Spotify API health check passed', data);
        return {
          name: 'Spotify API',
          status: 'healthy',
          value: 'Connected',
          lastChecked: new Date(),
          trend: 'stable'
        };
      } else {
        addLog('warning', 'Spotify API health check failed', { status: response.status });
        return {
          name: 'Spotify API',
          status: 'warning',
          value: 'Limited',
          lastChecked: new Date(),
          trend: 'down'
        };
      }
    } catch (error) {
      addLog('error', 'Spotify API health check error', error);
      return {
        name: 'Spotify API',
        status: 'error',
        value: 'Unreachable',
        lastChecked: new Date(),
        trend: 'down'
      };
    }
  };

  const checkWebSocketHealth = (): HealthMetric => {
    // Check WebSocket connection status
    const wsStatus = navigator.onLine ? 'Connected' : 'Offline';
    const status = navigator.onLine ? 'healthy' : 'error';
    
    addLog('info', `WebSocket status: ${wsStatus}`);
    
    return {
      name: 'WebSockets',
      status,
      value: wsStatus,
      lastChecked: new Date(),
      trend: 'stable'
    };
  };

  const checkMemoryUsage = (): HealthMetric => {
    // Get memory usage if available
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const percentage = Math.round((usedMB / totalMB) * 100);
      
      const status = percentage > 80 ? 'error' : percentage > 60 ? 'warning' : 'healthy';
      const trend = percentage > 70 ? 'up' : 'stable';
      
      addLog('info', `Memory usage: ${usedMB}MB / ${totalMB}MB (${percentage}%)`);
      
      return {
        name: 'Memory',
        status,
        value: `${percentage}%`,
        lastChecked: new Date(),
        trend
      };
    }
    
    return {
      name: 'Memory',
      status: 'healthy',
      value: 'N/A',
      lastChecked: new Date(),
      trend: 'stable'
    };
  };

  const runHealthChecks = async () => {
    addLog('info', 'Starting health checks...');
    setIsMonitoring(true);
    
    try {
      const [database, api, spotify, websockets, memory] = await Promise.all([
        checkDatabaseHealth(),
        checkAPIHealth(),
        checkSpotifyHealth(),
        Promise.resolve(checkWebSocketHealth()),
        Promise.resolve(checkMemoryUsage())
      ]);

      // Calculate average response time
      const avgResponseTime = [database, api].reduce((sum, metric) => {
        const time = typeof metric.value === 'string' && metric.value.endsWith('ms') 
          ? parseInt(metric.value) : 0;
        return sum + time;
      }, 0) / 2;

      const responseTime: HealthMetric = {
        name: 'Response Time',
        status: avgResponseTime > 750 ? 'warning' : 'healthy',
        value: `${avgResponseTime.toFixed(0)}ms`,
        lastChecked: new Date(),
        trend: avgResponseTime > 750 ? 'up' : 'stable'
      };

      setHealth({
        database,
        api,
        spotify,
        websockets,
        memory,
        responseTime
      });

      addLog('info', 'Health checks completed');
    } catch (error) {
      addLog('error', 'Health check failed', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  useEffect(() => {
    // Run initial health check
    runHealthChecks();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(runHealthChecks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
  };

  const getOverallHealth = () => {
    if (!health) return 'unknown';
    
    const metrics = Object.values(health);
    if (metrics.some(m => m.status === 'error')) return 'error';
    if (metrics.some(m => m.status === 'warning')) return 'warning';
    return 'healthy';
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="bg-gray-900/80 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Activity className="h-6 w-6 mr-2 text-yellow-metal-300" />
              System Health Monitor
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusIcon(overallHealth as any)}
              <Badge 
                variant={overallHealth === 'healthy' ? 'default' : 'destructive'}
                className={overallHealth === 'healthy' ? 'bg-green-600' : ''}
              >
                {overallHealth.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button 
              onClick={runHealthChecks}
              disabled={isMonitoring}
              className="bg-yellow-metal-600 hover:bg-yellow-metal-700"
            >
              {isMonitoring ? 'Checking...' : 'Run Health Check'}
            </Button>
            <span className="text-sm text-gray-400">
              Last updated: {health?.database.lastChecked.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health).map(([key, metric]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/80 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{metric.name}</h4>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-metal-300 mb-1">
                {metric.value}
              </div>
              <div className="text-xs text-gray-400">
                <Clock className="h-3 w-3 inline mr-1" />
                {metric.lastChecked.toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Logs */}
      <Card className="bg-gray-900/80 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center">
            <Info className="h-5 w-5 mr-2 text-yellow-metal-300" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity</p>
            ) : (
              logs.slice(0, 10).map((log, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 text-sm border-b border-gray-700 last:border-b-0 pb-2 last:pb-0"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.level === 'error' ? 'bg-red-500' :
                    log.level === 'warning' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white truncate">{log.message}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-gray-400 text-xs mt-1 whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionMonitor;
