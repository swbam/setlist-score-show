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

    // Check vote limits - only for authenticated users
    let existingVotes: any[] = []
    if (userId) {
      const { data: votes, error: voteLimitError } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('show_id', showId)

      if (voteLimitError) {
        console.error('Vote limit check error:', voteLimitError)
        return NextResponse.json(
          { error: 'Failed to check vote limits' },
          { status: 500 }
        )
      }

      existingVotes = votes || []

      if (existingVotes.length >= 10) {
        return NextResponse.json(
          { error: 'Vote limit reached for this show' },
          { status: 400 }
        )
      }

      // Check if already voted for this song
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('setlist_song_id', setlistSongId)
        .single()

      if (existingVote) {
        return NextResponse.json(
          { error: 'Already voted for this song' },
          { status: 400 }
        )
      }
    }

    // Create vote - for anonymous users, we don't store in votes table, just update count
    let vote = null
    if (userId) {
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .insert({
          user_id: userId,
          setlist_song_id: setlistSongId,
          show_id: showId,
          vote_type: 'up',
        })
        .select()
        .single()

      if (voteError) {
        console.error('Vote creation error:', voteError)
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        )
      }
      vote = voteData
    }

    // Update vote count using RPC function
    const { error: updateError } = await supabase.rpc('increment_vote_count', {
      setlist_song_id: setlistSongId
    })

    if (updateError) {
      console.error('RPC error, using manual update:', updateError)
      // Fallback to manual update
      const { data: currentSong } = await supabase
        .from('setlist_songs')
        .select('vote_count')
        .eq('id', setlistSongId)
        .single()

      const newCount = (currentSong?.vote_count || 0) + 1
      
      const { data: updatedSong, error: manualUpdateError } = await supabase
        .from('setlist_songs')
        .update({ vote_count: newCount })
        .eq('id', setlistSongId)
        .select()
        .single()

      if (manualUpdateError) {
        console.error('Manual vote count update error:', manualUpdateError)
        // Try to rollback the vote for authenticated users
        if (vote?.id) {
          await supabase.from('votes').delete().eq('id', vote.id)
        }
        return NextResponse.json(
          { error: 'Failed to update vote count' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        voteId: vote?.id || null,
        newVoteCount: updatedSong.vote_count,
        votesRemaining: userId ? {
          show: 10 - (existingVotes?.length || 0) - 1,
          daily: 50
        } : {
          show: 3,
          daily: 3
        }
      })
    }

    // Get updated vote count
    const { data: updatedSong, error: fetchError } = await supabase
      .from('setlist_songs')
      .select('vote_count')
      .eq('id', setlistSongId)
      .single()

    if (fetchError) {
      console.error('Fetch vote count error:', fetchError)
      // Default to assuming count was incremented
      return NextResponse.json({
        success: true,
        voteId: vote?.id || null,
        newVoteCount: 1,
        votesRemaining: userId ? {
          show: 10 - (existingVotes?.length || 0) - 1,
          daily: 50
        } : {
          show: 3,
          daily: 3
        }
      })
    }

    return NextResponse.json({
      success: true,
      voteId: vote?.id || null,
      newVoteCount: updatedSong.vote_count,
      votesRemaining: userId ? {
        show: 10 - (existingVotes?.length || 0) - 1,
        daily: 50 // This would need proper calculation
      } : {
        show: 3,
        daily: 3
      }
    })
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}