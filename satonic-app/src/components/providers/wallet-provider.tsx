'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUnisat } from '@/hooks/useUnisat'
import { BitcoinNetwork } from '@/services/unisat'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  isConnecting: boolean
  currentNetwork: string
  connect: () => Promise<boolean>
  checkConnection: () => Promise<boolean>
  switchNetwork: (network: BitcoinNetwork) => Promise<boolean>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useUnisat()

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