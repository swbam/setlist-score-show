
import { Vote, Users, Music, TrendingUp } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Vote,
      title: "Vote on Songs",
      description: "Vote for songs you want to hear at this show. The most voted songs rise to the top of the list."
    },
    {
      icon: Users,
      title: "Join Community", 
      description: "Anyone can add songs to the setlist. Select from the dropdown above to help build the perfect concert."
    },
    {
      icon: Music,
      title: "Discover Artists",
      description: "Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!"
    },
    {
      icon: TrendingUp,
      title: "How It Works",
      description: "Voting closes 2 hours before the show"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-900/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-cyan-600/20 rounded-xl flex items-center justify-center group-hover:bg-cyan-600/30 transition-colors">
                <feature.icon className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
