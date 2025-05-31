// services/voting.ts
import { supabase } from '@/integrations/supabase/client';
import { canUserVote } from './voteTracking';

export interface VoteResult {
  success: boolean;
  message: string;
  newVoteCount?: number;
}

export async function voteForSong(setlistSongId: string): Promise<VoteResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to vote'
      };
    }

    // Get show ID for vote validation
    const { data: setlistSong, error: songError } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        setlist:setlists!setlist_id(
          show_id
        )
      `)
      .eq('id', setlistSongId)
      .single();

    if (songError || !setlistSong) {
      return {
        success: false,
        message: 'Song not found'
      };
    }

    // Check if user can vote
    const validation = await canUserVote(user.id, setlistSongId, setlistSong.setlist.show_id);
    
    if (!validation.canVote) {
      return {
        success: false,
        message: validation.reason || 'Cannot vote at this time'
      };
    }

    // Submit vote using RPC function
    const { error: voteError } = await supabase.rpc('vote_for_song', {
      p_user_id: user.id,
      p_setlist_song_id: setlistSongId
    });

    if (voteError) {
      return {
        success: false,
        message: voteError.message
      };
    }

    // Get updated vote count
    const { data: updatedSong } = await supabase
      .from('setlist_songs')
      .select('votes')
      .eq('id', setlistSongId)
      .single();

    return {
      success: true,
      message: 'Vote recorded successfully!',
      newVoteCount: updatedSong?.votes || 0
    };

  } catch (error: any) {
    console.error('Error voting for song:', error);
    return {
      success: false,
      message: error.message || 'Failed to record vote'
    };
  }
}
