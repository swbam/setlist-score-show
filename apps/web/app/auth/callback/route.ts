import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect')
  const action = requestUrl.searchParams.get('action')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    
    // If there's a specific redirect path, use it
    if (redirect) {
      const redirectUrl = new URL(redirect, requestUrl.origin)
      // Add action parameter if present
      if (action) {
        redirectUrl.searchParams.set('action', action)
      }
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Default redirect to home
  return NextResponse.redirect(requestUrl.origin)
}