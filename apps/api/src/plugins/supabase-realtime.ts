// src/plugins/supabase-realtime.ts
import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'

export const supabaseRealtimePlugin = fp(async (app) => {
  // Initialize Supabase admin client for server-side broadcasts
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  app.decorate('broadcast', async (channel: string, event: any) => {
    // Broadcast custom events to Supabase Realtime channels
    const { error } = await supabaseAdmin
      .channel(channel)
      .send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload
      })
    
    if (error) {
      app.log.error('Failed to broadcast event:', error)
    }
  })

  // Helper to track metrics in realtime
  app.decorate('trackRealtimeMetric', async (metric: string, value: number) => {
    await supabaseAdmin
      .channel('metrics')
      .send({
        type: 'broadcast',
        event: 'metric_update',
        payload: {
          metric,
          value,
          timestamp: new Date().toISOString()
        }
      })
  })

  app.log.info('Supabase Realtime plugin loaded')
})