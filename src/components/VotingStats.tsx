
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

// Sample data for voting statistics
const data = [
  {
    name: "Mon",
    votes: 15,
  },
  {
    name: "Tue",
    votes: 23,
  },
  {
    name: "Wed",
    votes: 18,
  },
  {
    name: "Thu",
    votes: 32,
  },
  {
    name: "Fri",
    votes: 40,
  },
  {
    name: "Sat",
    votes: 25,
  },
  {
    name: "Sun",
    votes: 20,
  },
];

const VotingStats = () => {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">Voting Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar
                dataKey="votes"
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-white">145</p>
            <p className="text-xs text-gray-400">Total Votes</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">84</p>
            <p className="text-xs text-gray-400">Voters</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">12</p>
            <p className="text-xs text-gray-400">Songs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingStats;
