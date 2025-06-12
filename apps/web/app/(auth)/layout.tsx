export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-slate-900/20 to-slate-800/40 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}