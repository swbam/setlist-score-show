import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}