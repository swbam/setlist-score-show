import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    const body = await request.json()
    const { songId, showId, setlistSongId, isAnonymous } = body
    
    // Get authenticated user (optional for anonymous voting)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // For anonymous voting, we don't require authentication
    const userId = user?.id || null
    const isUserAnonymous = isAnonymous || !userId

    // Validate input
    if (!songId || !showId || !setlistSongId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // No need for manual validation - the enhanced RPC function handles all validation

    // For authenticated users, use the enhanced voting function
    if (userId) {
      const { data: voteResult, error: voteError } = await supabase.rpc('increment_vote_count', {
        p_user_id: userId,
        p_setlist_song_id: setlistSongId,
        p_show_id: showId
      })

      if (voteError) {
        console.error('Enhanced vote function error:', voteError)
        return NextResponse.json(
          { error: 'Failed to process vote' },
          { status: 500 }
        )
      }

      const result = voteResult?.[0]
      if (!result?.success) {
        return NextResponse.json(
          { error: result?.message || 'Vote failed' },
          { status: 400 }
        )
      }

      // Get remaining votes for user
      const { data: voteStatus } = await supabase.rpc('can_user_vote_on_show', {
        p_user_id: userId,
        p_show_id: showId
      })

      const status = voteStatus?.[0]
      
      return NextResponse.json({
        success: true,
        newVoteCount: result.new_vote_count,
        votesRemaining: {
          show: status?.votes_remaining || 0,
          daily: 50 // This would need a separate calculation
        }
      })
    } else {
      // For anonymous users, just increment the count
      const { data: currentSong } = await supabase
        .from('setlist_songs')
        .select('vote_count')
        .eq('id', setlistSongId)
        .single()

      const newCount = (currentSong?.vote_count || 0) + 1
      
      const { data: updatedSong, error: updateError } = await supabase
        .from('setlist_songs')
        .update({ vote_count: newCount })
        .eq('id', setlistSongId)
        .select()
        .single()

      if (updateError) {
        console.error('Anonymous vote update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update vote count' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        newVoteCount: updatedSong.vote_count,
        votesRemaining: {
          show: 3, // Anonymous limit
          daily: 3
        }
      })
    }
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}