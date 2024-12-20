'use client'

import { ThemeProvider } from "../components/theme-provider"
import Navbar from "../components/layout/Navbar"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
} 