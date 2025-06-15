// deno-lint-ignore-file
// @ts-nocheck

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

interface StepResult {
  name: string
  status: number
  duration: number
  ok: boolean
  error?: string
}

serve(async (req) => {
  const start = Date.now()

  // CORS pre-flight
  const cors = handleCors(req)
  if (cors) return cors

  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(
      JSON.stringify({ success: false, message: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  if (!SUPABASE_URL || !cronSecret) {
    return new Response('Missing env SUPABASE_URL or CRON_SECRET', { status: 500 })
  }

  const steps = ['sync-top-shows', 'fetch-top-artists', 'sync-artists', 'calculate-trending']
  const results: StepResult[] = []

  for (const fn of steps) {
    const stepStart = Date.now()
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        }
      })
      const duration = Date.now() - stepStart
      if (!resp.ok) {
        const errText = await resp.text()
        results.push({ name: fn, status: resp.status, duration, ok: false, error: errText.slice(0, 200) })
        // Abort chain on failure
        return new Response(
          JSON.stringify({ success: false, failedStep: fn, results }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      results.push({ name: fn, status: resp.status, duration, ok: true })
      // Small delay to avoid rate-limiting cascades
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      results.push({ name: fn, status: 0, duration: Date.now() - stepStart, ok: false, error: String(err) })
      return new Response(
        JSON.stringify({ success: false, failedStep: fn, results }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  const total = Date.now() - start
  return new Response(
    JSON.stringify({ success: true, totalDuration: total, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}) 