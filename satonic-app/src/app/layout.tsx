import type { Metadata } from 'next'
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"

// Optimize font loading by properly configuring preload
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'Arial', 'sans-serif']
})

export const metadata: Metadata = {
  title: "NFT Ordinals Auction Platform",
  description: "Auction your Bitcoin Ordinals NFTs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${inter.variable} bg-background min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}