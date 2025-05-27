import { supabase } from '@/integrations/supabase/client';

export interface VoteValidationResult {
  isValid: boolean;
  error?: string;
  dailyVotesUsed?: number;
  dailyVotesRemaining?: number;
  showVotesUsed?: number;
  showVotesRemaining?: number;
  canVote?: boolean;
}

export interface VoteContext {
  userId: string;
  setlistSongId: string;
  showId?: string;
}

/**
 * Comprehensive vote validation service with enhanced error handling
 */
export class VoteValidationService {
  private static readonly DAILY_VOTE_LIMIT = 50;
  private static readonly SHOW_VOTE_LIMIT = 10;

  /**
   * Validate if a user can vote for a specific song
   */
  static async validateVote(context: VoteContext): Promise<VoteValidationResult> {
    try {
      const { userId, setlistSongId } = context;

      // Check if user exists and is authenticated
      const userValidation = await this.validateUser(userId);
      if (!userValidation.isValid) {
        return userValidation;
      }

      // Check if user has already voted for this song
      const duplicateCheck = await this.checkDuplicateVote(userId, setlistSongId);
      if (!duplicateCheck.isValid) {
        return duplicateCheck;
      }

      // Get show ID if not provided
      let showId = context.showId;
      if (!showId) {
        showId = await this.getShowIdFromSetlistSong(setlistSongId);
        if (!showId) {
          return {
            isValid: false,
            error: 'Could not determine show for this song'
          };
        }
      }

      // Check daily vote limits
      const dailyLimitCheck = await this.checkDailyVoteLimit(userId);
      if (!dailyLimitCheck.isValid) {
        return dailyLimitCheck;
      }

      // Check show vote limits
      const showLimitCheck = await this.checkShowVoteLimit(userId, showId);
      if (!showLimitCheck.isValid) {
        return showLimitCheck;
      }

      // All validations passed
      return {
        isValid: true,
        canVote: true,
        dailyVotesUsed: dailyLimitCheck.dailyVotesUsed,
        dailyVotesRemaining: dailyLimitCheck.dailyVotesRemaining,
        showVotesUsed: showLimitCheck.showVotesUsed,
        showVotesRemaining: showLimitCheck.showVotesRemaining
      };

    } catch (error) {
      console.error('Vote validation error:', error);
      return {
        isValid: false,
        error: 'Validation failed due to system error'
      };
    }
  }

  /**
   * Validate user authentication and existence
   */
  private static async validateUser(userId: string): Promise<VoteValidationResult> {
    if (!userId) {
      return {
        isValid: false,
        error: 'Authentication required'
      };
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'User validation failed'
      };
    }
  }

  /**
   * Check if user has already voted for this song
   */
  private static async checkDuplicateVote(userId: string, setlistSongId: string): Promise<VoteValidationResult> {
    try {
      const { data: existingVote, error } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('setlist_song_id', setlistSongId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (existingVote) {
        return {
          isValid: false,
          error: 'You have already voted for this song'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Could not check existing votes'
      };
    }
  }

  /**
   * Check daily vote limit (50 votes per day)
   */
  private static async checkDailyVoteLimit(userId: string): Promise<VoteValidationResult> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: dailyVotes, error } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) throw error;

      const dailyVotesUsed = dailyVotes?.length || 0;
      const dailyVotesRemaining = Math.max(0, this.DAILY_VOTE_LIMIT - dailyVotesUsed);

      if (dailyVotesUsed >= this.DAILY_VOTE_LIMIT) {
        return {
          isValid: false,
          error: `Daily vote limit reached (${this.DAILY_VOTE_LIMIT} votes)`,
          dailyVotesUsed,
          dailyVotesRemaining: 0
        };
      }

      return {
        isValid: true,
        dailyVotesUsed,
        dailyVotesRemaining
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Could not check daily vote limit'
      };
    }
  }

  /**
   * Check show vote limit (10 votes per show)
   */
  private static async checkShowVoteLimit(userId: string, showId: string): Promise<VoteValidationResult> {
    try {
      // First get setlist IDs for this show
      const { data: setlists, error: setlistError } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId);

      if (setlistError) throw setlistError;

      if (!setlists || setlists.length === 0) {
        return {
          isValid: true,
          showVotesUsed: 0,
          showVotesRemaining: this.SHOW_VOTE_LIMIT
        };
      }

      const setlistIds = setlists.map(s => s.id);

      // Get setlist song IDs for these setlists
      const { data: setlistSongs, error: songsError } = await supabase
        .from('setlist_songs')
        .select('id')
        .in('setlist_id', setlistIds);

      if (songsError) throw songsError;

      if (!setlistSongs || setlistSongs.length === 0) {
        return {
          isValid: true,
          showVotesUsed: 0,
          showVotesRemaining: this.SHOW_VOTE_LIMIT
        };
      }

      const setlistSongIds = setlistSongs.map(s => s.id);

      // Get user votes for these songs
      const { data: showVotes, error: votesError } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .in('setlist_song_id', setlistSongIds);

      if (votesError) throw votesError;

      const showVotesUsed = showVotes?.length || 0;
      const showVotesRemaining = Math.max(0, this.SHOW_VOTE_LIMIT - showVotesUsed);

      if (showVotesUsed >= this.SHOW_VOTE_LIMIT) {
        return {
          isValid: false,
          error: `Show vote limit reached (${this.SHOW_VOTE_LIMIT} votes)`,
          showVotesUsed,
          showVotesRemaining: 0
        };
      }

      return {
        isValid: true,
        showVotesUsed,
        showVotesRemaining
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Could not check show vote limit'
      };
    }
  }

  /**
   * Get show ID from setlist song ID
   */
  private static async getShowIdFromSetlistSong(setlistSongId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          setlist:setlists(show_id)
        `)
        .eq('id', setlistSongId)
        .single();

      if (error || !data) return null;

      return (data.setlist as any)?.show_id || null;
    } catch (error) {
      console.error('Error getting show ID:', error);
      return null;
    }
  }

  /**
   * Get comprehensive vote statistics for a user
   */
  static async getUserVoteStats(userId: string, showId?: string): Promise<{
    dailyVotesUsed: number;
    dailyVotesRemaining: number;
    showVotesUsed: number;
    showVotesRemaining: number;
    userVotedSongs: string[];
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get daily votes
      const { data: dailyVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      const dailyVotesUsed = dailyVotes?.length || 0;
      const dailyVotesRemaining = Math.max(0, this.DAILY_VOTE_LIMIT - dailyVotesUsed);

      let showVotesUsed = 0;
      let userVotedSongs: string[] = [];

      if (showId) {
        // Get setlist IDs for this show
        const { data: setlists } = await supabase
          .from('setlists')
          .select('id')
          .eq('show_id', showId);

        if (setlists && setlists.length > 0) {
          const setlistIds = setlists.map(s => s.id);

          // Get setlist song IDs for these setlists
          const { data: setlistSongs } = await supabase
            .from('setlist_songs')
            .select('id')
            .in('setlist_id', setlistIds);

          if (setlistSongs && setlistSongs.length > 0) {
            const setlistSongIds = setlistSongs.map(s => s.id);

            // Get user votes for these songs
            const { data: showVotes } = await supabase
              .from('votes')
              .select('setlist_song_id')
              .eq('user_id', userId)
              .in('setlist_song_id', setlistSongIds);

            showVotesUsed = showVotes?.length || 0;
            userVotedSongs = showVotes?.map(v => v.setlist_song_id) || [];
          }
        }
      }

      const showVotesRemaining = Math.max(0, this.SHOW_VOTE_LIMIT - showVotesUsed);

      return {
        dailyVotesUsed,
        dailyVotesRemaining,
        showVotesUsed,
        showVotesRemaining,
        userVotedSongs
      };
    } catch (error) {
      console.error('Error getting user vote stats:', error);
      return {
        dailyVotesUsed: 0,
        dailyVotesRemaining: this.DAILY_VOTE_LIMIT,
        showVotesUsed: 0,
        showVotesRemaining: this.SHOW_VOTE_LIMIT,
        userVotedSongs: []
      };
    }
  }
}