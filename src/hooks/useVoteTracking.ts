
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canUserVote, getUserVoteStatsForShow, VoteValidationResult, VOTE_LIMITS } from '@/services/voteTracking';
import { useErrorHandler } from './useErrorHandler';

interface VoteTrackingState {
  canVote: boolean;
  votesRemaining: number;
  votesUsedThisShow: number;
  validationResult: VoteValidationResult | null;
  loading: boolean;
}

export function useVoteTracking(showId: string, setlistSongId?: string) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler({
    showToast: false,
    logError: true
  });

  const [state, setState] = useState<VoteTrackingState>({
    canVote: false,
    votesRemaining: 0,
    votesUsedThisShow: 0,
    validationResult: null,
    loading: true
  });

  useEffect(() => {
    async function checkVoteEligibility() {
      if (!user || !showId) {
        setState(prev => ({
          ...prev,
          canVote: false,
          loading: false,
          validationResult: {
            canVote: false,
            reason: 'Please log in to vote'
          }
        }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true }));

        // Get user's vote stats for this show
        const showStats = await getUserVoteStatsForShow(user.id, showId);
        
        let validationResult: VoteValidationResult = {
          canVote: true,
          votesRemaining: VOTE_LIMITS.MAX_VOTES_PER_SHOW - showStats.votes_this_show
        };

        // If we have a specific song, check if user can vote for it
        if (setlistSongId) {
          validationResult = await canUserVote(user.id, setlistSongId, showId);
        }

        setState({
          canVote: validationResult.canVote,
          votesRemaining: validationResult.votesRemaining || 0,
          votesUsedThisShow: showStats.votes_this_show,
          validationResult,
          loading: false
        });

      } catch (error) {
        handleError(error);
        setState(prev => ({
          ...prev,
          canVote: false,
          loading: false,
          validationResult: {
            canVote: false,
            reason: 'Unable to verify vote eligibility'
          }
        }));
      }
    }

    checkVoteEligibility();
  }, [user, showId, setlistSongId, handleError]);

  const refreshVoteStatus = async () => {
    if (!user || !showId) return;

    try {
      const showStats = await getUserVoteStatsForShow(user.id, showId);
      
      setState(prev => ({
        ...prev,
        votesUsedThisShow: showStats.votes_this_show,
        votesRemaining: VOTE_LIMITS.MAX_VOTES_PER_SHOW - showStats.votes_this_show
      }));
    } catch (error) {
      handleError(error);
    }
  };

  return {
    ...state,
    refreshVoteStatus,
    maxVotesPerShow: VOTE_LIMITS.MAX_VOTES_PER_SHOW
  };
}
