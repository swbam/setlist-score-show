import { useState, useEffect } from 'react';
import { X, Music, Search, ThumbsUp, TrendingUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

interface UserOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const UserOnboarding = ({ onComplete, onSkip }: UserOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to TheSet!',
      description: 'Your voice shapes the concert experience',
      icon: Music,
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <Music className="h-12 w-12 text-white" />
          </div>
          <p className="text-gray-300">
            Join thousands of music fans voting on setlists for upcoming concerts. 
            Your votes help predict what songs will be played!
          </p>
        </div>
      )
    },
    {
      id: 'discover',
      title: 'Discover Shows',
      description: 'Find your favorite artists and upcoming concerts',
      icon: Search,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Search Artists</h4>
            <p className="text-sm text-gray-400">
              Use the search bar to find any artist and see their upcoming shows
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Browse Trending</h4>
            <p className="text-sm text-gray-400">
              Check out the most popular shows and see what other fans are excited about
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'vote',
      title: 'Vote on Setlists',
      description: 'Help create the perfect setlist',
      icon: ThumbsUp,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-cyan-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Song Name</span>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-cyan-400 font-medium">42</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Click the vote button to support songs you want to hear
            </p>
          </div>
          <p className="text-sm text-gray-300 text-center">
            Songs with the most votes rise to the top of the predicted setlist
          </p>
        </div>
      )
    },
    {
      id: 'compare',
      title: 'Compare Results',
      description: 'See how accurate the predictions were',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-cyan-400 mb-2">Fan Predicted</h4>
              <div className="space-y-1">
                <div className="text-xs text-gray-300">1. Song A ✓</div>
                <div className="text-xs text-gray-300">2. Song B ✓</div>
                <div className="text-xs text-gray-500">3. Song C</div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-green-400 mb-2">Actually Played</h4>
              <div className="space-y-1">
                <div className="text-xs text-gray-300">1. Song A</div>
                <div className="text-xs text-gray-300">2. Song B</div>
                <div className="text-xs text-gray-300">3. Song D</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-300 text-center">
            After concerts, compare the fan-voted setlist with what was actually played!
          </p>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('theset_onboarding_completed', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    localStorage.setItem('theset_onboarding_completed', 'true');
    setIsVisible(false);
    setTimeout(() => {
      if (onSkip) onSkip();
      else onComplete();
    }, 300);
  };

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem('theset_onboarding_completed');
    if (hasCompleted) {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className={cn(
        "w-full max-w-lg bg-gray-900 border-gray-800 transition-all duration-300",
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <currentStepData.icon className="h-6 w-6 text-cyan-400" />
            <Progress value={progress} className="flex-1 h-2" />
          </div>
          
          <CardTitle className="text-2xl text-white">
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    index === currentStep ? "bg-cyan-400" : "bg-gray-700"
                  )}
                />
              ))}
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboarding;