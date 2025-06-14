import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: Request) {
  const startTime = Date.now()

  // 🔒 simple auth check to ensure only the cron runner triggers this
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('🔄 Refreshing trending materialized views')

    const { error: err1 } = await supabase.rpc('refresh_trending_shows')
    if (err1) throw err1

    const { error: err2 } = await supabase.rpc('refresh_trending_shows_distinct')
    if (err2) throw err2

    const duration = Date.now() - startTime
    console.log(`✅ Trending views refreshed in ${duration}ms`)

    return new Response(
      JSON.stringify({ success: true, duration }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('💥 Error refreshing trending views', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 