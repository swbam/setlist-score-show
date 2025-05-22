
import { TrendingUp, Clock } from "lucide-react";

const VotingStats = () => {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
        Voting Stats
      </h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Total Votes</span>
            <span className="text-white font-medium">0</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Free votes (3/3)</span>
            <span className="text-cyan-400 font-medium">1/3</span>
          </div>
          <div className="text-xs text-gray-400">Log in for more</div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Voting Closes In</span>
          </div>
          <div className="text-cyan-400 font-medium">2d 14h</div>
        </div>

        <div className="text-xs text-gray-400 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          127 fans have voted
        </div>
      </div>
    </div>
  );
};

export default VotingStats;
