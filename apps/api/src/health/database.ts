import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const start = performance.now();
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test database connectivity with a simple query
    const { data, error, count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const responseTime = performance.now() - start;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      metrics: {
        totalUsers: count || 0,
        connectionTime: responseTime
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
}
