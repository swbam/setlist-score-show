
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4">
      {/* Background with grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23374151%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-white">Crowdsourced</span>
          <br />
          <span className="text-white">concert setlists </span>
          <span className="gradient-text">at scale.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Discover upcoming shows and vote on setlists for your favorite artists.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for artists, venues, or cities..."
            className="w-full pl-12 pr-4 py-4 text-lg bg-gray-900/80 border-gray-700 focus:border-cyan-500 rounded-xl"
          />
        </div>

        {/* Popular Searches */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <span className="text-gray-400">Popular searches:</span>
          {["Taylor Swift", "Drake", "Billie Eilish", "The Weeknd", "Bad Bunny"].map((artist) => (
            <Button
              key={artist}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-600"
            >
              {artist}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg">
            Explore Shows
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
          >
            How It Works
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
