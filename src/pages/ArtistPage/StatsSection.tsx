
import { Card, CardContent } from "@/components/ui/card";
import VotingStats from "@/components/VotingStats";

interface StatsSectionProps {
  setlistId: string | null;
}

export function StatsSection({ setlistId }: StatsSectionProps) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6">Artist Stats</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {setlistId ? (
          <VotingStats setlistId={setlistId} />
        ) : (
          <Card className="bg-gray-900/40 border-gray-800/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Voting Stats</h3>
              <p className="text-gray-400">No setlist data available for this artist yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
