import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StayHub - Find Your Perfect Stay',
  description: 'Book hotels, apartments, and unique accommodations worldwide',
  keywords: 'hotel booking, accommodation, travel, vacation rental',
  authors: [{ name: 'StayHub Team' }],
  openGraph: {
    title: 'StayHub - Find Your Perfect Stay',
    description: 'Book hotels, apartments, and unique accommodations worldwide',
    url: 'https://stayhub.com',
    siteName: 'StayHub',
    images: [
      {
        url: 'https://stayhub.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}