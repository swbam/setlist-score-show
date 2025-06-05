import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { songId, showId, setlistSongId, userId } = body

    // Validate input
    if (!songId || !showId || !setlistSongId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check vote limits
    const { data: existingVotes, error: voteLimitError } = await supabase
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

    if (existingVotes && existingVotes.length >= 10) {
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

    // Create vote
    const { data: vote, error: voteError } = await supabase
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

    // Update vote count
    const { data: updatedSong, error: updateError } = await supabase
      .from('setlist_songs')
      .update({ 
        vote_count: supabase.raw('vote_count + 1')
      })
      .eq('id', setlistSongId)
      .select()
      .single()

    if (updateError) {
      console.error('Vote count update error:', updateError)
      // Try to rollback the vote
      await supabase.from('votes').delete().eq('id', vote.id)
      return NextResponse.json(
        { error: 'Failed to update vote count' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      voteId: vote.id,
      newVoteCount: updatedSong.vote_count,
      votesRemaining: {
        show: 10 - (existingVotes?.length || 0) - 1,
        daily: 50 // This would need proper calculation
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