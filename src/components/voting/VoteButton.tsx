import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoteButtonProps {
  songId: string;
  showId: string;
  currentVotes: number;
  hasVoted: boolean;
  position: number;
  onVote: (songId: string) => Promise<void>;
  disabled?: boolean;
}

export function VoteButton({ 
  songId, 
  showId, 
  currentVotes, 
  hasVoted, 
  position,
  onVote,
  disabled = false
}: VoteButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (hasVoted || isVoting || disabled) return;
    
    setIsVoting(true);
    try {
      await onVote(songId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: hasVoted || disabled ? 1 : 1.05 }}
      whileTap={{ scale: hasVoted || disabled ? 1 : 0.95 }}
      onClick={handleVote}
      disabled={hasVoted || isVoting || disabled}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
        hasVoted
          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
          : disabled
          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
          : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-teal-500/50"
      )}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        ) : (
          <>
            <ChevronUp className={cn(
              "w-5 h-5 transition-transform",
              hasVoted && "text-white",
              isVoting && "animate-pulse"
            )} />
            <span className="min-w-[3ch] text-center tabular-nums font-semibold">
              {currentVotes}
            </span>
            {!hasVoted && !disabled && (
              <span className="text-sm opacity-70">Vote</span>
            )}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}