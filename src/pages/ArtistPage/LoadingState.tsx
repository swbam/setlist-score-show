
import AppHeader from "@/components/AppHeader";

export function LoadingState() {
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
