'use client'

import { ThemeProvider } from "next-themes"
import { WalletProvider } from "@/components/providers/wallet-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "react-hot-toast"
import Navbar from "@/components/layout/Navbar"
import { useAuthDebug } from "@/hooks/useAuthDebug"

export function Providers({ children }: { children: React.ReactNode }) {
  // Attach auth debugging to window
  useAuthDebug();
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <WalletProvider>
          <Navbar />
          {children}
          <Toaster position="bottom-right" />
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 