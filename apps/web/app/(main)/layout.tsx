import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col"> {/* Use theme variables */}
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}