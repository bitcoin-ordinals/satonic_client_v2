'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWallet, WalletType } from '@/hooks/useWallet'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  balance: number | null
  walletType: WalletType
  inscriptions: any[]
  totalInscriptions: number
  connectWallet: (walletType: WalletType) => Promise<void>
  disconnectWallet: () => void
  signMessage: (message: string) => Promise<string>
  fetchInscriptions: (addr: string, cursor?: number, size?: number) => Promise<any>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet()

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
} 