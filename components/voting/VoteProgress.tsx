import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, Clock, Award } from 'lucide-react'

interface VoteProgressProps {
  showVotes: number
  dailyVotes: number
  uniqueVoters: number
  topSong?: {
    title: string
    votes: number
  }
  votingEndsAt?: Date
}

export function VoteProgress({ 
  showVotes, 
  dailyVotes, 
  uniqueVoters, 
  topSong,
  votingEndsAt 
}: VoteProgressProps) {
  const showVoteProgress = (showVotes / 10) * 100
  const dailyVoteProgress = (dailyVotes / 50) * 100

  const timeRemaining = votingEndsAt ? votingEndsAt.getTime() - Date.now() : null
  const daysRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60 * 24)) : null
  const hoursRemaining = timeRemaining ? Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Show votes progress */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
            Show Votes
            <Badge variant="secondary" className="bg-gray-800">
              {showVotes}/10
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={showVoteProgress} className="h-2 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">
            {10 - showVotes} votes remaining for this show
          </p>
        </CardContent>
      </Card>

      {/* Daily votes progress */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
            Daily Limit
            <Badge variant="secondary" className="bg-gray-800">
              {dailyVotes}/50
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={dailyVoteProgress} className="h-2 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">
            {50 - dailyVotes} votes remaining today
          </p>
        </CardContent>
      </Card>

      {/* Show stats */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Show Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold gradient-text">{uniqueVoters}</p>
            <p className="text-xs text-gray-500">Active voters</p>
          </div>
        </CardContent>
      </Card>

      {/* Top song or time remaining */}
      {topSong ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Leading Song
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold line-clamp-1">{topSong.title}</p>
              <p className="text-sm text-gray-500">{topSong.votes} votes</p>
            </div>
          </CardContent>
        </Card>
      ) : votingEndsAt && timeRemaining && timeRemaining > 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Voting Ends In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold gradient-text">
                {daysRemaining}d {hoursRemaining}h
              </p>
              <p className="text-xs text-gray-500">Time remaining</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}