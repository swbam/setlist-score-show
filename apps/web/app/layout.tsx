import type { Metadata } from 'next'
import { Inter, Overpass } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const overpass = Overpass({ 
  subsets: ['latin'],
  variable: '--font-overpass',
})

export const metadata: Metadata = {
  title: 'Setlist Score Show',
  description: 'Vote on songs you want to hear at upcoming concerts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${overpass.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}